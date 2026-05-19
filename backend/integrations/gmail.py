from googleapiclient.discovery import build
from .google_auth import get_google_credentials_for_user
from email.mime.text import MIMEText
import base64, time

def get_service(user, db):
    return build("gmail", "v1", credentials=get_google_credentials_for_user(user, db))

def fetch_inbox(user, db, max_results: int = 50) -> list[dict]:
    service = get_service(user, db)
    results = service.users().messages().list(
        userId="me", labelIds=["INBOX"], maxResults=max_results
    ).execute()
    messages = []
    for msg in results.get("messages", []):
        try:
            detail = service.users().messages().get(
                userId="me", id=msg["id"], format="full"
            ).execute()
            messages.append(parse_email(detail))
        except Exception:
            continue
    return messages

def poll_new_emails(user, db) -> list[dict]:
    fifteen_min_ago = int(time.time()) - 900
    service = get_service(user, db)
    results = service.users().messages().list(
        userId="me", q=f"after:{fifteen_min_ago} in:inbox"
    ).execute()
    messages = []
    for msg in results.get("messages", []):
        try:
            detail = service.users().messages().get(
                userId="me", id=msg["id"], format="full"
            ).execute()
            messages.append(parse_email(detail))
        except Exception:
            continue
    return messages

def parse_email(raw: dict) -> dict:
    headers = {h["name"]: h["value"] for h in raw["payload"]["headers"]}
    return {
        "id":      raw["id"],
        "from":    headers.get("From", ""),
        "to":      headers.get("To", ""),
        "subject": headers.get("Subject", ""),
        "date":    headers.get("Date", ""),
        "body":    _extract_body(raw["payload"]),
        "snippet": raw.get("snippet", ""),
    }

def _extract_body(payload: dict) -> str:
    if payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
    for part in payload.get("parts", []):
        if part["mimeType"] == "text/plain" and part.get("body", {}).get("data"):
            return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
    return ""

def _build_raw_message(to: str, subject: str, body: str) -> dict:
    msg = MIMEText(body)
    msg["to"] = to
    msg["subject"] = subject
    return {"raw": base64.urlsafe_b64encode(msg.as_bytes()).decode()}

def send_email(user, db, to: str, subject: str, body: str) -> str:
    service = get_service(user, db)
    sent = service.users().messages().send(
        userId="me", body=_build_raw_message(to, subject, body)
    ).execute()
    return sent["id"]

def create_draft(user, db, to: str, subject: str, body: str) -> str:
    service = get_service(user, db)
    draft = service.users().drafts().create(
        userId="me", body={"message": _build_raw_message(to, subject, body)}
    ).execute()
    return draft["id"]

def search_emails(user, db, query: str, max_results: int = 5) -> list[dict]:
    service = get_service(user, db)
    results = service.users().messages().list(
        userId="me", q=query, maxResults=max_results
    ).execute()
    messages = []
    for msg in results.get("messages", []):
        try:
            detail = service.users().messages().get(
                userId="me", id=msg["id"], format="full"
            ).execute()
            messages.append(parse_email(detail))
        except Exception:
            continue
    return messages
