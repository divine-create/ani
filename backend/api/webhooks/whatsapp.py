from fastapi import APIRouter, Request, BackgroundTasks
from integrations.whatsapp import parse_inbound
from agents.comms_agent import handle_whatsapp_message

router = APIRouter()

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    form = await request.form()
    message = parse_inbound(dict(form))
    if message.get("body"):
        background_tasks.add_task(handle_whatsapp_message, message)
    return {"status": "received"}
