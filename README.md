# Ani — AI Chief of Staff

Ani is an autonomous AI agent that manages your inbox, calendar, and communications so you can focus on what matters.

It reads every email and WhatsApp message, decides what's urgent, drafts replies in your voice, extracts tasks automatically, prepares meeting briefs, and analyzes meeting recordings — all without you lifting a finger.

Built for the **AI Agent Olympics — Milan AI Week 2026**.

---

## What Ani Does

| Feature | Description |
|---|---|
| **Inbox Triage** | Classifies every email and WhatsApp message as urgent, normal, routine, or noise |
| **Auto-drafting** | Writes replies in your writing style — you approve before anything sends |
| **Task Extraction** | Pulls commitments and action items out of emails automatically |
| **Meeting Briefs** | Generates context briefs for every calendar event before you walk in |
| **Meeting Intelligence** | Upload any meeting recording — Gemini extracts action items, drafts follow-up emails, and populates your dashboard |
| **Review Management** | Monitors Google Business reviews and drafts responses |
| **Multi-channel** | Gmail + WhatsApp in one unified inbox |

---

## Tech Stack

**Backend** — Python 3.12, FastAPI, PostgreSQL, SQLAlchemy, APScheduler  
**Frontend** — Next.js 14, TypeScript, Tailwind CSS, React Query  
**AI** — Anthropic Claude (classification + drafting), Google Gemini 2.0 Flash (meeting audio analysis)  
**Integrations** — Gmail API, Google Calendar, Slack, Notion, Twilio WhatsApp, Calendly  
**Auth** — NextAuth.js v5, Google OAuth 2.0, JWT

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL
- A Google Cloud project with Gmail and Calendar APIs enabled

### 1. Clone the repo

```bash
git clone https://github.com/divine-create/ani.git
cd ani
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in your credentials in .env
```

### 3. Frontend setup

```bash
cd frontend
npm install

cp .env.example .env.local
# Fill in your credentials in .env.local
```

### 4. Database

```bash
# Start PostgreSQL, then:
createdb ani
# Tables are created automatically on first run
```

### 5. Run

```bash
# Terminal 1 — backend
cd backend && uvicorn main:app --port 8001 --reload

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:3000`. Click **Try Demo** to explore with pre-loaded data — no credentials required.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `DEEPSEEK_API_KEY` | DeepSeek API key (email classification + drafting) |
| `GEMINI_API_KEY` | Google Gemini API key (meeting intelligence) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `SLACK_BOT_TOKEN` | Slack bot token (optional) |
| `NOTION_API_KEY` | Notion API key (optional) |
| `TWILIO_ACCOUNT_SID` | Twilio SID for WhatsApp (optional) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (optional) |

See `backend/.env.example` for the full list.

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | Your frontend URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `GOOGLE_CLIENT_ID` | Same Google OAuth client ID as backend |
| `GOOGLE_CLIENT_SECRET` | Same Google OAuth client secret as backend |
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `http://localhost:8001`) |

---

## Demo Mode

Hit **Try Demo** on the login page for an instant tour with no setup:

- 8 pre-loaded messages (urgent NDA, investor email, WhatsApp, auto-handled routines)
- 5 tasks extracted from emails
- 3 calendar events with AI-generated meeting briefs
- A pre-processed meeting recording with extracted action items and draft emails
- Morning briefing with daily insight

---

## Meeting Intelligence

Upload any meeting recording (MP3, MP4, M4A, WAV, OGG, WebM) to the **Meeting Intel** tab. Gemini 2.0 Flash listens to the full recording and automatically:

- Extracts action items with owners and due dates
- Drafts follow-up emails ready to approve and send
- Tracks commitments made by all parties
- Suggests next meeting details

Results appear in your Tasks and Inbox within ~60 seconds.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│   Next.js 14    │────▶│           FastAPI Backend             │
│   (Frontend)    │     │                                      │
└─────────────────┘     │  ┌────────────┐  ┌───────────────┐  │
                        │  │   Agents   │  │  Integrations │  │
                        │  │ orchestr.  │  │ Gmail/GCal    │  │
                        │  │ comms      │  │ Slack/Notion  │  │
                        │  │ briefing   │  │ WhatsApp      │  │
                        │  │ calendar   │  │ Gemini        │  │
                        │  └────────────┘  └───────────────┘  │
                        │                                      │
                        │  ┌────────────┐  ┌───────────────┐  │
                        │  │ PostgreSQL │  │    Claude     │  │
                        │  │    (DB)    │  │   (Anthropic) │  │
                        │  └────────────┘  └───────────────┘  │
                        └──────────────────────────────────────┘
```

---

## License

MIT — see [LICENSE](LICENSE).
