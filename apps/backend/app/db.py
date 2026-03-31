import os
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import datetime

# Define the database path (persisted in project root data/db)
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/db"))
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

DB_URL = f"sqlite+aiosqlite:///{DB_DIR}/history.db"

Base = declarative_base()

class SessionModel(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    messages = relationship("MessageModel", back_populates="session", cascade="all, delete-orphan")

class MessageModel(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    role = Column(String) # "user" or "assistant"
    content = Column(Text)
    sources = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    session = relationship("SessionModel", back_populates="messages")

# Setup Async DB
engine = create_async_engine(DB_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        # For development ease, we'll create tables
        await conn.run_sync(Base.metadata.create_all)
