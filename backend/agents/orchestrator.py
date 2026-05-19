import asyncio
from core.events import emit_event
from agents import comms_agent, calendar_agent, gmb_agent, briefing_agent

async def run_morning_briefing(user, db) -> dict:
    emit_event("orchestrator_start", "Starting morning briefing cycle...")
    comms_result, calendar_result, reviews_result = await asyncio.gather(
        comms_agent.process_inbox(user, db),
        calendar_agent.get_todays_events(user, db),
        gmb_agent.check_reviews(user, db),
    )
    emit_event("data_collected", "All sources fetched — synthesizing...")
    brief = await briefing_agent.synthesize_morning_brief(
        user, db,
        comms=comms_result,
        calendar=calendar_result,
        reviews=reviews_result,
    )
    emit_event("orchestrator_done", "Morning briefing complete")
    return brief

async def run_inbox_cycle(user, db, manual: bool = False):
    emit_event("inbox_cycle_start", "Running inbox sync...")
    await comms_agent.process_inbox(user, db, manual=manual)
    emit_event("inbox_cycle_done", "Inbox sync complete")

async def run_meeting_prep(user, db, event: dict):
    emit_event("meeting_prep_start", f"Preparing brief for: {event['title']}")
    await calendar_agent.generate_meeting_brief(user, db, event)

async def run_review_check(user, db):
    emit_event("review_check_start", "Checking reviews...")
    await gmb_agent.check_reviews(user, db)

async def run_eod_summary(user, db):
    from db.models import Message
    from datetime import datetime, date
    today = date.today()
    auto_handled = db.query(Message).filter(
        Message.user_id == user.id,
        Message.auto_sent == True,
        Message.auto_sent_at >= datetime.combine(today, datetime.min.time())
    ).count()
    urgent = db.query(Message).filter(
        Message.user_id == user.id,
        Message.priority == "urgent",
        Message.created_at >= datetime.combine(today, datetime.min.time())
    ).count()
    stats = {"auto_handled_today": auto_handled, "urgent_today": urgent}
    await briefing_agent.synthesize_eod_summary(user, db, stats)
