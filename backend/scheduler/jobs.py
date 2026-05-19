from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime

scheduler = AsyncIOScheduler()

def _get_all_users(db):
    from db.models import User
    return db.query(User).all()

def start_scheduler():
    from agents import orchestrator

    async def _morning():
        from db.session import SessionLocal
        db = SessionLocal()
        try:
            for user in _get_all_users(db):
                try:
                    await orchestrator.run_morning_briefing(user, db)
                except Exception as e:
                    print(f"Morning briefing failed for {user.email}: {e}")
        finally:
            db.close()

    async def _inbox():
        from db.session import SessionLocal
        db = SessionLocal()
        try:
            for user in _get_all_users(db):
                try:
                    await orchestrator.run_inbox_cycle(user, db)
                except Exception as e:
                    print(f"Inbox cycle failed for {user.email}: {e}")
        finally:
            db.close()

    async def _reviews():
        from db.session import SessionLocal
        db = SessionLocal()
        try:
            for user in _get_all_users(db):
                try:
                    await orchestrator.run_review_check(user, db)
                except Exception as e:
                    print(f"Review check failed for {user.email}: {e}")
        finally:
            db.close()

    async def _meeting_prep():
        from db.session import SessionLocal
        db = SessionLocal()
        try:
            for user in _get_all_users(db):
                try:
                    from integrations.google_calendar import fetch_upcoming_events
                    events = fetch_upcoming_events(user, db, hours_ahead=1)
                    for event in events:
                        start = datetime.fromisoformat(event["start"].replace("Z", "+00:00"))
                        mins = (start - datetime.now().astimezone()).total_seconds() / 60
                        if 25 <= mins <= 35:
                            await orchestrator.run_meeting_prep(user, db, event)
                except Exception as e:
                    print(f"Meeting prep failed for {user.email}: {e}")
        finally:
            db.close()

    async def _eod():
        from db.session import SessionLocal
        db = SessionLocal()
        try:
            for user in _get_all_users(db):
                try:
                    await orchestrator.run_eod_summary(user, db)
                except Exception as e:
                    print(f"EOD summary failed for {user.email}: {e}")
        finally:
            db.close()

    scheduler.add_job(_morning,      CronTrigger(hour=7,  minute=0),  id="morning_brief",  replace_existing=True)
    scheduler.add_job(_eod,          CronTrigger(hour=18, minute=0),  id="eod_summary",    replace_existing=True)
    scheduler.add_job(_inbox,        IntervalTrigger(minutes=15),     id="inbox_sync",     replace_existing=True, next_run_time=datetime.now())
    scheduler.add_job(_reviews,      IntervalTrigger(minutes=60),     id="review_check",   replace_existing=True)
    scheduler.add_job(_meeting_prep, IntervalTrigger(minutes=5),      id="meeting_prep",   replace_existing=True)

    scheduler.start()
