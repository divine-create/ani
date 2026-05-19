from notion_client import Client
from core.config import get_settings

cfg = get_settings()


def get_client(api_key: str = None) -> Client:
    return Client(auth=api_key or cfg.notion_api_key)


def create_task(title: str, description: str = "", due_date: str = None,
                priority: str = "Normal", source: str = "Gmail", contact: str = "",
                user=None, db=None) -> str:
    from integrations.user_keys import get_key, get_extra
    api_key = get_key(db, user, "notion") or cfg.notion_api_key
    db_id = get_extra(db, user, "notion").get("database_id") or cfg.notion_tasks_db_id

    props = {
        "Name":     {"title": [{"text": {"content": title}}]},
        "Status":   {"select": {"name": "Open"}},
        "Priority": {"select": {"name": priority}},
        "Source":   {"select": {"name": source}},
        "Contact":  {"rich_text": [{"text": {"content": contact}}]},
    }
    if due_date:
        props["Due Date"] = {"date": {"start": due_date}}
    if description:
        props["Description"] = {"rich_text": [{"text": {"content": description}}]}

    page = get_client(api_key).pages.create(parent={"database_id": db_id}, properties=props)
    return page["id"]


def fetch_tasks(status: str = None, user=None, db=None) -> list[dict]:
    from integrations.user_keys import get_key, get_extra
    api_key = get_key(db, user, "notion") or cfg.notion_api_key
    db_id = get_extra(db, user, "notion").get("database_id") or cfg.notion_tasks_db_id

    filters = {"property": "Status", "select": {"equals": status}} if status else None
    kwargs = {
        "database_id": db_id,
        "sorts": [{"property": "Due Date", "direction": "ascending"}],
    }
    if filters:
        kwargs["filter"] = filters

    results = get_client(api_key).databases.query(**kwargs)
    tasks = []
    for page in results["results"]:
        p = page["properties"]
        tasks.append({
            "id":       page["id"],
            "title":    p["Name"]["title"][0]["plain_text"] if p["Name"]["title"] else "",
            "status":   p["Status"]["select"]["name"] if p["Status"]["select"] else "Open",
            "priority": p["Priority"]["select"]["name"] if p["Priority"]["select"] else "Normal",
            "due_date": (p["Due Date"]["date"] or {}).get("start") if p.get("Due Date") and p["Due Date"].get("date") else None,
            "source":   p["Source"]["select"]["name"] if p["Source"]["select"] else "",
            "contact":  p["Contact"]["rich_text"][0]["plain_text"] if p["Contact"]["rich_text"] else "",
        })
    return tasks


def update_task_status(notion_id: str, status: str, user=None, db=None):
    from integrations.user_keys import get_key
    api_key = get_key(db, user, "notion") or cfg.notion_api_key
    get_client(api_key).pages.update(
        page_id=notion_id,
        properties={"Status": {"select": {"name": status}}}
    )
