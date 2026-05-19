import base64
import hashlib
import hmac
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from core.auth import decode_token_optional
from core.config import get_settings
from db.models import UserIntegration
from db.session import get_db

cfg = get_settings()
router = APIRouter()

OAUTH_CONFIGS: dict[str, dict] = {
    "slack": {
        "auth_url": "https://slack.com/oauth/v2/authorize",
        "scope": "chat:write,channels:read,incoming-webhook",
        "extra_params": {},
    },
    "notion": {
        "auth_url": "https://api.notion.com/v1/oauth/authorize",
        "scope": None,
        "extra_params": {"owner": "user"},
    },
    "calendly": {
        "auth_url": "https://auth.calendly.com/oauth/authorize",
        "scope": None,
        "extra_params": {},
    },
}


# ── State signing ──────────────────────────────────────────────────────────────

def _make_state(user_id: str, service: str) -> str:
    payload = f"{user_id}|{service}|{int(time.time())}"
    sig = hmac.new(
        key=cfg.jwt_secret.encode(),
        msg=payload.encode(),
        digestmod=hashlib.sha256,
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode()
    return base64.urlsafe_b64encode(f"{payload}|{sig_b64}".encode()).decode()


def _verify_state(state: str, max_age: int = 600) -> tuple[str, str]:
    try:
        raw = base64.urlsafe_b64decode(state.encode() + b"==").decode()
        *parts, sig_b64 = raw.split("|")
        payload = "|".join(parts)
        expected = hmac.new(
            key=cfg.jwt_secret.encode(),
            msg=payload.encode(),
            digestmod=hashlib.sha256,
        ).digest()
        actual = base64.urlsafe_b64decode(sig_b64.encode() + b"==")
        if not hmac.compare_digest(expected, actual):
            raise ValueError("bad signature")
        user_id, service, ts = payload.split("|")
        if time.time() - int(ts) > max_age:
            raise ValueError("state expired")
        return user_id, service
    except Exception as exc:
        raise ValueError(f"invalid state: {exc}") from exc


# ── DB helper ──────────────────────────────────────────────────────────────────

def _upsert(db: Session, user_id: str, service: str, api_key: str, extra: dict):
    row = db.query(UserIntegration).filter(
        UserIntegration.user_id == user_id,
        UserIntegration.service == service,
    ).first()
    if not row:
        row = UserIntegration(user_id=user_id, service=service)
        db.add(row)
    row.api_key = api_key
    row.extra_data = extra
    row.is_active = True
    db.commit()


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/oauth/{service}/start")
def oauth_start(
    service: str,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    if service not in OAUTH_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service}")

    user = decode_token_optional(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    oc = OAUTH_CONFIGS[service]
    state = _make_state(str(user.id), service)
    redirect_uri = f"http://localhost:8001/oauth/{service}/callback"

    client_id_map = {
        "slack": cfg.slack_client_id,
        "notion": cfg.notion_client_id,
        "calendly": cfg.calendly_client_id,
    }
    client_id = client_id_map[service]
    if not client_id:
        raise HTTPException(status_code=503, detail=f"{service} OAuth not configured — add {service.upper()}_CLIENT_ID to .env")

    params: dict = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "state": state,
        **oc["extra_params"],
    }
    if oc["scope"]:
        params["scope"] = oc["scope"]

    return RedirectResponse(url=f"{oc['auth_url']}?{urlencode(params)}", status_code=302)


@router.get("/oauth/{service}/callback")
async def oauth_callback(
    service: str,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    if service not in OAUTH_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service}")

    try:
        user_id, verified_service = _verify_state(state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if verified_service != service:
        raise HTTPException(status_code=400, detail="state/service mismatch")

    redirect_uri = f"http://localhost:8001/oauth/{service}/callback"

    try:
        if service == "slack":
            api_key, extra = await _exchange_slack(code, redirect_uri)
        elif service == "notion":
            api_key, extra = await _exchange_notion(code, redirect_uri)
        elif service == "calendly":
            api_key, extra = await _exchange_calendly(code, redirect_uri)
        else:
            raise HTTPException(status_code=404)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Provider error: {exc.response.text}")

    _upsert(db, user_id, service, api_key, extra)

    frontend_url = cfg.dashboard_url.rstrip("/")
    return RedirectResponse(url=f"{frontend_url}/settings?connected={service}", status_code=302)


# ── Token exchange ─────────────────────────────────────────────────────────────

async def _exchange_slack(code: str, redirect_uri: str) -> tuple[str, dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": cfg.slack_client_id,
                "client_secret": cfg.slack_client_secret,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    if not data.get("ok"):
        raise HTTPException(status_code=502, detail=f"Slack error: {data.get('error', 'unknown')}")

    extra: dict = {
        "team_name": data.get("team", {}).get("name", ""),
        "team_id": data.get("team", {}).get("id", ""),
    }
    webhook = data.get("incoming_webhook", {})
    if webhook.get("channel_id"):
        extra["channel_id"] = webhook["channel_id"]
        extra["channel_name"] = webhook.get("channel", "")

    return data["access_token"], extra


async def _exchange_notion(code: str, redirect_uri: str) -> tuple[str, dict]:
    credentials = base64.b64encode(
        f"{cfg.notion_client_id}:{cfg.notion_client_secret}".encode()
    ).decode()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.notion.com/v1/oauth/token",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json",
            },
            json={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    extra: dict = {
        "workspace_name": data.get("workspace_name", ""),
        "workspace_id": data.get("workspace_id", ""),
        "bot_id": data.get("bot_id", ""),
    }
    return data["access_token"], extra


async def _exchange_calendly(code: str, redirect_uri: str) -> tuple[str, dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://auth.calendly.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": cfg.calendly_client_id,
                "client_secret": cfg.calendly_client_secret,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    extra: dict = {
        "refresh_token": data.get("refresh_token", ""),
        "owner": data.get("owner", ""),
    }
    return data["access_token"], extra
