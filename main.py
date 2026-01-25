from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

# Import database first
from database import engine, Base, get_db

# Import models BEFORE creating tables
from models import User
from schemas import UserCreate, UserLogin
from auth import hash_password, verify_password

# Create FastAPI app
app = FastAPI()

# Create all tables - this MUST come after importing models
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "GoDaily backend running 🚀"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    new_user = User(email=user.email, password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {"message": "Login successful"}