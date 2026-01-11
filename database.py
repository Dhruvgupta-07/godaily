from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://godaily_user:godaily_pass@localhost/godaily_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)