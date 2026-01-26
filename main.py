from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from database import get_db, Base, engine
from models import Task
from schemas import TaskCreate
import models

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Serve static files (css, js)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Create DB tables
Base.metadata.create_all(bind=engine)

# Serve index.html safely
@app.get("/", response_class=HTMLResponse)
def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()

# Serve other html pages
@app.get("/{page_name}", response_class=HTMLResponse)
def serve_pages(page_name: str):
    file_path = os.path.join(FRONTEND_DIR, page_name)
    if not file_path.endswith(".html"):
        raise HTTPException(status_code=404)

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    raise HTTPException(status_code=404)

# ---------------- API ---------------- #

@app.post("/tasks")
def add_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(title=task.title)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}
