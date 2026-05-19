"""Demo endpoint — creates a seeded demo user for hackathon presentations."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import User, Message, Task, CalendarEvent, Review, Briefing, AutomationRule, UserSettings, UserIntegration, MeetingRecord
from core.auth import create_jwt

router = APIRouter()

DEMO_GOOGLE_ID = "demo_user_ani_hackathon"
DEMO_EMAIL     = "demo@ani-ai.app"
DEMO_NAME      = "Alex (Demo)"
DEMO_AVATAR    = "https://api.dicebear.com/7.x/avataaars/svg?seed=ani-demo"

def _now(offset_hours=0):
    return datetime.now(timezone.utc) + timedelta(hours=offset_hours)

def _seed(db: Session, user_id: str):
    """Wipe and re-seed all demo data."""
    # Clear existing demo data
    for model in [Message, Task, CalendarEvent, Review, Briefing, AutomationRule, MeetingRecord]:
        db.query(model).filter(model.user_id == user_id).delete()
    db.query(UserSettings).filter(UserSettings.user_id == user_id).delete()
    db.query(UserIntegration).filter(UserIntegration.user_id == user_id).delete()
    db.commit()

    # ── Messages ────────────────────────────────────────────────────
    messages = [
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-1",
            from_address="sarah.chen@acmecorp.com", from_name="Sarah Chen",
            subject="Q3 Partnership Proposal — follow-up needed",
            body="Hi Alex, following up on our discussion last week. We'd love to move forward with the integration. Can we schedule a call this week? I have budget approval and my CTO is excited. Let me know your availability.",
            received_at=_now(-2), priority="urgent", intent="scheduling", status="needs_review",
            draft_reply="Hi Sarah, great to hear the team is aligned! I'm available Thursday 2-4pm or Friday morning. Let's lock in 30 minutes to align on next steps. I'll send a calendar invite once you confirm."),
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-2",
            from_address="legal@bigco.com", from_name="BigCo Legal",
            subject="NDA Review — urgent signature required by EOD",
            body="Dear Alex, the NDA for the upcoming partnership requires your signature by end of business today. Please review the attached document and sign using DocuSign. This is time-sensitive.",
            received_at=_now(-1), priority="urgent", intent="follow_up", status="needs_review",
            draft_reply="Thank you for sending this over. I've reviewed the NDA and will complete the DocuSign by 5pm today. Please confirm receipt once signed."),
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-3",
            from_address="marcus@investor.vc", from_name="Marcus Reid",
            subject="Re: Seed round — interested in connecting",
            body="Alex — heard great things about what you're building. We're actively looking at AI productivity tools. Would love a 20-minute intro call. Happy to do this week.",
            received_at=_now(-3), priority="urgent", intent="scheduling", status="needs_review",
            draft_reply="Hi Marcus, really appreciate you reaching out! I'd love to connect. I can do a 20-minute call Wednesday at 11am or Thursday at 3pm. Looking forward to sharing what we've built."),
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-4",
            from_address="team@notion.so", from_name="Notion",
            subject="Your workspace is ready — get started",
            body="Your Notion workspace has been set up. Here's how to get started with templates...",
            received_at=_now(-5), priority="routine", intent="fyi", status="auto_handled",
            draft_reply="Thanks for the heads up.", auto_sent=True, auto_sent_at=_now(-4)),
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-5",
            from_address="noreply@linkedin.com", from_name="LinkedIn",
            subject="You have 3 new connection requests",
            body="Priya Sharma and 2 others want to connect with you on LinkedIn.",
            received_at=_now(-6), priority="routine", intent="fyi", status="auto_handled",
            draft_reply="Thank you!", auto_sent=True, auto_sent_at=_now(-5)),
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-6",
            from_address="priya@techstartup.io", from_name="Priya Sharma",
            subject="Collaboration idea — AI + fintech",
            body="Hi Alex, I came across Ani and think there's a great opportunity to integrate with our payment platform. Our 50k merchants would benefit from AI-powered communication. Open to a quick chat?",
            received_at=_now(-4), priority="normal", intent="question", status="needs_review",
            draft_reply="Hi Priya, this sounds really interesting! I'd love to explore how Ani could work with your merchant communication stack. Can we set up 30 minutes next week?"),
        Message(user_id=user_id, channel="whatsapp", external_id="demo-msg-7",
            from_address="+2348012345678", from_name="David O.",
            body="Hey, just saw your demo at the hackathon. This is incredible! How do I get early access?",
            received_at=_now(-1), priority="normal", intent="question", status="needs_review",
            draft_reply="Thank you so much! Really glad you enjoyed the demo. I'll add you to the early access waitlist — you'll be among the first to get access. Stay tuned!"),
        Message(user_id=user_id, channel="gmail", external_id="demo-msg-8",
            from_address="jobs@indeedemail.com", from_name="Indeed",
            subject="New jobs matching 'AI Engineer'",
            body="Based on your profile, here are 5 new jobs that match your search...",
            received_at=_now(-8), priority="noise", intent="fyi", status="auto_handled",
            auto_sent=False),
    ]
    db.add_all(messages)

    # ── Tasks ────────────────────────────────────────────────────────
    tasks = [
        Task(user_id=user_id, title="Send partnership proposal to Sarah Chen @ AcmeCorp",
            description="Include pricing tiers and integration timeline. Sarah approved budget.", source="gmail",
            contact_name="Sarah Chen", priority="High", status="open",
            due_date=(datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")),
        Task(user_id=user_id, title="Sign NDA for BigCo partnership",
            description="DocuSign link sent by legal@bigco.com. Must sign by EOD.", source="gmail",
            priority="High", status="open",
            due_date=datetime.now().strftime("%Y-%m-%d")),
        Task(user_id=user_id, title="Prepare investor deck for Marcus Reid call",
            description="Focus on traction, market size, and AI differentiation.", source="gmail",
            contact_name="Marcus Reid", priority="High", status="in_progress",
            due_date=(datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")),
        Task(user_id=user_id, title="Follow up with Priya Sharma re: fintech integration",
            description="Explore merchant communication use case — 50k merchants.", source="gmail",
            contact_name="Priya Sharma", priority="Normal", status="open",
            due_date=(datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")),
        Task(user_id=user_id, title="Review Q3 OKR progress with team",
            description="Check against targets set in last board meeting.", source="manual",
            priority="Normal", status="done",
            due_date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")),
    ]
    db.add_all(tasks)

    # ── Calendar Events ──────────────────────────────────────────────
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    events = [
        CalendarEvent(user_id=user_id, gcal_event_id="demo-cal-1",
            title="Partnership Call — AcmeCorp",
            start_time=today + timedelta(hours=10),
            end_time=today + timedelta(hours=10, minutes=30),
            attendees=[{"name": "Sarah Chen", "email": "sarah.chen@acmecorp.com"}, {"name": "Alex (Demo)", "email": DEMO_EMAIL}],
            meet_link="https://meet.google.com/abc-defg-hij",
            meeting_brief="**Sarah Chen** is VP of Partnerships at AcmeCorp (Series B, $40M raised). She approved budget for Q3. Key goal: align on integration specs and sign LOI. Previous call: she requested white-label option. Come with pricing sheet. Her LinkedIn shows background in enterprise SaaS. AcmeCorp is actively hiring engineers — bullish signal."),
        CalendarEvent(user_id=user_id, gcal_event_id="demo-cal-2",
            title="Investor Intro — Marcus Reid, Sequoia",
            start_time=today + timedelta(hours=14),
            end_time=today + timedelta(hours=14, minutes=20),
            attendees=[{"name": "Marcus Reid", "email": "marcus@investor.vc"}, {"name": "Alex (Demo)", "email": DEMO_EMAIL}],
            meet_link="https://meet.google.com/xyz-uvwx-yz",
            meeting_brief="**Marcus Reid** is a Partner at Sequoia Capital. Focus: AI/SaaS at Seed/Series A. Portfolio includes Notion, Linear, Vercel. He reached out cold — strong signal of intent. Key: lead with traction (X users, Y emails handled, Z hours saved). Market: $50B productivity software. Come with 3 key metrics and a clear ask."),
        CalendarEvent(user_id=user_id, gcal_event_id="demo-cal-3",
            title="Weekly Team Standup",
            start_time=today + timedelta(hours=9),
            end_time=today + timedelta(hours=9, minutes=15),
            attendees=[{"name": "Alex (Demo)", "email": DEMO_EMAIL}, {"name": "Team", "email": "team@ani-ai.app"}],
            meet_link="https://meet.google.com/team-standup"),
    ]
    db.add_all(events)

    # ── Reviews ──────────────────────────────────────────────────────
    reviews = [
        Review(user_id=user_id, gmb_review_id="demo-review-1",
            reviewer_name="James K.", rating=5,
            body="Absolutely incredible service! The team responded within minutes and resolved our issue perfectly. Will definitely be back and recommending to everyone.",
            published_at=_now(-24), status="pending",
            draft_reply="Thank you so much for the kind words, James! We're thrilled we could resolve everything quickly. Reviews like yours mean the world to our team. We look forward to serving you again!"),
        Review(user_id=user_id, gmb_review_id="demo-review-2",
            reviewer_name="Anonymous", rating=2,
            body="Waited 45 minutes for a response. Not what I expected based on the reviews. Hope this was a one-off.",
            published_at=_now(-48), status="pending",
            draft_reply="We sincerely apologize for the wait time you experienced. This is not the standard we hold ourselves to. We'd love the opportunity to make this right — please reach out to us directly at support@ani-ai.app and we'll ensure a much better experience."),
    ]
    db.add_all(reviews)

    # ── Briefing ─────────────────────────────────────────────────────
    briefing = Briefing(user_id=user_id, type="morning", content={
        "date": datetime.now().strftime("%A, %B %d"),
        "total_decisions": 3,
        "insight": "Your day has 2 high-value meetings and 3 urgent items. Ani handled 4 routine emails automatically overnight.",
        "urgent_count": 3,
        "auto_handled_count": 4,
        "whatsapp_count": 1,
        "urgent_reviews": 1,
        "events": [
            {"title": "Weekly Team Standup", "time": "9:00 AM"},
            {"title": "Partnership Call — AcmeCorp", "time": "10:00 AM"},
            {"title": "Investor Intro — Marcus Reid", "time": "2:00 PM"},
        ],
        "commitments": [
            "Sign NDA for BigCo by EOD",
            "Send partnership proposal to Sarah Chen",
            "Prepare investor deck for Marcus call",
        ],
    })
    db.add(briefing)

    # ── Automation Rules ─────────────────────────────────────────────
    rules = [
        AutomationRule(user_id=user_id, name="Auto-archive job alerts",
            channel="gmail", condition_type="sender", condition_value="indeed.com",
            action="archive", is_active=True),
        AutomationRule(user_id=user_id, name="Flag legal emails urgent",
            channel="gmail", condition_type="keyword", condition_value="nda",
            action="flag_urgent", is_active=True),
        AutomationRule(user_id=user_id, name="Auto-reply to newsletter",
            channel="gmail", condition_type="intent", condition_value="fyi",
            action="auto_reply", is_active=True),
    ]
    db.add_all(rules)

    # ── Meeting Intelligence (pre-processed demo result) ────────────
    db.add(MeetingRecord(
        user_id=user_id,
        filename="investor_call_marcus_reid.m4a",
        status="done",
        summary="Alex and Marcus Reid (Sequoia) had a 20-minute intro call. Marcus expressed strong interest in Ani's approach to autonomous email handling and asked for a follow-up with traction metrics. Alex committed to sending a one-pager and deck by Friday. Marcus will loop in his associate for due diligence.",
        extracted={
            "title": "Investor Intro — Marcus Reid, Sequoia",
            "participants": ["Alex", "Marcus Reid"],
            "summary": "Alex and Marcus Reid (Sequoia) had a 20-minute intro call. Marcus expressed strong interest in Ani's approach to autonomous email handling and asked for a follow-up with traction metrics. Alex committed to sending a one-pager and deck by Friday. Marcus will loop in his associate for due diligence.",
            "action_items": [
                {"title": "Send investor one-pager and pitch deck to Marcus Reid", "owner": "Me", "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"), "priority": "High"},
                {"title": "Prepare traction metrics slide (users, emails handled, time saved)", "owner": "Me", "due_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"), "priority": "High"},
                {"title": "Follow up with Marcus's associate for due diligence call", "owner": "Me", "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"), "priority": "Normal"},
            ],
            "follow_up_emails": [
                {
                    "to_name": "Marcus Reid",
                    "to_email": "marcus@investor.vc",
                    "subject": "Ani — Deck & One-Pager (as promised)",
                    "body": "Hi Marcus,\n\nGreat connecting today! As promised, I'm attaching our pitch deck and one-pager.\n\nKey traction highlights:\n• 2,400+ emails handled autonomously this month\n• Average 4.2 hours saved per user per week\n• 94% approval rate on AI-drafted replies\n\nHappy to set up time with your associate whenever works. Looking forward to next steps.\n\nBest,\nAlex",
                }
            ],
            "commitments_made": [
                "Alex will send pitch deck and one-pager by Friday",
                "Marcus will loop in his associate for due diligence",
                "Follow-up call to be scheduled within 2 weeks",
            ],
            "next_meeting": {
                "suggested": True,
                "title": "Ani — Due Diligence Call with Sequoia",
                "duration_mins": 45,
                "suggested_timeframe": "next week",
            },
        },
    ))

    # ── Settings ─────────────────────────────────────────────────────
    db.add(UserSettings(user_id=user_id, auto_reply_enabled=True))

    # ── Integrations ─────────────────────────────────────────────────
    for service in ["slack", "notion"]:
        db.add(UserIntegration(user_id=user_id, service=service,
            api_key="demo_key", extra_data={"demo": True}, is_active=True))

    db.commit()


@router.get("/auth/demo")
def demo_login(db: Session = Depends(get_db)):
    """Return a JWT for a seeded demo user. Development/demo use only."""
    user = db.query(User).filter(User.google_id == DEMO_GOOGLE_ID).first()
    if not user:
        user = User(
            google_id=DEMO_GOOGLE_ID,
            email=DEMO_EMAIL,
            name=DEMO_NAME,
            avatar_url=DEMO_AVATAR,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    _seed(db, user.id)
    token = create_jwt(user.id, user.email)
    return {"token": token, "user": user.to_dict()}
