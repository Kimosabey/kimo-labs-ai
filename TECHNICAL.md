# 🏗 Kimo Labs v3.0: Monolith Architecture

This document defines the high-fidelity technical standard powering the Kimo Labs research platform.

## 📡 Distributed Multimodal System: Node Matrix v3

Kimo Labs operates as a **Hybrid-Cloud Distributed Node Matrix**, balancing local privacy with cloud-scale performance.

### 1. Multi-Engine ASR Orchestrator (Deepgram + Whisper)
*   **Dual Dispatcher**: The `ASRRunner` acts as a routing engine.
    *   **Whisper**: Local, 100% private inference using `Faster-Whisper` nodes.
    *   **Deepgram**: High-performance, ultra-low latency cloud-scale transcription via the Nova-2 model.
*   **Audio Capture**: Standardized PCM-to-WAV blob processing on the frontend via the MediaRecorder API.

### 2. Neural TTS Engine (Piper)
*   **ONNX Synthesis**: Piper executes local CPU-bound synthesis at 44.1kHz/48kHz.
*   **Edge Performance**: Optimized for single-node deployments without GPU requirements.

### 3. Agentic Hub & Memory Lake (LlamaIndex)
*   **Orchestration**: LlamaIndex v0.14+ utilizing the `index.as_chat_engine(chat_mode="react")` abstraction.
*   **Memory Core**: 
    *   **SQLite (Primary)**: The recommended "Garage Standard" for local persistence. It provides zero-latency relational storage for chat threads and session metadata.
    *   **MongoDB (Scale Option)**: Architected for future migration if horizontally scaled multi-tenant clusters are required.
*   **Vector Space**: ChromaDB persistence for high-dimensional document retrieval.

## 🎨 Design System: "Monolith"

The v3.0 platform utilizes the **Absolute Monolith** design system—a high-contrast, premium grayscale aesthetic.

| Element | Specification | Rationale |
| :--- | :--- | :--- |
| **Palette** | Black (#050505), Grey (#262626), White (#FFFFFF) | High-contrast WCAG 2.1 Compliance / Premium Lab Look. |
| **Typography** | Outfit (Sans), JetBrains Mono (Code) | Architectural clarity and technical precision. |
| **Surface** | 32px Blur, Charcoal Linear Gradients | Structural depth without color-clutter. |
| **Indicators** | White Shimmer / Glows | Neural activity feedback without legacy blue/green bias. |

## 📁 Repository Structure

```
kimo-labs/
├── apps/
│   ├── backend/            # FastAPI Intelligence Node
│   │   ├── app/
│   │   │   ├── core/      # Multimodal Dispatchers (asr.py, rag.py)
│   │   │   └── data/       # Persistent vectors & SQLite Lake
│   └── frontend/           # Next.js 15+ Monolith UI
│       ├── src/
│       │   ├── app/       # Individual Workbenches (Hub, Lab, Studio)
│       │   └── components/ # Unified Monolith UI Components
```

## 🌐 System Topology & Ports

| Service | Protocol | Port | Environment | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Next.js | `3001` | **Local (Native)** | [Monolith Console](http://10.10.20.144:3001) |
| **Backend** | FastAPI | `8001` | **Local (Native)** | [Intelligence API](http://10.10.20.144:8001/docs) |
| **Ollama** | LLM Engine | `11434` | **Local (Native)** | [Neural Inference](http://localhost:11434) |
| **ChromaDB** | Vector Lake | `8002` | **Docker** | High-dimensional Storage |
| **Chroma GUI** | Admin | `8003` | **Docker** | [Vector Diagnostics](http://10.10.20.144:8003) |
| **Valkey** | Cache Node | `6379` | **Docker** | Semantic Response Cache |
| **Voice Agent** | WebRTC | `N/A` | **Native (Agent)** | Real-time AI Node (LiveKit) |

### 🏗 Hybrid Orchestration: Local + Docker

Kimo Labs v3.0 operates in a **Hybrid Mode** to maximize performance on Apple M4 architecture while maintaining infrastructure isolation for databases:

1.  **Native Performance (Application Layer)**: The Frontend (Next.js) and Backend (FastAPI) run directly on the host OS for zero-latency memory access and native debugger support.
2.  **Containerized persistence (Data Layer)**: ChromaDB and Valkey run in Docker to ensure consistent environment variables, volume persistence, and easy cleanup.

### 🚀 Unified Ignition Sequence

To start the full stack in Hybrid mode:
```bash
./kimo.sh dev
```
*This command will check for Docker, start the database containers, and then launch the Python and Node processes natively.*

### 🚀 Comprehensive Ignition Commands

**1. Launch the Neural Memory & Diagnostic Lake (Docker)**  
Start the backend persistence, diagnostics, and semantic cache in the background:
```bash
docker-compose up -d chroma-server chroma-admin valkey
```
*Note: Valkey is configured with a 512MB RAM cap to protect Apple M4 shared memory stability.*
*Note for GUI Setup: When navigating to `http://10.10.20.144:8003`, ensure the **Chroma Connection String** is set to `http://10.10.20.144:8002` (the actual DB port), leaving tenant and database as default.*

**2. Ignite the Core Intelligence Hub (FastAPI)**  
Activate the Python environment, set routing variables, and launch the asynchronous inference engine:
```bash
source .venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)/apps
export CHROMA_HOST=localhost
export CHROMA_PORT=8002
python -m uvicorn apps.backend.app.main:app --host 0.0.0.0 --port 8001 --reload
```
*Optional: You can also use the wrapper script `./kimo.sh dev` for automated booting.*

**3. Boot the Monolith Console (Next.js/Turbopack)**  
In a completely fresh terminal window, execute the UI client with the upgraded 8GB V8 Heap size:
```bash
cd apps/frontend
npm run dev
```

## 🔒 Modern Engineering Standards
*   **Hybrid Inference**: Real-time cloud speed (Deepgram) + Local privacy (Whisper/Ollama).
*   **Atomic Design**: Monolith components are built with high-reusability via Tailwind v4 tokens.
*   **Persistent Context**: ReAct agent loops with local memory nodes ensure long-term intelligence consistency.

---

### 🛠 Individual Service Control (Manual Mode)

If you prefer to start services independently for debugging or focused development:

#### 1. Data Layer (Docker)
Start the vector store, cache, and admin GUI:
```bash
docker-compose up -d chroma-server chroma-admin valkey
```

#### 2. Intelligence Backend (Native)
Ensure the virtual environment is active and the path is set before launching:
```bash
source .venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)/apps:$(pwd)/apps/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload --app-dir apps/backend
```

#### 3. Monolith Console (Native)
Navigate to the frontend directory and start the dev server:
```bash
cd apps/frontend
npm run dev
```

#### 4. LLM Engine (Deepgram/Ollama)
Ensure the Ollama application is running on your Mac. You can verify it by checking:
```bash
curl http://localhost:11434/api/tags
```

#### 5. Real-time Voice Agent (LiveKit)
Start the background worker for real-time voice interaction:
```bash
source .venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)/apps:$(pwd)/apps/backend
python apps/backend/app/core/voice_agent.py dev
```

---

