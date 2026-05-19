from fastapi import APIRouter, BackgroundTasks, Depends
from db.session import get_db
from db.models import CalendarEvent, User
from sqlalchemy.orm import Session
from integrations.google_calendar import fetch_todays_events
from agents import orchestrator
from core.auth import get_current_user

router = APIRouter()

@router.get("/calendar")
def get_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fall back to stored events if user has no Google token (demo mode)
    if not current_user.google_access_token:
        stored = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id).all()
        return {"events": [e.to_dict() for e in stored]}

    try:
        events = fetch_todays_events(current_user, db)
    except Exception:
        stored = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id).all()
        return {"events": [e.to_dict() for e in stored]}

    stored = {
        e.gcal_event_id: e
        for e in db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id).all()
    }
    for ev in events:
        if ev["id"] in stored:
            ev["meeting_brief"] = stored[ev["id"]].meeting_brief
    return {"events": events}

@router.get("/calendar/{event_id}/brief")
def get_meeting_brief(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.gcal_event_id == event_id,
        CalendarEvent.user_id == current_user.id,
    ).first()
    if not event:
        return {"error": "Brief not generated yet"}
    return event.to_dict()

@router.post("/calendar/{event_id}/brief/generate")
async def generate_brief(
    event_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = fetch_todays_events(current_user, db)
    target = next((e for e in events if e["id"] == event_id), None)
    if not target:
        return {"error": "Event not found"}
    background_tasks.add_task(orchestrator.run_meeting_prep, current_user, db, target)
    return {"status": "generating"}
