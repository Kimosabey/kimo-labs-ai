import os
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.core.storage.kvstore import RedisKVStore
from llama_index.core.ingestion import IngestionCache
import chromadb
import redis

# Initialize Global Settings
# We use BAAI/bge-small-en-v1.5 which is a small and efficient open-source model
print("Loading local embedding model...")
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Setup Ollama as our local LLM
# When running in Docker, set OLLAMA_BASE_URL to http://host.docker.internal:11434
print("Connecting to local Ollama...")
ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
Settings.llm = Ollama(model="llama3", base_url=ollama_url, request_timeout=120.0)

def get_cache():
    """
    Initialize the Valkey-backed Ingestion Cache.
    Prevents redundant embedding computation on the M4 Neural Engine.
    """
    cache_host = os.getenv("CACHE_HOST", "localhost")
    cache_port = os.getenv("CACHE_PORT", "6379")
    try:
        kv_store = RedisKVStore(host=cache_host, port=int(cache_port))
        return IngestionCache(kv_store=kv_store, collection="kimo_ingestion_cache")
    except Exception as e:
        print(f"⚠️ Cache Node Offline: {e}. Falling back to volatile memory.")
        return None

def build_or_load_index():
    # Define persist directory (ensure it's absolute mapped to project root data)
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/db"))
    docs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/docs"))
    
    # Initialize ChromaDB client based on environment
    chroma_host = os.getenv("CHROMA_HOST")
    chroma_port = os.getenv("CHROMA_PORT", "8000")
    
    if chroma_host:
        print(f"Connecting to remote ChromaDB at {chroma_host}:{chroma_port}...")
        db = chromadb.HttpClient(host=chroma_host, port=int(chroma_port))
    else:
        print(f"Using local persistent ChromaDB at {db_path}...")
        db = chromadb.PersistentClient(path=db_path)
    
    chroma_collection = db.get_or_create_collection("garage_ai_collection")
    
    # Create vector store
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # If index already exists in DB, load it
    if os.path.exists(db_path) and chroma_collection.count() > 0:
        print(f"Loading existing index from local ChromaDB at {db_path}...")
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        index = VectorStoreIndex.from_vector_store(vector_store, storage_context=storage_context)
    else:
        # Otherwise, build from scratch from ./docs folder
        print(f"Building new index from {docs_path}...")
        if not os.path.exists(docs_path):
            os.makedirs(docs_path)
            # Create a default file if none exists
            with open(os.path.join(docs_path, "welcome.txt"), "w") as f:
                f.write("Welcome to Kimo's Garage AI! Your high-performance engine for local intelligence.")
        
        documents = SimpleDirectoryReader(docs_path).load_data()
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # Apply Global Ingestion Cache
        cache = get_cache()
        index = VectorStoreIndex.from_documents(
            documents, storage_context=storage_context, cache=cache
        )
        print(f"Index built and persisted to {db_path}")
    
    return index

from llama_index.core.agent.workflow import ReActAgent
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core.memory import ChatMemoryBuffer

def ingest_documents(index, file_path):
    """Ingest a new file into the existing index."""
    print(f"Ingesting new file: {file_path}")
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    for doc in documents:
        index.insert(doc)
    return True

def get_llm(model_name="llama3"):
    """
    Configurable LLM Node. 
    Supports local Ollama currently, but architected for Gemini/OpenAI cloud models.
    """
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    if provider == "ollama":
        return Ollama(model=model_name, base_url=ollama_url, request_timeout=120.0)
    elif provider == "gemini":
        # Placeholder for future Gemini integration
        # from llama_index.llms.gemini import Gemini
        # return Gemini(model="models/gemini-pro", api_key=os.getenv("GOOGLE_API_KEY"))
        return Ollama(model=model_name, base_url=ollama_url)
    else:
        return Ollama(model=model_name, base_url=ollama_url)

def get_agent(index, model_name="llama3", chat_history=None):
    # Dynamically select the LLM node
    llm = get_llm(model_name)
    
    # Wrap the vector index in a QueryEngineTool
    query_tool = QueryEngineTool(
        query_engine=index.as_query_engine(streaming=True),
        metadata=ToolMetadata(
            name="vector_lake",
            description="Semantic search across Kimo's Garage intelligence documentation. Use this for RAG queries."
        )
    )
    
    # Instantiate memory tracker for ReAct Agent
    memory = ChatMemoryBuffer.from_defaults(chat_history=chat_history or [], llm=llm)
    
    # High-performance context prompt to prevent the Agent from falling into latency tool-loops on casual chat
    system_prompt = (
        "You are Kimo Labs AI, an advanced intelligence node. "
        "If the user types a greeting (like 'hello', 'good evening', 'hi') or asks casual questions, "
        "respond directly WITHOUT using any tools. Only use the 'vector_lake' tool if the user asks for specific technical documentation or intelligence."
    )
    
    # Initialize the high-performance ReActAgent Workflow
    agent = ReActAgent(
        tools=[query_tool],
        llm=llm,
        memory=memory,
        context=system_prompt,
        verbose=True
    )
    return agent

async def query_rag(index, query_text, model_name="llama3"):
    agent = get_agent(index, model_name=model_name)
    # The new ReActAgent workflow uses .run()
    handler = agent.run(input=query_text)
    # Return the handler for event-based streaming in main.py
    return handler
