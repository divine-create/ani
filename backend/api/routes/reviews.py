from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from db.session import get_db
from db.models import Review, User
from sqlalchemy.orm import Session
from integrations.google_my_business import post_reply
from core.config import get_settings
from core.auth import get_current_user
from agents import orchestrator
from datetime import datetime

router = APIRouter()
cfg = get_settings()

class ReplyBody(BaseModel):
    reply_text: str

@router.get("/reviews")
def get_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = db.query(Review).filter(
        Review.user_id == current_user.id,
    ).order_by(Review.created_at.desc()).limit(50).all()
    return {"reviews": [r.to_dict() for r in reviews]}

@router.post("/reviews/{review_id}/approve")
async def approve_review_reply(
    review_id: str,
    body: ReplyBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == current_user.id,
    ).first()
    if not review:
        return {"error": "Review not found"}

    await post_reply(cfg.gmb_account_id, cfg.gmb_location_id, review.gmb_review_id, body.reply_text)
    review.reply_posted = True
    review.reply_posted_at = datetime.utcnow()
    review.status = "posted"
    db.commit()
    return {"status": "posted"}

@router.post("/reviews/sync")
async def sync_reviews(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    background_tasks.add_task(orchestrator.run_review_check, current_user, db)
    return {"status": "sync started"}
