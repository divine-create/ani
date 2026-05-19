from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db.session import get_db
from db.models import Task, User
from sqlalchemy.orm import Session
from integrations.notion import create_task, update_task_status
from core.auth import get_current_user

router = APIRouter()

class TaskBody(BaseModel):
    title: str
    description: str = ""
    due_date: str = None
    priority: str = "Normal"
    source: str = "Manual"
    contact: str = ""

class StatusBody(BaseModel):
    status: str

@router.get("/tasks")
def get_tasks(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        q = q.filter(Task.status == status)
    tasks = q.order_by(Task.created_at.desc()).limit(100).all()
    return {"tasks": [t.to_dict() for t in tasks]}

@router.post("/tasks")
def create_new_task(
    body: TaskBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notion_id = create_task(
        title=body.title, description=body.description, due_date=body.due_date,
        priority=body.priority, source=body.source, contact=body.contact
    )
    task = Task(
        user_id=current_user.id,
        notion_id=notion_id, title=body.title, description=body.description,
        due_date=body.due_date, priority=body.priority, source=body.source,
        contact_name=body.contact,
    )
    db.add(task)
    db.commit()
    return task.to_dict()

@router.patch("/tasks/{task_id}")
def update_task(
    task_id: str,
    body: StatusBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id,
    ).first()
    if not task:
        return {"error": "Not found"}
    task.status = body.status
    if task.notion_id:
        update_task_status(task.notion_id, body.status.capitalize())
    db.commit()
    return task.to_dict()
