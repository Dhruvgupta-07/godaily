from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    routines = relationship("Routine", back_populates="owner")


class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)   # ✅ THIS WAS MISSING IN DB
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="routines")
