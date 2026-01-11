from fastapi import FastAPI
from database import engine

app = FastAPI()

@app.get("/")
def home():
    return {"message": "GoDaily backend connected to database 🚀"}
