from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
from core.config import get_settings

cfg = get_settings()
bearer = HTTPBearer(auto_error=False)

def create_jwt(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=cfg.jwt_expire_hours)
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": expire},
        cfg.jwt_secret,
        algorithm=cfg.jwt_algorithm,
    )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(
            credentials.credentials, cfg.jwt_secret,
            algorithms=[cfg.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def decode_token_optional(token: str, db: Session) -> User | None:
    """For SSE endpoint — returns None instead of raising."""
    try:
        payload = jwt.decode(token, cfg.jwt_secret, algorithms=[cfg.jwt_algorithm])
        user_id = payload.get("sub")
        return db.query(User).filter(User.id == user_id).first()
    except JWTError:
        return None
