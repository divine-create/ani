from fastapi import APIRouter, BackgroundTasks, Depends
from db.session import get_db
from db.models import Briefing, User
from sqlalchemy.orm import Session
from agents import orchestrator
from core.auth import get_current_user

router = APIRouter()

@router.get("/briefing")
def get_latest_briefing(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    briefing = db.query(Briefing).filter(
        Briefing.type == "morning",
        Briefing.user_id == current_user.id,
    ).order_by(Briefing.created_at.desc()).first()
    if not briefing:
        return {"message": "No briefing yet. Trigger one manually."}
    return briefing.to_dict()

@router.post("/briefing/run")
async def trigger_briefing(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    background_tasks.add_task(orchestrator.run_morning_briefing, current_user, db)
    return {"status": "briefing started"}
