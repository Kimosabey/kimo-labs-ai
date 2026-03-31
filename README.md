# 🧠 Kimo Labs v2: Local Multimodal Intelligence Hub

Kimo Labs is a high-fidelity, local-first research platform designed for orchestrating and exploring the capabilities of local AI models. Version 2.0 introduces a state-of-the-art multimodal engine supporting Speech-to-Text (ASR) and Text-to-Speech (TTS) alongside advanced Agentic RAG.

![Kimo Labs Dashboard](https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200)

## 🌌 Core Features

### 1. Agentic Hub (RAG + Memory)
*   **Persistent Sessions**: Context-aware conversations with local history.
*   **Tool-Use**: Seamless orchestration of local LLMs (Llama3, DeepSeek).
*   **Vector Core**: High-speed knowledge indexing powered by ChromaDB.

### 2. Speech Lab (ASR)
*   **Whisper Fusion**: Near-zero latency transcription using `faster-whisper`.
*   **Real-time Capture**: Direct browser-to-backend audio streaming.
*   **Multilingual**: Support for 90+ languages with automatic detection.

### 3. Voice Studio (TTS)
*   **Neural Synthesis**: High-quality vocal generation via `piper-tts`.
*   **Local ONNX Runtime**: CPU-optimized execution with diverse voice profiles.
*   **Studio Workbench**: Dedicated interface for script processing and audio export.

## 🚀 Quick Start (Unified CLI)

The easiest way to manage Kimo Labs is via the unified `kimo.sh` script.

1.  **Launch All Services**
    ```bash
    ./kimo.sh up
    ```
    *This starts the Backend, Frontend, and ChromaDB in Docker.*

2.  **Native Development (Hot-Reload)**
    ```bash
    ./kimo.sh dev
    ```

3.  **Monitor Performance**
    ```bash
    ./kimo.sh logs
    ```

### Manual Service Initialization (One-by-One)

For granular control, you can start each service individually in separate terminals:

1.  **Start Vector Database (Docker)**
    ```bash
    docker-compose up -d chroma-server chroma-admin
    ```

2.  **Start Backend (FastAPI)**
    ```bash
    source .venv/bin/activate
    export PYTHONPATH=$PYTHONPATH:$(pwd)/apps
    export CHROMA_HOST=localhost
    export CHROMA_PORT=8002
    python -m uvicorn apps.backend.app.main:app --host 0.0.0.0 --port 8001 --reload
    ```
    *Access API: http://10.10.20.144:8001/docs*

3.  **Start Frontend (Next.js)**
    ```bash
    cd apps/frontend
    # Note: Ensure Node memory limit is 8GB
    npm run dev
    ```
    *Access UI: http://10.10.20.144:3001*

---

## 🛠 Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15+, Tailwind v4 | High-performance React with modern styling. |
| **Animation** | Framer Motion | Fluid, premium transitions and glassmorphism. |
| **Backend** | FastAPI (Python) | Async-native API for low-latency multimodal processing. |
| **ASR Engine** | Faster-Whisper | State-of-the-art transcription speed and accuracy. |
| **TTS Engine** | Piper | High-quality neural speech synthesis for edge devices. |
| **Intelligence** | Ollama | Unified local LLM orchestration. |

## 🏗 Architecture

Kimo Labs utilizes a **distributed intelligence** model where the frontend serves as a "Mission Control" and the backend acts as a "Computation Node".

*   **Multimodal Orchestrator**: Bridges the gap between text (LLM), audio input (Whisper), and audio output (Piper).
*   **Isolated Vector Store**: Local knowledge stays local, indexed in a persistent vector database.

## 📜 Development Guidelines

- **Premium Aesthetics**: All UI components must adhere to the "Lab Console" design system (Glassmorphism, Outfit font, 10px bold headers).
- **Local-First**: No external API calls for core inference; everything runs on-device.

---

*Kimo Labs - Exploring the Next Frontier of Local Intelligence.*
