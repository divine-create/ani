from fastapi import APIRouter, Depends
from db.session import get_db
from db.models import Message, Task, User
from sqlalchemy.orm import Session
from sqlalchemy import or_
from core.auth import get_current_user

router = APIRouter()

@router.get("/search")
def search(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not q or len(q) < 2:
        return {"messages": [], "tasks": []}

    like = f"%{q}%"

    messages = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.status != "noise",
        or_(
            Message.subject.ilike(like),
            Message.from_address.ilike(like),
            Message.from_name.ilike(like),
        ),
    ).order_by(Message.received_at.desc()).limit(6).all()

    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.title.ilike(like),
        Task.status != "done",
    ).limit(4).all()

    return {
        "messages": [m.to_dict() for m in messages],
        "tasks": [t.to_dict() for t in tasks],
    }
