from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
import os

from database import get_db, Base, engine
from models import Task
from schemas import TaskCreate

app = FastAPI()

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# -----------------------------
# Static files (CSS / JS)
# -----------------------------
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)

# -----------------------------
# Database
# -----------------------------
Base.metadata.create_all(bind=engine)

# -----------------------------
# Root (MUST be fast & safe)
# -----------------------------
@app.get("/", response_class=HTMLResponse)
def root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if not os.path.exists(index_path):
        return "<h1>Frontend not found</h1>"
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()

# -----------------------------
# Other HTML pages
# -----------------------------
@app.get("/{page}", response_class=HTMLResponse)
def serve_pages(page: str):
    file_path = os.path.join(FRONTEND_DIR, page)
    if os.path.exists(file_path) and file_path.endswith(".html"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Page not found</h1>"

# -----------------------------
# API: Tasks
# -----------------------------
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
