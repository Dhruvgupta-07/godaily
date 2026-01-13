from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str


class RoutineCreate(BaseModel):
    title: str


class RoutineResponse(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True
