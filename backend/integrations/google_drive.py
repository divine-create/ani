from googleapiclient.discovery import build
from .google_auth import get_google_credentials_for_user

def get_service(user, db):
    return build("drive", "v3", credentials=get_google_credentials_for_user(user, db))

def search_docs(user, db, query: str, max_results: int = 5) -> list[dict]:
    service = get_service(user, db)
    results = service.files().list(
        q=f"fullText contains '{query}' and trashed=false",
        pageSize=max_results,
        fields="files(id, name, mimeType, modifiedTime, webViewLink)"
    ).execute()
    return [
        {"id": f["id"], "name": f["name"], "type": f["mimeType"],
         "modified": f["modifiedTime"], "url": f["webViewLink"]}
        for f in results.get("files", [])
    ]

def find_docs_for_meeting(user, db, attendee_names: list[str], meeting_title: str) -> list[dict]:
    all_docs, seen = [], set()
    for name in attendee_names:
        for doc in search_docs(user, db, name.split()[0], max_results=2):
            if doc["id"] not in seen:
                seen.add(doc["id"])
                all_docs.append(doc)
    for doc in search_docs(user, db, " ".join(meeting_title.split()[:3]), max_results=3):
        if doc["id"] not in seen:
            seen.add(doc["id"])
            all_docs.append(doc)
    return all_docs[:5]
