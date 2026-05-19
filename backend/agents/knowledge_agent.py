from core.events import emit_event
from integrations.notion import create_task, fetch_tasks, update_task_status
from integrations.gmail import search_emails

async def sync_tasks(extracted: list[dict]):
    for task in extracted:
        emit_event("notion_sync", f"Creating task: {task['title'][:50]}")
        notion_id = create_task(
            title=task["title"],
            description=task.get("description", ""),
            due_date=task.get("due_date"),
            priority=task.get("priority", "Normal"),
            source=task.get("source", "Manual"),
            contact=task.get("contact", "")
        )
        emit_event("notion_task_created", f"Task saved: {task['title'][:50]}")

async def get_open_tasks() -> list[dict]:
    emit_event("notion_fetch", "Fetching open tasks from Notion...")
    tasks = fetch_tasks(status="Open")
    emit_event("notion_fetched", f"Found {len(tasks)} open tasks")
    return tasks

async def detect_follow_ups() -> list[dict]:
    """Find sent emails waiting on a reply for 3+ days."""
    from datetime import datetime, timedelta
    emit_event("followup_check", "Checking for unanswered follow-ups...")
    sent = search_emails("in:sent newer_than:7d", max_results=20)
    threshold = datetime.utcnow() - timedelta(days=3)
    follow_ups = []
    for msg in sent:
        # Simple heuristic: no reply found in inbox for same thread
        thread_replies = search_emails(
            f"subject:{msg.get('subject','')[:30]} in:inbox", max_results=1
        )
        if not thread_replies:
            follow_ups.append(msg)
    emit_event("followup_done", f"Found {len(follow_ups)} follow-ups needed")
    return follow_ups
