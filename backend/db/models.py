from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, JSON, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id                   = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    google_id            = Column(String(255), unique=True, nullable=False)
    email                = Column(String(255), unique=True, nullable=False)
    name                 = Column(String(255))
    avatar_url           = Column(String(500))
    google_access_token  = Column(Text)
    google_refresh_token = Column(Text)
    google_token_expiry  = Column(DateTime(timezone=True))
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
        }

class UserIntegration(Base):
    __tablename__ = "user_integrations"

    id         = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id    = Column(UUID(as_uuid=False), nullable=False)
    service    = Column(String(50), nullable=False)  # notion | slack | whatsapp | calendly
    api_key    = Column(Text)
    extra_data = Column(JSON)                         # db_id, channel_id, etc.
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id, "service": self.service,
            "is_active": self.is_active,
            "extra_data": self.extra_data or {},
        }

class Message(Base):
    __tablename__ = "messages"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id      = Column(UUID(as_uuid=False), nullable=True)
    channel      = Column(String(20), nullable=False)       # gmail | whatsapp
    external_id  = Column(String(255), unique=True)
    from_address = Column(String(255))
    from_name    = Column(String(255))
    subject      = Column(String(500))
    body         = Column(Text)
    received_at  = Column(DateTime(timezone=True))
    priority     = Column(String(20), default="normal")     # urgent | normal | routine | noise
    intent       = Column(String(50))
    status       = Column(String(20), default="pending")    # pending | auto_handled | needs_review | done
    draft_reply  = Column(Text)
    auto_sent    = Column(Boolean, default=False)
    auto_sent_at = Column(DateTime(timezone=True))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id":           self.id,
            "channel":      self.channel,
            "from_address": self.from_address,
            "from_name":    self.from_name,
            "subject":      self.subject,
            "body":         self.body,
            "received_at":  self.received_at.isoformat() if self.received_at else None,
            "priority":     self.priority,
            "intent":       self.intent,
            "status":       self.status,
            "draft_reply":  self.draft_reply,
            "auto_sent":    self.auto_sent,
        }

class Contact(Base):
    __tablename__ = "contacts"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id             = Column(UUID(as_uuid=False), nullable=True)
    email               = Column(String(255))
    phone               = Column(String(50))
    name                = Column(String(255))
    company             = Column(String(255))
    role                = Column(String(255))
    relationship_tier   = Column(String(20), default="warm")  # vip | warm | cold
    avg_reply_time_hours= Column(Integer)
    last_contacted_at   = Column(DateTime(timezone=True))
    linkedin_url        = Column(String(500))
    notes               = Column(Text)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id, "email": self.email, "name": self.name,
            "company": self.company, "role": self.role,
            "relationship_tier": self.relationship_tier,
        }

class Task(Base):
    __tablename__ = "tasks"

    id                = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id           = Column(UUID(as_uuid=False), nullable=True)
    notion_id         = Column(String(255))
    title             = Column(Text, nullable=False)
    description       = Column(Text)
    source            = Column(String(20))    # gmail | whatsapp | manual
    source_message_id = Column(String(255))
    contact_name      = Column(String(255))
    due_date          = Column(String(20))    # ISO date string
    priority          = Column(String(20), default="Normal")
    status            = Column(String(20), default="open")  # open | in_progress | done | waiting
    waiting_on        = Column(String(255))
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id, "notion_id": self.notion_id, "title": self.title,
            "source": self.source, "contact_name": self.contact_name,
            "due_date": self.due_date, "priority": self.priority, "status": self.status,
        }

class Review(Base):
    __tablename__ = "reviews"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id          = Column(UUID(as_uuid=False), nullable=True)
    gmb_review_id    = Column(String(255), unique=True)
    reviewer_name    = Column(String(255))
    rating           = Column(Integer)
    body             = Column(Text)
    published_at     = Column(DateTime(timezone=True))
    platform         = Column(String(50), default="google")
    draft_reply      = Column(Text)
    reply_posted     = Column(Boolean, default=False)
    reply_posted_at  = Column(DateTime(timezone=True))
    status           = Column(String(20), default="pending")
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id, "gmb_review_id": self.gmb_review_id,
            "reviewer_name": self.reviewer_name, "rating": self.rating,
            "body": self.body,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "draft_reply": self.draft_reply, "reply_posted": self.reply_posted,
            "status": self.status,
        }

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id                 = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id            = Column(UUID(as_uuid=False), nullable=True)
    gcal_event_id      = Column(String(255), unique=True)
    title              = Column(String(500))
    start_time         = Column(DateTime(timezone=True))
    end_time           = Column(DateTime(timezone=True))
    attendees          = Column(JSON)
    meeting_brief      = Column(Text)
    brief_generated_at = Column(DateTime(timezone=True))
    meet_link          = Column(String(500))
    created_at         = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id, "gcal_event_id": self.gcal_event_id, "title": self.title,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "attendees": self.attendees, "meeting_brief": self.meeting_brief,
            "meet_link": self.meet_link,
        }

class MeetingRecord(Base):
    __tablename__ = "meeting_records"

    id            = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id       = Column(UUID(as_uuid=False), nullable=False)
    filename      = Column(String(500))
    status        = Column(String(20), default="processing")  # processing | done | failed
    transcript    = Column(Text)
    summary       = Column(Text)
    extracted     = Column(JSON)   # {action_items, follow_ups, commitments, next_meeting}
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id, "filename": self.filename, "status": self.status,
            "transcript": self.transcript, "summary": self.summary,
            "extracted": self.extracted or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id         = Column(UUID(as_uuid=False), nullable=True)
    name            = Column(String(255))
    channel         = Column(String(20))        # gmail | whatsapp | gmb | all
    condition_type  = Column(String(50))        # keyword | sender | intent | rating
    condition_value = Column(Text)
    action          = Column(String(50))        # auto_reply | flag_urgent | create_task | archive
    action_template = Column(Text)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "channel": self.channel,
            "condition_type": self.condition_type, "condition_value": self.condition_value,
            "action": self.action, "is_active": self.is_active,
        }

class UserSettings(Base):
    __tablename__ = "user_settings"

    id                 = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id            = Column(UUID(as_uuid=False), unique=True, nullable=False)
    auto_reply_enabled = Column(Boolean, default=True)
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {"auto_reply_enabled": self.auto_reply_enabled}

class AgentEventLog(Base):
    __tablename__ = "agent_events"

    id          = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    event_type  = Column(String(100))
    description = Column(Text)
    extra_data  = Column(JSON)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class Briefing(Base):
    __tablename__ = "briefings"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id      = Column(UUID(as_uuid=False), nullable=True)
    type         = Column(String(20))   # morning | eod | weekly
    content      = Column(JSON)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {"id": self.id, "type": self.type, "content": self.content,
                "created_at": self.created_at.isoformat()}
