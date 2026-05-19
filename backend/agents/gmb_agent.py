from core.llm import call_llm
from core.config import get_settings
from core.events import emit_event
from integrations.google_my_business import fetch_reviews, post_reply
from db.models import Review
from datetime import datetime

cfg = get_settings()

def draft_response(reviewer: str, rating: int, body: str) -> str:
    tone = "warm and grateful" if rating >= 4 else "empathetic and solution-focused"
    instruction = (
        "This is a positive review. Be warm, grateful, and personal."
        if rating >= 4 else
        "This is a negative review. Apologise sincerely, acknowledge the issue, offer to resolve it offline."
    )
    prompt = f"""Draft a Google review response for {cfg.business_name}.

Reviewer: {reviewer}
Rating: {rating}/5 stars
Review: {body or "(no text)"}

Tone: {tone}
{instruction}

Rules:
- Under 150 words
- Do not start with "Dear" or "Hi [name]"
- Do not use filler phrases like "Thank you for your feedback"
- Write only the response text"""

    return call_llm(prompt, max_tokens=250)

async def check_reviews(user, db) -> dict:
    if not cfg.gmb_account_id or not cfg.gmb_location_id:
        emit_event("gmb_skip", "GMB not configured — skipping reviews")
        return {"auto_posted": [], "draft_ready": [], "urgent": []}

    emit_event("gmb_sync", "Checking Google My Business reviews...")
    reviews = await fetch_reviews(cfg.gmb_account_id, cfg.gmb_location_id, user=user, db=db)
    emit_event("gmb_fetched", f"Found {len(reviews)} reviews")

    results = {"auto_posted": [], "draft_ready": [], "urgent": []}

    for r in reviews:
        if r["has_reply"]:
            continue

        existing = db.query(Review).filter(
            Review.gmb_review_id == r["id"],
            Review.user_id == user.id,
        ).first()
        if not existing:
            existing = Review(gmb_review_id=r["id"], user_id=user.id)
            db.add(existing)

        draft = draft_response(r["reviewer"], r["rating"], r["body"])
        existing.reviewer_name = r["reviewer"]
        existing.rating = r["rating"]
        existing.body = r["body"]
        existing.draft_reply = draft

        emit_event("review_draft", f"Drafted response for {r['rating']}★ review")

        if r["rating"] >= 4:
            await post_reply(cfg.gmb_account_id, cfg.gmb_location_id, r["id"], draft, user=user, db=db)
            existing.reply_posted = True
            existing.reply_posted_at = datetime.utcnow()
            existing.status = "posted"
            results["auto_posted"].append(r)
            emit_event("review_posted", f"Auto-posted response to {r['reviewer']}")
        elif r["rating"] == 3:
            existing.status = "draft_ready"
            results["draft_ready"].append({**r, "draft": draft})
        else:
            existing.status = "needs_attention"
            results["urgent"].append({**r, "draft": draft})
            emit_event("review_urgent", f"URGENT: {r['rating']}★ review from {r['reviewer']}")

        db.commit()

    return results
