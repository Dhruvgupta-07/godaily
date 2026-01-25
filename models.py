from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship

# Import Base from database.py instead of creating a new one
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Changed from password_hash to match your code

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", backref="routines")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    scheduled_time = Column(Time, nullable=False)
    routine_id = Column(Integer, ForeignKey("routines.id"))

    routine = relationship("Routine", backref="tasks")