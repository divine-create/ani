from fastapi import APIRouter, Depends
from db.session import get_db
from db.models import Message, Task, User
from sqlalchemy.orm import Session
from core.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter()

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    auto_handled_today = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.auto_sent == True,
        Message.auto_sent_at >= today,
    ).count()

    total_auto_handled = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.auto_sent == True,
    ).count()

    urgent_count = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.priority == "urgent",
        Message.status == "needs_review",
    ).count()

    needs_review = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.status == "needs_review",
    ).count()

    open_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["open", "in_progress"]),
    ).count()

    commitments = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.source == "Gmail",
    ).count()

    return {
        "auto_handled_today": auto_handled_today,
        "total_auto_handled": total_auto_handled,
        "time_saved_mins": total_auto_handled * 3,
        "urgent_count": urgent_count,
        "needs_review": needs_review,
        "open_tasks": open_tasks,
        "commitments_extracted": commitments,
    }
