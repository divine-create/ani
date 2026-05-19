from googleapiclient.discovery import build
from .google_auth import get_google_credentials_for_user
from datetime import datetime, timedelta
import pytz

def get_service(user, db):
    return build("calendar", "v3", credentials=get_google_credentials_for_user(user, db))

def fetch_todays_events(user, db, timezone: str = "UTC") -> list[dict]:
    tz = pytz.timezone(timezone)
    now = datetime.now(tz)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    end   = now.replace(hour=23, minute=59, second=59).isoformat()
    return _fetch_events(user, db, start, end)

def fetch_upcoming_events(user, db, hours_ahead: int = 1) -> list[dict]:
    now    = datetime.utcnow().isoformat() + "Z"
    future = (datetime.utcnow() + timedelta(hours=hours_ahead)).isoformat() + "Z"
    return _fetch_events(user, db, now, future)

def _fetch_events(user, db, time_min: str, time_max: str) -> list[dict]:
    service = get_service(user, db)
    result = service.events().list(
        calendarId="primary",
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy="startTime"
    ).execute()
    return [_parse_event(e) for e in result.get("items", [])]

def _parse_event(event: dict) -> dict:
    return {
        "id":          event["id"],
        "title":       event.get("summary", "No title"),
        "start":       event["start"].get("dateTime", event["start"].get("date")),
        "end":         event["end"].get("dateTime", event["end"].get("date")),
        "attendees":   [
            {"email": a["email"], "name": a.get("displayName", a["email"])}
            for a in event.get("attendees", [])
            if not a.get("self", False)
        ],
        "meet_link":   event.get("hangoutLink", ""),
        "description": event.get("description", ""),
    }
