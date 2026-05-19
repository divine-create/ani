import httpx
from core.config import get_settings
from integrations.user_keys import get_key, get_extra

cfg = get_settings()
BASE = "https://api.calendly.com"


def _headers(user=None, db=None) -> dict:
    token = get_key(db, user, "calendly") or cfg.calendly_api_key
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


async def get_current_user(user=None, db=None) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE}/users/me", headers=_headers(user, db))
        resp.raise_for_status()
        return resp.json()["resource"]


async def get_primary_scheduling_link(user=None, db=None) -> str:
    u = await get_current_user(user, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE}/scheduling_links",
            headers=_headers(user, db),
            params={"owner": u["uri"]},
        )
        data = resp.json()
        if data.get("collection"):
            return data["collection"][0]["booking_url"]
        return u.get("scheduling_url", "")


async def get_upcoming_bookings(user=None, db=None) -> list[dict]:
    u = await get_current_user(user, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE}/scheduled_events",
            headers=_headers(user, db),
            params={"user": u["uri"], "status": "active"},
        )
        resp.raise_for_status()
        return resp.json().get("collection", [])
