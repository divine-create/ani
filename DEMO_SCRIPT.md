# Ani — Demo Script
**AI Agent Olympics | May 2026 | Target length: 3–5 min**

---

## Setup (before recording)

- Start backend: `cd ani/backend && uvicorn main:app --port 8001 --reload`
- Start frontend: `cd ani/frontend && npm run dev`
- Open browser to `http://localhost:3000/login`
- Close all other tabs / notifications
- Have this file open on a second monitor

---

## Script

### [0:00 — Hook]

> "Every founder and exec I know is drowning in their inbox. Urgent emails buried under noise. Meetings with no context. Tasks that never get written down. Ani is your AI Chief of Staff — it reads everything, decides what matters, and handles the routine automatically. Here's the real thing, live."

---

### [0:20 — Login]

**Action:** Click **"Try Demo — no sign-in needed"**

> "No OAuth setup needed — Ani seeds a realistic work day instantly."

*Wait for redirect to dashboard.*

---

### [0:35 — Dashboard / Morning Brief]

**Action:** Point at the morning briefing card, then the stats row.

> "First thing Ani does each morning: a brief. Three urgent items need my attention. Two routine emails were handled automatically overnight — I never saw them. Two high-value meetings today with briefs already prepared."

Stats to highlight:
- **3 urgent** messages
- **5 need review**
- **4 open tasks**
- **2 auto-handled**

---

### [1:00 — Inbox]

**Action:** Click **Inbox** in the sidebar.

> "Here's my inbox — already triaged. Ani classified every message by priority and drafted replies."

**NDA email (urgent):**

> "This NDA needs my signature by end of day. Ani flagged it urgent, read the context, and drafted a reply. I just review and approve."

**Action:** Click the NDA email → read the draft → click **Approve**.

> "One click. Sent."

**Routine emails at the bottom (workspace ready, connection requests):**

> "These two Ani handled automatically. It sent polite acknowledgments in my writing style. I didn't touch them."

**WhatsApp message:**

> "Ani monitors WhatsApp too. Same triage, same drafts — one unified inbox."

---

### [2:00 — Tasks]

**Action:** Click **Tasks** in the sidebar.

> "Every commitment buried in an email gets extracted automatically. Sign the NDA, send the partnership proposal, prep the investor deck for Marcus. Nothing slips through because Ani read the emails so I didn't have to."

Tasks to point at:
- Sign NDA for BigCo — open
- Send partnership proposal to Sarah Chen — open
- Prepare investor deck for Marcus Reid — in progress
- Review Q3 OKRs — done

---

### [2:20 — Calendar & Meeting Briefs]

**Action:** Click **Calendar** in the sidebar.

> "Two key meetings today. Ani already prepared briefs for both."

**Action:** Click the **AcmeCorp Partnership Call** → show the meeting brief.

> "It read the partnership email thread, pulled the key context, and told me exactly what I need to walk in prepared."

**Action:** Click the **Sequoia Investor Intro** → show that brief too.

> "Same for the investor call. Who's attending, what they care about, what to cover."

---

### [2:45 — Reviews]

**Action:** Click **Reviews** in the sidebar.

> "Ani also monitors customer reviews. This 2-star review needs a response — it drafted one. I approve, it posts."

Show:
- 5-star review (auto-acknowledged)
- 2-star review with draft response (pending approval)

---

### [3:00 — Search]

**Action:** Type `investor` in the search bar.

> "Everything is searchable — emails, tasks, all of it. Instant."

*Show: the investor email + the investor deck task appear.*

---

### [3:15 — Settings / Integrations]

**Action:** Click **Settings** in the sidebar.

> "In production, you connect your real accounts. Gmail and Google Calendar via OAuth. Slack and Notion with one click. WhatsApp through Twilio. LinkedIn for contact enrichment. Each user's credentials are stored privately — this is a full multi-user SaaS."

Point at the integration cards for Slack, Notion, Calendly.

---

### [3:30 — Close]

> "Ani isn't a chatbot. It doesn't summarize — it acts. It handles the routine, surfaces the urgent, and keeps you in control of every send. Nothing goes out without your approval.

> Built in 48 hours for the AI Agent Olympics. FastAPI backend, Next.js frontend, Claude for classification and drafting, real Gmail and Calendar integration.

> This is Ani."

---

## Fallback lines (if something glitches)

| Issue | Line |
|---|---|
| Demo login slow | "Seeding a full work day takes a second..." |
| Inbox empty | "Let me refresh the sync..." → click Sync button |
| Calendar no briefs | "Briefs generate async — here's one already prepared:" → click a brief directly |
| Any 500 error | "The backend's running locally — let me show you the data directly." → switch to a working section |

---

## Key talking points to weave in

- **"You approve every send"** — nothing goes without you
- **"In your writing style"** — drafts are personalized, not generic
- **"Extracted from emails automatically"** — tasks don't require manual entry
- **"Unified inbox"** — Gmail + WhatsApp in one place
- **"Multi-user SaaS"** — per-user credentials, not shared config

---

## Submission checklist

- [ ] Video recorded (3–5 min)
- [ ] Video uploaded to YouTube / Loom (unlisted is fine)
- [ ] Submitted on lablab.ai before **May 19, 2026 at 4:00 PM**
- [ ] Demo link included in submission
- [ ] GitHub repo link included
