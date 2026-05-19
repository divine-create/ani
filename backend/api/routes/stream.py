from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from core.events import event_queue
from core.auth import decode_token_optional
from db.session import get_db
from sqlalchemy.orm import Session
import asyncio, json

router = APIRouter()

@router.get("/stream/agent")
async def stream_agent_events(
    token: str = None,
    db: Session = Depends(get_db),
):
    # EventSource can't send Authorization headers — use ?token= query param
    # For hackathon the stream is global; token validates the caller is authenticated
    if token:
        user = decode_token_optional(token, db)
        if not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Invalid token")

    async def generator():
        while True:
            try:
                event = await asyncio.wait_for(event_queue.get(), timeout=30)
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'type': 'ping'})}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
