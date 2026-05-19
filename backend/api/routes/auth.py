from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from db.session import get_db
from db.models import User
from core.auth import create_jwt, get_current_user

router = APIRouter()

class GoogleAuthBody(BaseModel):
    google_id: str
    email: str
    name: str
    avatar_url: str = ""
    access_token: str
    refresh_token: str = ""
    token_expiry: str = ""

@router.post("/auth/google")
def google_signin(body: GoogleAuthBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.google_id == body.google_id).first()
    if not user:
        user = User(
            google_id=body.google_id,
            email=body.email,
            name=body.name,
            avatar_url=body.avatar_url,
        )
        db.add(user)

    user.google_access_token = body.access_token
    if body.refresh_token:
        user.google_refresh_token = body.refresh_token
    if body.token_expiry:
        try:
            user.google_token_expiry = datetime.fromisoformat(body.token_expiry.replace("Z", "+00:00"))
        except ValueError:
            pass
    user.name = body.name
    user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(user)

    return {"token": create_jwt(user.id, user.email), "user": user.to_dict()}

@router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user.to_dict()}
