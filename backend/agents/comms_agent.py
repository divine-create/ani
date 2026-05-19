from core.llm import call_llm
from core.config import get_settings
from core.events import emit_event
from core.classifier import classify_message, extract_commitments
from integrations.gmail import fetch_inbox, send_email, poll_new_emails
from integrations.whatsapp import send_whatsapp_message
from integrations.notion import create_task
from memory.store import get_writing_style
from db.models import Message, AutomationRule, UserSettings


def apply_rules(db, user_id: str, from_addr: str, subject: str, body: str, intent: str) -> dict | None:
    """Return rule override dict or None if no rule matches."""
    rules = db.query(AutomationRule).filter(
        AutomationRule.user_id == user_id,
        AutomationRule.is_active == True
    ).all()
    from_lower = from_addr.lower()
    subject_lower = (subject or "").lower()
    body_lower = (body or "").lower()

    for rule in rules:
        val = (rule.condition_value or "").lower()
        matched = False
        if rule.condition_type == "sender":
            matched = val in from_lower
        elif rule.condition_type == "keyword":
            matched = val in subject_lower or val in body_lower
        elif rule.condition_type == "intent":
            matched = val == intent
        elif rule.condition_type == "domain":
            matched = from_lower.endswith("@" + val) or from_lower.endswith("." + val + ">")

        if matched:
            return {"action": rule.action, "rule_name": rule.name}
    return None


def draft_reply(user, db, from_addr: str, subject: str, body: str, style: str = "", intent: str = "") -> str:
    scheduling_context = ""
    if intent == "scheduling":
        try:
            from integrations.google_calendar import fetch_upcoming_events
            events = fetch_upcoming_events(user, db, hours_ahead=168)
            busy = [e["start"] for e in events[:5]]
            scheduling_context = f"\n\nCalendar context: already booked at {busy}. Suggest alternative free slots when replying to scheduling requests."
        except Exception:
            pass

    prompt = f"""Draft a reply to this message.

Writing style: {style or "Professional, warm, concise. First name basis."}{scheduling_context}

Original:
From: {from_addr}
Subject: {subject or "N/A"}
Body: {body[:500]}

Write only the reply body. No subject line. No preamble."""

    return call_llm(prompt, max_tokens=500)


