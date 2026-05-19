from fastapi import APIRouter, Request, BackgroundTasks
from core.events import emit_event

router = APIRouter()

@router.post("/calendly")
async def calendly_webhook(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    event_type = data.get("event")

    if event_type == "invitee.created":
        payload = data.get("payload", {})
        name  = payload.get("name", "Unknown")
        email = payload.get("email", "")
        time  = payload.get("scheduled_event", {}).get("start_time", "")
        emit_event("calendly_booking", f"New booking: {name} ({email}) at {time}")

    return {"status": "ok"}
