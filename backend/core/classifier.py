from core.llm import call_llm
import json

def classify_message(from_addr: str, subject: str, body: str) -> dict:
    prompt = f"""Classify this email for an executive's inbox assistant. Return valid JSON only.

From: {from_addr}
Subject: {subject or 'N/A'}
Body: {body[:600]}

Priority rules:
- "urgent": requires human decision (contracts, complaints, legal, urgent requests from known contacts)
- "normal": a real person needs a reply but not urgent (questions, follow-ups, meeting requests)
- "routine": auto-reply appropriate (newsletters, job alerts, notifications, automated emails, thank-yous)
- "noise": no reply needed (marketing, spam, system notifications, social alerts)

Action rules:
- "auto_reply": priority is routine → send automated reply immediately
- "draft_reply": priority is normal or urgent → prepare draft for human review
- "flag_user": priority is urgent AND sensitive (legal, complaint) → alert human immediately
- "archive": priority is noise → discard silently

Return JSON:
{{
  "priority": "urgent" | "normal" | "routine" | "noise",
  "intent": "scheduling" | "question" | "follow_up" | "fyi" | "sales" | "complaint" | "praise" | "commitment",
  "action": "auto_reply" | "draft_reply" | "flag_user" | "archive",
  "reasoning": "one sentence",
  "commitment_detected": true | false,
  "commitment_text": "extracted text or null"
}}"""

    try:
        return json.loads(call_llm(prompt, max_tokens=300))
    except json.JSONDecodeError:
        return {
            "priority": "normal", "intent": "fyi", "action": "draft_reply",
            "reasoning": "Classification failed", "commitment_detected": False,
            "commitment_text": None,
        }

def extract_commitments(body: str) -> list[dict]:
    prompt = f"""Extract commitments/tasks from this message. Return a JSON array only.

Message: {body[:1000]}

Each item: {{"text": "...", "due_date": "YYYY-MM-DD or null", "waiting_on_sender": true | false}}
Return [] if none found."""

    try:
        return json.loads(call_llm(prompt, max_tokens=400))
    except json.JSONDecodeError:
        return []
