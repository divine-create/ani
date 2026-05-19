import httpx
from core.config import get_settings

cfg = get_settings()
BASE = "https://nubela.co/proxycurl/api"

def _headers() -> dict:
    return {"Authorization": f"Bearer {cfg.proxycurl_api_key}"}

async def get_profile_by_url(linkedin_url: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE}/v2/linkedin",
            params={"url": linkedin_url},
            headers=_headers(),
            timeout=15
        )
        if resp.status_code == 200:
            return resp.json()
        return {}

async def get_profile_by_name(first_name: str, last_name: str = "", company: str = "") -> dict:
    async with httpx.AsyncClient() as client:
        params = {"first_name": first_name}
        if last_name:
            params["last_name"] = last_name
        if company:
            params["company_domain"] = company
        resp = await client.get(
            f"{BASE}/linkedin/profile/resolve",
            params=params,
            headers=_headers(),
            timeout=15
        )
        if resp.status_code == 200:
            return resp.json()
        return {}

def format_profile_summary(profile: dict) -> str:
    if not profile:
        return "Profile not found"
    name    = profile.get("full_name", "Unknown")
    title   = profile.get("headline", "")
    company = profile.get("experiences", [{}])[0].get("company", "") if profile.get("experiences") else ""
    summary = profile.get("summary", "")[:200] if profile.get("summary") else ""
    return f"{name} — {title} at {company}. {summary}".strip()
