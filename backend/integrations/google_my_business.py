import httpx
from core.config import get_settings

GMB_BASE = "https://mybusiness.googleapis.com/v4"
RATING_MAP = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
cfg = get_settings()

def _get_token(user=None, db=None) -> str:
    if user and db and user.google_access_token:
        from .google_auth import get_google_credentials_for_user
        from google.auth.transport.requests import Request
        creds = get_google_credentials_for_user(user, db)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return creds.token
    return ""

async def fetch_reviews(account_id: str, location_id: str, user=None, db=None) -> list[dict]:
    token = _get_token(user, db)
    if not token:
        return []
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GMB_BASE}/accounts/{account_id}/locations/{location_id}/reviews",
            headers={"Authorization": f"Bearer {token}"}
        )
        resp.raise_for_status()
        return [parse_review(r) for r in resp.json().get("reviews", [])]

async def post_reply(account_id: str, location_id: str, review_id: str, reply: str, user=None, db=None):
    token = _get_token(user, db)
    if not token:
        return {}
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{GMB_BASE}/accounts/{account_id}/locations/{location_id}/reviews/{review_id}/reply",
            headers={"Authorization": f"Bearer {token}"},
            json={"comment": reply}
        )
        resp.raise_for_status()
        return resp.json()

def parse_review(raw: dict) -> dict:
    return {
        "id":           raw["reviewId"],
        "reviewer":     raw["reviewer"]["displayName"],
        "rating_str":   raw["starRating"],
        "rating":       RATING_MAP.get(raw["starRating"], 0),
        "body":         raw.get("comment", ""),
        "published_at": raw.get("createTime", ""),
        "has_reply":    "reviewReply" in raw,
    }
