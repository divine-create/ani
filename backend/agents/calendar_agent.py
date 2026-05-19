from core.llm import call_llm
from core.events import emit_event
from integrations.google_calendar import fetch_todays_events, fetch_upcoming_events
from integrations.google_drive import find_docs_for_meeting
from integrations.linkedin import get_profile_by_name, format_profile_summary
from integrations.gmail import search_emails
from db.models import CalendarEvent
from datetime import datetime
import json


async def get_todays_events(user, db) -> list[dict]:
    emit_event("calendar_sync", "Fetching today's calendar...")
    events = fetch_todays_events(user, db)
    emit_event("calendar_fetched", f"Found {len(events)} events today")
    return events

async def generate_meeting_brief(user, db, event: dict) -> dict:
    emit_event("meeting_prep", f"Preparing brief for: {event['title']}")
    attendees = event.get("attendees", [])

    profiles = []
    for a in attendees:
        emit_event("linkedin_lookup", f"Looking up {a['name']}...")
        parts = a["name"].split()
        first = parts[0] if parts else a["name"]
        last  = parts[-1] if len(parts) > 1 else ""
        profile = await get_profile_by_name(first, last)
        profiles.append(format_profile_summary(profile))

    emit_event("drive_search", "Searching relevant documents...")
    docs = find_docs_for_meeting(user, db, [a["name"] for a in attendees], event["title"])

    past_emails = []
    for a in attendees:
        emails = search_emails(user, db, f"from:{a['email']}", max_results=2)
        past_emails.extend(emails)

    prompt = f"""Write a concise pre-meeting brief (max 300 words).

Meeting: {event['title']}
Time: {event['start']}
Attendees: {json.dumps([a['name'] for a in attendees])}

LinkedIn profiles:
{chr(10).join(profiles)}

Relevant docs found: {[d['name'] for d in docs]}

Recent email context:
{chr(10).join([f"- {e.get('subject','')}: {e.get('snippet','')}" for e in past_emails[:3]])}

Structure:
1. Who you're meeting (role, company, key background — 2 lines)
2. Relationship context (what you've discussed — 2 lines)
3. Open action items between you (bullet list)
4. 3 suggested talking points (bullet list)
5. Docs to have ready (list filenames)"""

    brief_text = call_llm(prompt, max_tokens=600)
    emit_event("meeting_brief_ready", f"Brief ready for: {event['title']}")

    record = db.query(CalendarEvent).filter(
        CalendarEvent.gcal_event_id == event["id"],
        CalendarEvent.user_id == user.id,
    ).first()
    if not record:
        record = CalendarEvent(gcal_event_id=event["id"], user_id=user.id)
        db.add(record)
    record.title = event["title"]
    record.attendees = attendees
    record.meeting_brief = brief_text
    record.brief_generated_at = datetime.utcnow()
    record.meet_link = event.get("meet_link", "")
    db.commit()

    return {"event": event, "brief": brief_text, "docs": docs}
