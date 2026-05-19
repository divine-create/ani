from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import briefing, inbox, calendar, tasks, reviews, approve, settings, stream, stats, search, auth as auth_routes, oauth as oauth_routes, demo as demo_routes, meetings as meeting_routes
from api.webhooks import whatsapp, calendly
from scheduler.jobs import start_scheduler
from db.session import create_tables
from core.config import get_settings

cfg = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    start_scheduler()
    yield

app = FastAPI(title="Ani API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", cfg.dashboard_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api", tags=["auth"])
app.include_router(briefing.router, prefix="/api", tags=["briefing"])
app.include_router(inbox.router,    prefix="/api", tags=["inbox"])
app.include_router(calendar.router, prefix="/api", tags=["calendar"])
app.include_router(tasks.router,    prefix="/api", tags=["tasks"])
app.include_router(reviews.router,  prefix="/api", tags=["reviews"])
app.include_router(approve.router,  prefix="/api", tags=["approve"])
app.include_router(settings.router, prefix="/api", tags=["settings"])
app.include_router(stream.router,   prefix="/api", tags=["stream"])
app.include_router(stats.router,    prefix="/api", tags=["stats"])
app.include_router(search.router,   prefix="/api", tags=["search"])
app.include_router(oauth_routes.router, tags=["oauth"])
app.include_router(demo_routes.router, prefix="/api", tags=["demo"])
app.include_router(meeting_routes.router, prefix="/api", tags=["meetings"])
app.include_router(whatsapp.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(calendly.router, prefix="/webhooks", tags=["webhooks"])

@app.get("/health")
def health():
    return {"status": "ok"}
