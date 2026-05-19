import os
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import MeetingRecord, Task, Message, CalendarEvent
from core.auth import get_current_user
from core.config import get_settings
from integrations.gemini import analyze_meeting

router = APIRouter()

UPLOAD_DIR = "/tmp/ani_meetings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME = {
    "audio/mp4", "audio/mpeg", "audio/wav", "audio/webm",
    "audio/ogg", "audio/flac", "video/mp4", "video/webm",
    "audio/x-m4a", "audio/aac",
}


@router.post("/meetings/upload")
async def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cfg = get_settings()
    if not cfg.gemini_api_key:
        raise HTTPException(status_code=503, detail="Gemini API key not configured")

    content_type = file.content_type or "audio/mp4"
    if content_type not in ALLOWED_MIME:
        # Accept anyway — Gemini handles most formats
        content_type = "audio/mp4"

    ext = os.path.splitext(file.filename or "meeting.mp4")[1] or ".mp4"
    local_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{ext}")

    data = await file.read()
    with open(local_path, "wb") as f:
        f.write(data)

    record = MeetingRecord(
        user_id=current_user.id,
        filename=file.filename or "meeting",
        status="processing",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    background_tasks.add_task(
        _process_meeting, record.id, local_path, content_type, current_user.id
    )

    return {"meeting_id": record.id, "status": "processing"}


@router.get("/meetings/{meeting_id}")
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    record = db.query(MeetingRecord).filter(
        MeetingRecord.id == meeting_id,
        MeetingRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    return record.to_dict()


@router.get("/meetings")
def list_meetings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    records = db.query(MeetingRecord).filter(
        MeetingRecord.user_id == current_user.id,
    ).order_by(MeetingRecord.created_at.desc()).limit(20).all()
    return {"meetings": [r.to_dict() for r in records]}


def _process_meeting(meeting_id: str, file_path: str, mime_type: str, user_id: str):
    from db.session import SessionLocal
    db = SessionLocal()
    try:
        record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
        if not record:
            return

        extracted = analyze_meeting(file_path, mime_type)

        record.summary = extracted.get("summary", "")
        record.extracted = extracted
        record.status = "done"

        # Create tasks from action items
        for item in extracted.get("action_items", []):
            task = Task(
                user_id=user_id,
                title=item.get("title", ""),
                description=f"From meeting: {extracted.get('title', '')}. Owner: {item.get('owner', 'Me')}",
                source="meeting",
                contact_name=item.get("owner"),
                due_date=item.get("due_date"),
                priority=item.get("priority", "Normal"),
                status="open",
            )
            db.add(task)

        # Create draft follow-up emails as inbox messages
        for email in extracted.get("follow_up_emails", []):
            msg = Message(
                user_id=user_id,
                channel="gmail",
                external_id=f"meeting-followup-{uuid.uuid4()}",
                from_address=email.get("to_email", ""),
                from_name=email.get("to_name", ""),
                subject=email.get("subject", "Follow-up"),
                body=f"[Draft follow-up from meeting: {extracted.get('title', '')}]",
                received_at=datetime.now(timezone.utc),
                priority="normal",
                intent="meeting_followup",
                status="needs_review",
                draft_reply=email.get("body", ""),
            )
            db.add(msg)

        db.commit()
    except Exception as e:
        record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
        if record:
            record.status = "failed"
            record.summary = str(e)
            db.commit()
    finally:
        db.close()
        try:
            os.remove(file_path)
        except Exception:
            pass
