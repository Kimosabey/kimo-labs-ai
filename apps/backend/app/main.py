from fastapi import FastAPI, HTTPException
import httpx
from dotenv import load_dotenv

load_dotenv()
from pydantic import BaseModel
from typing import List, Optional
from app.core.rag import (
    build_or_load_index, 
    get_agent, 
    ingest_documents, 
    get_llm, 
    check_semantic_cache, 
    update_semantic_cache
)
from app.core.asr import asr_runner
from app.core.tts import tts_runner
from app.db import (
    sessions_col, 
    messages_col, 
    init_db, 
    get_all_sessions, 
    get_session_messages, 
    save_message, 
    ensure_session
)
import os
import shutil
import uuid
import json
import asyncio
import tempfile
from fastapi import UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
import chromadb

from fastapi.middleware.cors import CORSMiddleware
from llama_index.core.llms import ChatMessage
import redis
import hashlib
from livekit import api

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

# Initialize Valkey connection for rapid response caching
cache_host = os.getenv("CACHE_HOST", "localhost")
cache_port = os.getenv("CACHE_PORT", "6379")
redis_client = redis.Redis(host=cache_host, port=int(cache_port), decode_responses=True)

@app.get("/sessions")
async def get_sessions():
    """Fetch all chat sessions from the history via MongoDB."""
    sessions = await get_all_sessions()
    return [{"id": s["_id"], "title": s.get("title", "No Title"), "created_at": s["created_at"]} for s in sessions]

@app.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    """Fetch all messages for a specific session via MongoDB."""
    messages = await get_session_messages(session_id)
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
    """Enhanced health check for all system nodes."""
    status = {
        "status": "healthy",
        "nodes": {
            "backend": "online",
            "ollama": "offline",
            "chromadb": "offline",
            "sqlite": "offline"
        }
    }
    
    # Check Ollama
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{ollama_url}/api/tags")
            if res.status_code == 200:
                status["nodes"]["ollama"] = "online"
    except:
        pass
        
    # Check ChromaDB
    try:
        chroma_host = os.getenv("CHROMA_HOST")
        chroma_port = os.getenv("CHROMA_PORT", "8000")
        if chroma_host:
            client = chromadb.HttpClient(host=chroma_host, port=int(chroma_port))
        else:
            client = chromadb.PersistentClient(path=os.path.abspath("./db"))
        
        if client.heartbeat() > 0:
            status["nodes"]["chromadb"] = "online"
    except:
        pass
        
    # Check MongoDB
    try:
        await sessions_col.find_one()
        status["nodes"]["mongodb"] = "online"
    except:
        pass
        
    return status

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
    
    # Save User message and ensure session in MongoDB
    await ensure_session(active_session_id, title=request.query)
    user_msg_data = await save_message(active_session_id, role="user", content=request.query)
    
    # Fetch past messages to inject into Memory (excluding the current user_msg we just saved)
    past_msgs = await get_session_messages(active_session_id)
    chat_history = [
        ChatMessage(role=m["role"], content=m["content"]) 
        for m in past_msgs if m["_id"] != user_msg_data["_id"] and m["role"] in ("user", "assistant")
    ]

    # Initialize the high-performance agent workflow with injected Chat Memory
    agent = get_agent(index, model_name=request.model, chat_history=chat_history)

    # Determine if query requires full Agentic Tool capabilities
    query_text = request.query.lower().strip()
    is_complex = any(keyword in query_text for keyword in ["summarize", "check", "document", "file", "diagnostic", "status", "query", "search", "lake", "vector", "find"])

    # Generate query fingerprint for Semantic Cache lookup
    query_hash = f"cache:v1:{hashlib.sha256(query_text.encode()).hexdigest()}"

    async def event_generator():
        try:
            full_answer = ""
            
            # ⚡ VALKEY FAST-PATH: Check for literal cache
            cached_res = redis_client.get(query_hash)
            
            # 🧠 SEMANTIC FAST-PATH: Check for similar query meaning (New Optimized Tier)
            if not cached_res:
                cached_res = check_semantic_cache(request.query)
                if cached_res:
                    yield f"data: {json.dumps({'type': 'thought', 'content': '💡 SEMANTIC_CACHE_HIT: Similar query found in vector-lake.', 'session_id': active_session_id})}\n\n"

            if cached_res:
                yield f"data: {json.dumps({'type': 'answer', 'content': cached_res, 'session_id': active_session_id})}\n\n"
                full_answer = cached_res
            
            # Cache Miss: Proceed with Inference
            elif not is_complex and len(query_text.split()) < 10:
                llm = get_llm(request.model)
                system_msg = ChatMessage(role="system", content="You are Kimo Labs AI. Provide concise, friendly, and natural conversational replies.")
                messages = [system_msg] + chat_history + [ChatMessage(role="user", content=request.query)]
                response = await llm.astream_chat(messages)
                async for chunk in response:
                    if chunk.delta:
                        full_answer += chunk.delta
                        yield f"data: {json.dumps({'type': 'answer', 'content': chunk.delta, 'session_id': active_session_id})}\n\n"
            else:
                # Agentic ReAct Pipeline with Event Streaming (LlamaIndex 0.12+ Workflow Pattern)
                handler = agent.run(user_msg=request.query)
                
                async for event in handler.stream_events():
                    # Extract reasoning or tool usage from workflow events
                    content = ""
                    event_type = type(event).__name__
                    
                    if "ToolCall" in event_type:
                        # Extract tool name from event if possible
                        tool_name = getattr(event, "tool_name", getattr(event, "name", "unknown_tool"))
                        content = f"⚡ EXECUTING_TOOL: {tool_name}"
                    elif "Thought" in event_type or "Input" in event_type:
                        content = getattr(event, "thought", getattr(event, "msg", str(event)))
                    
                    if content and len(content) > 2:
                        yield f"data: {json.dumps({'type': 'thought', 'content': content, 'session_id': active_session_id})}\n\n"
                
                # Await final clean result for the UI
                final_result = await handler
                full_answer = str(final_result)
                
                # Flush the clean response out to the UI
                yield f"data: {json.dumps({'type': 'answer', 'content': full_answer, 'session_id': active_session_id})}\n\n"

            # Finalize and persist assistant message in MongoDB
            await save_message(
                session_id=active_session_id,
                role="assistant",
                content=full_answer,
                sources=None
            )
                
            # 🔥 Commit to Valkey and Semantic Cache
            if full_answer and not cached_res:
                redis_client.setex(query_hash, 3600, full_answer)
                update_semantic_cache(request.query, full_answer)
                
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
async def handle_asr(
    file: UploadFile = File(...),
    provider: str = Form("whisper")
):
    """Transcribe an audio file using either Whisper or Deepgram."""
    # Create temp file to store uploaded audio
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"asr_{uuid.uuid4()}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = await asr_runner.transcribe(file_path, provider=provider)
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

@app.get("/token")
async def get_token(room: str, identity: str):
    """Generate a LiveKit access token for a specific room and identity."""
    try:
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not api_key or not api_secret:
            raise HTTPException(status_code=500, detail="LiveKit credentials not configured")
            
        token = api.AccessToken(api_key, api_secret) \
            .with_identity(identity) \
            .with_name(identity) \
            .with_grants(api.VideoGrants(room_join=True, room=room))
            
        return {"token": token.to_jwt()}
    except Exception as e:
        print(f"Token generation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
