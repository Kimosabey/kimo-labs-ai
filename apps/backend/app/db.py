import os
from motor.motor_asyncio import AsyncIOMotorClient
import datetime
import uuid

# MongoDB Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/kimo_labs")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database()

# Collections
sessions_col = db.get_collection("sessions")
messages_col = db.get_collection("messages")

async def init_db():
    """Initialize indexes for performance."""
    # Ensure indexes for rapid retrieval
    await sessions_col.create_index([("created_at", -1)])
    await messages_col.create_index([("session_id", 1), ("timestamp", 1)])
    print("MongoDB Layers Initialized.")

class MongoSession:
    """Helper class to mimic the old session interface if needed, 
    but we'll mostly use direct collection calls for performance."""
    pass

# Helper functions to maintain a clean main.py
async def get_all_sessions():
    cursor = sessions_col.find().sort("created_at", -1)
    return await cursor.to_list(length=100)

async def get_session_messages(session_id: str):
    cursor = messages_col.find({"session_id": session_id}).sort("timestamp", 1)
    return await cursor.to_list(length=1000)

async def save_message(session_id: str, role: str, content: str, sources=None):
    message_id = str(uuid.uuid4())
    message = {
        "_id": message_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "sources": sources,
        "timestamp": datetime.datetime.utcnow()
    }
    await messages_col.insert_one(message)
    return message

async def ensure_session(session_id: str, title: str = "New Conversation"):
    session = await sessions_col.find_one({"_id": session_id})
    if not session:
        session = {
            "_id": session_id,
            "title": title[:30] + "...",
            "created_at": datetime.datetime.utcnow()
        }
        await sessions_col.insert_one(session)
    return session
