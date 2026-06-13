from sqlalchemy import Column, Integer, String, Float
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Profile Info
    name = Column(String)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    goals = Column(String, nullable=True) # Stored as comma separated string

class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    
    # Core stats
    calories = Column(Float, default=0.0)
    focus = Column(Float, default=85.0)
    accuracy = Column(Float, default=90.0)
    hydration = Column(Float, default=0.0)
    streak = Column(Integer, default=0)
    activeMinutes = Column(Integer, default=0)
    goalAccuracy = Column(Float, default=100.0)
    recovery = Column(Float, default=100.0)
    weeklyPerformance = Column(Float, default=0.0)
    
    # Tracking
    last_session_date = Column(String, nullable=True)
