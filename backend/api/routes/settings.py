from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db.session import get_db
from db.models import AutomationRule, UserSettings, UserIntegration, User
from sqlalchemy.orm import Session
from core.auth import get_current_user

router = APIRouter()

class RuleBody(BaseModel):
    name: str
    channel: str
    condition_type: str
    condition_value: str
    action: str
    action_template: str = ""

@router.get("/settings/integrations")
def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    google_connected = bool(current_user.google_access_token)

    def has_integration(service: str) -> bool:
        row = db.query(UserIntegration).filter(
            UserIntegration.user_id == current_user.id,
            UserIntegration.service == service,
            UserIntegration.is_active == True,
        ).first()
        return row is not None

    return {
        "integrations": [
            {"id": "gmail",    "name": "Gmail",             "connected": google_connected},
            {"id": "calendar", "name": "Google Calendar",   "connected": google_connected},
            {"id": "drive",    "name": "Google Drive",      "connected": google_connected},
            {"id": "gmb",      "name": "Google My Business","connected": has_integration("gmb")},
            {"id": "whatsapp", "name": "WhatsApp",          "connected": has_integration("whatsapp")},
            {"id": "notion",   "name": "Notion",            "connected": has_integration("notion")},
            {"id": "slack",    "name": "Slack",             "connected": has_integration("slack")},
            {"id": "calendly", "name": "Calendly",          "connected": has_integration("calendly")},
            {"id": "linkedin", "name": "LinkedIn",          "connected": has_integration("linkedin")},
        ]
    }

class IntegrationKeyBody(BaseModel):
    service: str
    api_key: str = ""
    extra_data: dict = {}

@router.post("/settings/integrations")
def save_integration(
    body: IntegrationKeyBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(UserIntegration).filter(
        UserIntegration.user_id == current_user.id,
        UserIntegration.service == body.service,
    ).first()
    if not row:
        row = UserIntegration(user_id=current_user.id, service=body.service)
        db.add(row)
    row.api_key = body.api_key
    row.extra_data = body.extra_data
    row.is_active = True
    db.commit()
    return {"status": "saved", "service": body.service}

@router.get("/settings/rules")
def get_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = db.query(AutomationRule).filter(
        AutomationRule.user_id == current_user.id,
        AutomationRule.is_active == True,
    ).all()
    return {"rules": [r.to_dict() for r in rules]}

@router.post("/settings/rules")
def create_rule(
    body: RuleBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = AutomationRule(user_id=current_user.id, **body.dict())
    db.add(rule)
    db.commit()
    return rule.to_dict()

@router.delete("/settings/rules/{rule_id}")
def delete_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id,
    ).first()
    if rule:
        rule.is_active = False
        db.commit()
    return {"status": "deleted"}

class WritingStyleBody(BaseModel):
    samples: list[str]

@router.get("/settings/writing-style")
def get_writing_style_endpoint(current_user: User = Depends(get_current_user)):
    from memory.store import get_writing_style
    style = get_writing_style(user_id=current_user.id)
    return {"style": style or ""}

@router.post("/settings/writing-style")
def save_writing_style(
    body: WritingStyleBody,
    current_user: User = Depends(get_current_user),
):
    from memory.store import store_sent_email
    for sample in body.samples:
        if sample.strip():
            store_sent_email(sample.strip(), user_id=current_user.id)
    return {"status": "saved", "count": len(body.samples)}

class AutoReplyToggleBody(BaseModel):
    enabled: bool

@router.get("/settings/auto-reply")
def get_auto_reply(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not row:
        row = UserSettings(user_id=current_user.id, auto_reply_enabled=True)
        db.add(row)
        db.commit()
    return {"enabled": row.auto_reply_enabled}

@router.post("/settings/auto-reply")
def set_auto_reply(
    body: AutoReplyToggleBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not row:
        row = UserSettings(user_id=current_user.id, auto_reply_enabled=body.enabled)
        db.add(row)
    else:
        row.auto_reply_enabled = body.enabled
    db.commit()
    return {"enabled": row.auto_reply_enabled}