async def process_inbox(user, db, manual: bool = False) -> dict:
    emit_event("gmail_sync", "Fetching Gmail inbox...")

    if manual:
        messages = fetch_inbox(user, db, max_results=50)
    else:
        has_messages = db.query(Message).filter(Message.user_id == user.id).first() is not None
        messages = poll_new_emails(user, db) if has_messages else fetch_inbox(user, db, max_results=30)

    emit_event("gmail_fetched", f"Fetched {len(messages)} new emails")

    style = get_writing_style(user_id=user.id)
    results = {"urgent": [], "auto_handled": [], "needs_review": [], "noise": []}

    settings_row = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    auto_reply_enabled = settings_row.auto_reply_enabled if settings_row else True

    for msg in messages:
        existing = db.query(Message).filter(Message.external_id == msg["id"]).first()
        if existing:
            continue

        clf = classify_message(msg["from"], msg.get("subject", ""), msg["body"])
        emit_event("message_classified",
            f"{msg.get('subject', 'No subject')[:40]} → {clf['priority']}")

        if clf.get("commitment_detected"):
            commitments = extract_commitments(msg["body"])
            for c in commitments:
                create_task(title=c["text"], source="Gmail",
                            contact=msg["from"], due_date=c.get("due_date"))
                emit_event("task_created", f"Task: {c['text'][:50]}")

        draft = draft_reply(user, db, msg["from"], msg.get("subject", ""), msg["body"], style, clf.get("intent", ""))

        rule_match = apply_rules(db, user.id, msg["from"], msg.get("subject", ""), msg["body"], clf["intent"])
        effective_action = rule_match["action"] if rule_match else None
        if rule_match:
            emit_event("rule_matched", f"Rule '{rule_match['rule_name']}' → {rule_match['action']}")

        record = Message(
            user_id=user.id,
            channel="gmail", external_id=msg["id"],
            from_address=msg["from"], subject=msg.get("subject"),
            body=msg["body"], received_at=__import__("datetime").datetime.utcnow(),
            priority=clf["priority"], intent=clf["intent"],
            draft_reply=draft,
        )

        if effective_action == "auto_reply":
            if auto_reply_enabled:
                try:
                    send_email(user, db, msg["from"], f"Re: {msg.get('subject','')}", draft)
                    record.status = "auto_handled"
                    record.auto_sent = True
                    record.auto_sent_at = __import__("datetime").datetime.utcnow()
                    results["auto_handled"].append(msg)
                    emit_event("auto_reply_sent", f"Auto-replied to {msg['from']} (rule)")
                except Exception as e:
                    record.status = "needs_review"
                    results["needs_review"].append({**msg, "draft": draft})
                    emit_event("auto_reply_error", f"Auto-reply failed: {str(e)[:60]}")
            else:
                record.status = "needs_review"
                results["needs_review"].append({**msg, "draft": draft})
                emit_event("auto_reply_paused", f"Auto-reply paused — {msg['from']} queued for review")
        elif effective_action == "flag_urgent":
            record.status = "needs_review"
            record.priority = "urgent"
            results["urgent"].append(msg)
            emit_event("urgent_flagged", f"URGENT (rule): {msg.get('subject','')[:50]}")
        elif effective_action == "archive":
            record.status = "noise"
            results["noise"].append(msg)
        elif effective_action == "create_task":
            record.status = "needs_review"
            results["needs_review"].append({**msg, "draft": draft})
        else:
            priority = clf["priority"]
            if priority == "noise":
                record.status = "noise"
                results["noise"].append(msg)
            elif priority == "routine":
                if auto_reply_enabled:
                    try:
                        send_email(user, db, msg["from"], f"Re: {msg.get('subject','')}", draft)
                        record.status = "auto_handled"
                        record.auto_sent = True
                        record.auto_sent_at = __import__("datetime").datetime.utcnow()
                        results["auto_handled"].append(msg)
                        emit_event("auto_reply_sent", f"Auto-replied to {msg['from']}")
                    except Exception as e:
                        record.status = "needs_review"
                        results["needs_review"].append({**msg, "draft": draft})
                        emit_event("auto_reply_error", f"Auto-reply failed: {str(e)[:60]}")
                else:
                    record.status = "needs_review"
                    results["needs_review"].append({**msg, "draft": draft})
                    emit_event("auto_reply_paused", f"Auto-reply paused — routine email queued")
            elif priority == "urgent":
                record.status = "needs_review"
                results["urgent"].append(msg)
                emit_event("urgent_flagged", f"URGENT: {msg.get('subject','')[:50]}")
            else:
                record.status = "needs_review"
                results["needs_review"].append({**msg, "draft": draft})

        db.add(record)
        db.commit()

    return results


async def handle_whatsapp_message(message: dict):
    emit_event("whatsapp_received", f"WhatsApp from {message['from']}: {message['body'][:50]}")
    from db.session import SessionLocal
    from db.models import User
    clf = classify_message(message["from"], "", message["body"])
    db = SessionLocal()

    try:
        existing = db.query(Message).filter(Message.external_id == message["id"]).first()
        if existing:
            return

        # Associate with first registered user for shared WhatsApp inbox
        first_user = db.query(User).order_by(User.created_at).first()
        user_id = first_user.id if first_user else None

        draft = call_llm(f"Draft a brief WhatsApp reply to: {message['body'][:300]}", max_tokens=200)
        record = Message(
            user_id=user_id,
            channel="whatsapp", external_id=message["id"],
            from_address=message["from"], from_name=message.get("from_name"),
            body=message["body"],
            received_at=__import__("datetime").datetime.utcnow(),
            priority=clf["priority"], intent=clf["intent"], draft_reply=draft,
        )

        if clf["action"] == "auto_reply" and clf["priority"] == "routine":
            send_whatsapp_message(message["from"], draft)
            record.status = "auto_handled"
            record.auto_sent = True
            record.auto_sent_at = __import__("datetime").datetime.utcnow()
            emit_event("whatsapp_auto_replied", f"Auto-replied to {message['from']}")
        else:
            record.status = "needs_review"
            emit_event("whatsapp_flagged", f"Flagged for review from {message['from']}")

        db.add(record)
        db.commit()
    finally:
        db.close()
