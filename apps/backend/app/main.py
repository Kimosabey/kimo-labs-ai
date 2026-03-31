from fastapi import FastAPI, HTTPException
import httpx
from pydantic import BaseModel
from typing import List, Optional
from backend.app.core.rag import build_or_load_index, get_agent, ingest_documents
from backend.app.core.asr import asr_runner
from backend.app.core.tts import tts_runner
from backend.app.db import AsyncSessionLocal as SessionLocal, init_db, SessionModel, MessageModel
import os
import shutil
import uuid
import json
import asyncio
import tempfile
from fastapi import UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy import select
import chromadb

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kimo Labs", description="Next-gen local AI hub for RAG and tool-use.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the index at startup
index = None

@app.on_event("startup")
async def startup_event():
    global index
    await init_db()
    index = build_or_load_index()

@app.get("/sessions")
async def get_sessions():
    """Fetch all chat sessions from the history."""
    async with SessionLocal() as db_session:
        result = await db_session.execute(select(SessionModel).order_by(SessionModel.created_at.desc()))
        sessions = result.scalars().all()
        return [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]

@app.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    """Fetch all messages for a specific session."""
    async with SessionLocal() as db_session:
        result = await db_session.execute(
            select(MessageModel)
            .where(MessageModel.session_id == session_id)
            .order_by(MessageModel.timestamp.asc())
        )
        messages = result.scalars().all()
        return messages

class SourceNode(BaseModel):
    text: str
    file_name: str
    score: float

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceNode]
    session_id: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    model: Optional[str] = "llama3"
    session_id: Optional[str] = None

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/models")
async def list_models():
    """Fetch available models from the local Ollama instance."""
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ollama_url}/api/tags")
            return response.json()
    except Exception as e:
        # Fallback to a static list if Ollama is unreachable
        return {"models": [{"name": "llama3:latest"}, {"name": "mistral:latest"}]}

@app.post("/query")
async def handle_query(request: QueryRequest):
    global index
    if index is None:
        raise HTTPException(status_code=500, detail="RAG Index not initialized")
    
    active_session_id = request.session_id or str(uuid.uuid4())
    
    # Save User message to DB
    async with SessionLocal() as db_session:
        result = await db_session.execute(select(SessionModel).where(SessionModel.id == active_session_id))
        session_exists = result.scalar_one_or_none()
        if not session_exists:
            new_session = SessionModel(id=active_session_id, title=request.query[:30] + "...")
            db_session.add(new_session)
        user_msg = MessageModel(id=str(uuid.uuid4()), session_id=active_session_id, role="user", content=request.query)
        db_session.add(user_msg)
        await db_session.commit()

    agent = get_agent(index, model_name=request.model)

    async def event_generator():
        try:
            full_answer = ""
            # Use LlamaIndex stream_chat for the agent
            response_gen = agent.stream_chat(request.query)
            
            # Streaming the chunks
            for chunk in response_gen.response_gen:
                full_answer += chunk
                yield f"data: {json.dumps({'type': 'answer', 'content': chunk, 'session_id': active_session_id})}\n\n"
                await asyncio.sleep(0.01) # Small delay for smoother UI streaming
            
            # Finalize and persist assistant message
            async with SessionLocal() as db_session:
                assistant_msg = MessageModel(
                    id=str(uuid.uuid4()),
                    session_id=active_session_id,
                    role="assistant",
                    content=full_answer,
                    sources=None # Optional: collect sources from agent if needed
                )
                db_session.add(assistant_msg)
                await db_session.commit()
                
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the knowledge base and index it."""
    global index
    if index is None:
        raise HTTPException(status_code=500, detail="RAG Index not initialized")
    
    docs_path = os.path.abspath("./docs")
    if not os.path.exists(docs_path):
        os.makedirs(docs_path)
        
    file_path = os.path.join(docs_path, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Index the new file
        ingest_documents(index, file_path)
        
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/asr")
async def handle_asr(file: UploadFile = File(...)):
    """Transcribe an audio file using Whisper."""
    # Create temp file to store uploaded audio
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"asr_{uuid.uuid4()}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = await asr_runner.transcribe(file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

class TTSRequest(BaseModel):
    text: str

@app.post("/tts")
async def handle_tts(request: TTSRequest):
    """Generate speech from text using Piper."""
    try:
        audio_path = await tts_runner.generate_speech(request.text)
        return FileResponse(audio_path, media_type="audio/wav", filename="speech.wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections")
async def list_collections():
    """Fetch all ChromaDB collections and their counts."""
    db_path = os.path.abspath("./db")
    chroma_host = os.getenv("CHROMA_HOST")
    chroma_port = os.getenv("CHROMA_PORT", "8000")
    
    try:
        if chroma_host:
            client = chromadb.HttpClient(host=chroma_host, port=int(chroma_port))
        else:
            client = chromadb.PersistentClient(path=db_path)
            
        collections = client.list_collections()
        res = []
        for c in collections:
            res.append({
                "name": c.name,
                "count": c.count(),
                "metadata": c.metadata
            })
        return res
    except Exception as e:
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
