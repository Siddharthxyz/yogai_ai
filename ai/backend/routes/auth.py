from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import User, UserStats

# Setup Configuration
SECRET_KEY = "yogai_super_secret_jwt_key_here" # In prod, load from env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Pydantic Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Helpers
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Routes
@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pw = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw, name=user.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Init stats
    new_stats = UserStats(user_id=new_user.id)
    db.add(new_stats)
    db.commit()

    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    user_dict = {
        "id": new_user.id, "email": new_user.email, "name": new_user.name,
        "age": new_user.age, "weight": new_user.weight, "height": new_user.height, "goals": []
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = create_access_token(data={"sub": str(db_user.id)})
    goals = db_user.goals.split(",") if db_user.goals else []
    
    user_dict = {
        "id": db_user.id, "email": db_user.email, "name": db_user.name,
        "age": db_user.age, "weight": db_user.weight, "height": db_user.height, "goals": goals
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}
