from pydantic import BaseModel, EmailStr
from datetime import date, time

class UserCreate(BaseModel):
    email: EmailStr
    password: str


class RoutineCreate(BaseModel):
    name: str
    duration_days: int
    start_date: date


class TaskCreate(BaseModel):
    name: str
    scheduled_time: time

