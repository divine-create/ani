import asyncio
from datetime import datetime

event_queue: asyncio.Queue = asyncio.Queue(maxsize=100)

def emit_event(event_type: str, description: str, metadata: dict = None):
    event = {
        "type": event_type,
        "description": description,
        "metadata": metadata or {},
        "timestamp": datetime.now().isoformat(),
    }
    try:
        event_queue.put_nowait(event)
    except asyncio.QueueFull:
        # Drop oldest event to make room
        try:
            event_queue.get_nowait()
            event_queue.put_nowait(event)
        except Exception:
            pass
