from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from core.config import get_settings

cfg = get_settings()

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

def get_google_credentials_for_user(user, db) -> Credentials:
    creds = Credentials(
        token=user.google_access_token,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=cfg.google_client_id,
        client_secret=cfg.google_client_secret,
        scopes=SCOPES,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        user.google_access_token = creds.token
        user.google_token_expiry = creds.expiry
        db.commit()
    return creds
