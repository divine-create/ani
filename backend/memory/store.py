import chromadb
import os
from core.llm import call_llm

_chroma = None

def get_chroma():
    global _chroma
    if not _chroma:
        persist_dir = os.path.join(os.path.dirname(__file__), ".chromadb")
        _chroma = chromadb.PersistentClient(path=persist_dir)
    return _chroma

def _col(name: str, user_id: str = "global"):
    return get_chroma().get_or_create_collection(f"{user_id}_{name}")

def store_sent_email(body: str, user_id: str = "global"):
    col = _col("writing_style", user_id)
    col.add(ids=[str(abs(hash(body)))[:32]], documents=[body])

def get_writing_style(user_id: str = "global") -> str:
    col = _col("writing_style", user_id)
    results = col.get(limit=5)
    if not results["documents"]:
        return ""
    samples = results["documents"]
    return call_llm(
        f"Describe the writing style of these emails in 2 sentences:\n\n{'---'.join(samples)}\n\nFocus on: tone, length, formality, sign-off style.",
        max_tokens=150
    )

def store_contact_note(email: str, note: str, user_id: str = "global"):
    col = _col("contacts_memory", user_id)
    col.add(
        ids=[f"{email}_{abs(hash(note))}"[:32]],
        documents=[note],
        metadatas=[{"email": email}]
    )

def get_contact_history(email: str, user_id: str = "global") -> list[str]:
    col = _col("contacts_memory", user_id)
    results = col.get(where={"email": email}, limit=5)
    return results.get("documents", [])
