from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

from database import Base, engine, get_db
import models, schemas

SECRET_KEY = "secret123"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI()

Base.metadata.create_all(bind=engine)

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)

def create_token(user_id: int):
    return jwt.encode({"sub": str(user_id)}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed = hash_password(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created"}

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)
    return {"access_token": token, "token_type": "bearer"}

@app.post("/routines", response_model=schemas.RoutineResponse)
def create_routine(
    routine: schemas.RoutineCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    new_routine = models.Routine(title=routine.title, owner_id=user.id)
    db.add(new_routine)
    db.commit()
    db.refresh(new_routine)
    return new_routine
