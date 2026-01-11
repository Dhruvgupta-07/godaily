from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "GoDaily backend is running 🚀"}
