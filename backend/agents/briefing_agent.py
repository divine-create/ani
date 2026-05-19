from core.llm import call_llm
from core.events import emit_event
from integrations.slack import send_morning_brief, send_text
from db.models import Briefing
from datetime import datetime


async def synthesize_morning_brief(user, db, comms: dict, calendar: list, reviews: dict) -> dict:
    emit_event("briefing_synthesis", "Synthesizing morning brief...")

    urgent_count    = len(comms.get("urgent", []))
    auto_handled    = len(comms.get("auto_handled", []))
    needs_review    = len(comms.get("needs_review", []))
    urgent_reviews  = len(reviews.get("urgent", []))
    total_decisions = urgent_count + needs_review + urgent_reviews

    prompt = f"""Write one specific, useful insight sentence for a morning briefing.

Stats:
- Urgent emails: {urgent_count}
- Auto-handled emails: {auto_handled}
- Events today: {len(calendar)}
- Urgent reviews: {urgent_reviews}
- First event: {calendar[0]['title'] if calendar else 'None'}

Be specific, not generic. Write only the one sentence."""

    insight = call_llm(prompt, max_tokens=100).strip()

    brief = {
        "date":               datetime.now().strftime("%A, %B %d"),
        "total_decisions":    total_decisions,
        "insight":            insight,
        "urgent_count":       urgent_count,
        "auto_handled_count": auto_handled,
        "needs_review_count": needs_review,
        "whatsapp_count":     0,
        "events":             [{"time": e["start"][11:16] if "T" in e["start"] else "", "title": e["title"]} for e in calendar[:3]],
        "new_reviews":        len(reviews.get("auto_posted", [])),
        "urgent_reviews":     urgent_reviews,
    }

    emit_event("slack_delivery", "Sending brief to Slack...")
    try:
        send_morning_brief(brief, user=user, db=db)
        emit_event("briefing_delivered", "Morning brief delivered to Slack")
    except Exception as e:
        emit_event("slack_error", f"Slack delivery failed: {str(e)}")

    db.add(Briefing(user_id=user.id, type="morning", content=brief))
    db.commit()

    return brief


async def synthesize_eod_summary(user, db, day_stats: dict) -> dict:
    emit_event("eod_synthesis", "Generating end-of-day summary...")

    prompt = f"""Write a concise end-of-day summary for a personal assistant app.

Today's stats: {day_stats}

Format (3 short sections):
1. What was handled autonomously (2-3 bullets)
2. What still needs attention (2-3 bullets)
3. One recommendation for tomorrow

Under 150 words total."""

    summary = call_llm(prompt, max_tokens=300)

    try:
        send_text(f"📋 *End of Day Summary*\n{summary}", user=user, db=db)
    except Exception:
        pass

    db.add(Briefing(user_id=user.id, type="eod", content={"summary": summary, "stats": day_stats}))
    db.commit()

    return {"summary": summary, "stats": day_stats}
