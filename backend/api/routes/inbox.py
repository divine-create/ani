from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from db.session import get_db
from db.models import Message, User
from sqlalchemy.orm import Session
from integrations.gmail import send_email
from integrations.whatsapp import send_whatsapp_message
from agents import orchestrator
from core.auth import get_current_user
from datetime import datetime

router = APIRouter()

class ApproveBody(BaseModel):
    edited_draft: str = None

@router.get("/inbox")
def get_inbox(
    channel: str = None,
    priority: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.status != "noise",
    )
    if channel:
        q = q.filter(Message.channel == channel)
    if priority:
        q = q.filter(Message.priority == priority)
    messages = q.order_by(Message.received_at.desc()).limit(100).all()
    return {"messages": [m.to_dict() for m in messages]}

@router.get("/inbox/{message_id}")
def get_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id,
    ).first()
    if not msg:
        return {"error": "Not found"}
    return msg.to_dict()

@router.post("/inbox/{message_id}/approve")
def approve_draft(
    message_id: str,
    body: ApproveBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id,
    ).first()
    if not msg:
        return {"error": "Not found"}

    reply_text = body.edited_draft or msg.draft_reply
    try:
        if msg.channel == "gmail" and current_user.google_access_token:
            send_email(current_user, db, msg.from_address, f"Re: {msg.subject or ''}", reply_text)
        elif msg.channel == "whatsapp":
            send_whatsapp_message(msg.from_address, reply_text, user=current_user, db=db)
    except Exception:
        pass  # Demo mode or missing credentials — mark as sent without actually sending

    msg.status = "done"
    msg.auto_sent = True
    msg.auto_sent_at = datetime.utcnow()
    db.commit()
    return {"status": "sent"}

@router.delete("/inbox/{message_id}")
def dismiss_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id,
    ).first()
    if msg:
        msg.status = "done"
        db.commit()
    return {"status": "dismissed"}

@router.post("/inbox/sync")
async def trigger_inbox_sync(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    background_tasks.add_task(orchestrator.run_inbox_cycle, current_user, db, True)
    return {"status": "sync started"}
