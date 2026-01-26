from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
import os

from database import get_db, Base, engine
from models import Task
from schemas import TaskCreate

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# ---------- STATIC FILES ----------
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# ---------- DATABASE ----------
Base.metadata.create_all(bind=engine)

# ---------- HEALTH CHECK (FOR RAILWAY) ----------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- ROOT (FAST RESPONSE) ----------
@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=/frontend/index.html">
      </head>
    </html>
    """

# ---------- API ----------
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
