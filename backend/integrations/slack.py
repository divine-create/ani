from slack_sdk import WebClient
from core.config import get_settings

cfg = get_settings()


def get_client(token: str = None) -> WebClient:
    return WebClient(token=token or cfg.slack_bot_token)


def _channel(user=None, db=None) -> str:
    from integrations.user_keys import get_extra
    return get_extra(db, user, "slack").get("channel_id") or cfg.slack_channel_id


def _token(user=None, db=None) -> str:
    from integrations.user_keys import get_key
    return get_key(db, user, "slack") or cfg.slack_bot_token


def send_morning_brief(brief: dict, user=None, db=None):
    token = _token(user, db)
    channel = _channel(user, db)
    if not token or not channel:
        return
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": f"☀️  Good morning — {brief['date']}"}},
        {"type": "section", "text": {"type": "mrkdwn",
            "text": f"*You have {brief['total_decisions']} decisions today.* Everything else is handled.\n\n_{brief.get('insight', '')}_"}},
        {"type": "divider"},
        {"type": "section", "fields": [
            {"type": "mrkdwn", "text": f"*📅 Events today*\n{len(brief.get('events', []))} meetings"},
            {"type": "mrkdwn", "text": f"*📬 Inbox*\n🔴 {brief['urgent_count']} urgent · ✅ {brief['auto_handled_count']} handled"},
        ]},
        {"type": "section", "fields": [
            {"type": "mrkdwn", "text": f"*💬 WhatsApp*\n{brief.get('whatsapp_count', 0)} messages"},
            {"type": "mrkdwn", "text": f"*⭐ Reviews*\n{brief.get('urgent_reviews', 0)} need attention"},
        ]},
        {"type": "actions", "elements": [
            {"type": "button", "text": {"type": "plain_text", "text": "Open Dashboard"},
             "url": cfg.dashboard_url, "style": "primary"}
        ]}
    ]
    get_client(token).chat_postMessage(channel=channel, text="Morning Brief", blocks=blocks)


def send_urgent_alert(title: str, body: str, channel: str = "gmail", user=None, db=None):
    token = _token(user, db)
    slack_channel = _channel(user, db)
    if not token or not slack_channel:
        return
    emoji = "📧" if channel == "gmail" else "💬"
    get_client(token).chat_postMessage(
        channel=slack_channel,
        text=f"{emoji} *URGENT* — {title}\n>{body[:200]}"
    )


def send_text(text: str, user=None, db=None):
    token = _token(user, db)
    channel = _channel(user, db)
    if not token or not channel:
        return
    get_client(token).chat_postMessage(channel=channel, text=text)
