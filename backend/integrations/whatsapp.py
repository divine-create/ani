from twilio.rest import Client
from core.config import get_settings

cfg = get_settings()


def get_client(account_sid: str = None, auth_token: str = None) -> Client:
    return Client(
        account_sid or cfg.twilio_account_sid,
        auth_token or cfg.twilio_auth_token,
    )


def send_whatsapp_message(to: str, body: str, user=None, db=None) -> str:
    from integrations.user_keys import get_key, get_extra
    account_sid = get_key(db, user, "whatsapp") or cfg.twilio_account_sid
    extra = get_extra(db, user, "whatsapp")
    auth_token = extra.get("auth_token") or cfg.twilio_auth_token
    from_number = extra.get("phone_number") or cfg.twilio_whatsapp_number

    to_fmt = f"whatsapp:{to}" if not to.startswith("whatsapp:") else to
    msg = get_client(account_sid, auth_token).messages.create(
        from_=f"whatsapp:{from_number}",
        body=body,
        to=to_fmt,
    )
    return msg.sid


def parse_inbound(form_data: dict) -> dict:
    return {
        "id":        form_data.get("MessageSid", ""),
        "from":      form_data.get("From", "").replace("whatsapp:", ""),
        "from_name": form_data.get("ProfileName", ""),
        "body":      form_data.get("Body", ""),
        "timestamp": form_data.get("Timestamp", ""),
        "channel":   "whatsapp",
    }
