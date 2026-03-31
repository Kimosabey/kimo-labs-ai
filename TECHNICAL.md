# 🏗 Kimo Labs v2: Technical Architecture

This document outlines the internal systems and architectural decisions powering Kimo Labs v2.

## 📡 Distributed Multimodal System

Kimo Labs operates on a **Single-Node Distributed Architecture**, where data flows between specialized "Engines" orchestrated by the FastAPI backend.

### 1. Unified ASR Pipeline (Faster-Whisper)
*   **Model Management**: Uses `ASRRunner` (Singleton) for concurrent processing.
*   **Audio Capture**: MediaRecorder API captures PCM-encoded streams, which are converted to `.wav` via Blob processing on the frontend.
*   **Inference**: Leveraging `WhisperModel`, the backend executes non-blocking transcription in a dedicated thread to ensure immediate API responsiveness.

### 2. Neural TTS Engine (Piper)
*   **ONNX Integration**: Piper executes as a subprocess call from the Python environment, allowing for highly efficient CPU-based synthesis.
*   **Speaker Profiles**: Supports multiple voice profiles (`.onnx` + `.json`) located in the `/data/models/piper` directory.
*   **Audio Streaming**: Audio is generated as a standard WAV file and served as a `FileResponse` for immediate frontend playback.

### 3. Agentic RAG Framework (LlamaIndex)
*   **Indexing Logic**: Uses `VectorStoreIndex` with persistent storage in ChromaDB.
*   **Memory Core**: Sessions are managed via a local SQLite database, ensuring conversation history persists across restarts.
*   **Streaming**: Responses are streamed via SSE (Server-Sent Events) to provide real-time interaction feedback.

## 🎨 Design System: "Lab Console"

The v2 frontend utilizes a premium design system named "Lab Console".

| Element | Specification | Utility Class |
| :--- | :--- | :--- |
| **Typography** | Outfit (Sans), JetBrains Mono (Code) | `font-['Outfit']`, `font-mono` |
| **Surface** | 60% Transparency, 12px Blur | `glass-panel` |
| **Cards** | 8% Border, Shimmer Hover | `glass-card` |
| **Accent** | Cobalt Blue (#3B82F6) | `text-blue-400`, `bg-blue-500` |
| **Scale** | Desktop-First, Highly Responsive | `@media (min-width: 1024px)` |

## 📁 Repository Structure

```
kimo-labs/
├── apps/
│   ├── backend/            # Python FastAPI service
│   │   ├── app/
│   │   │   ├── core/      # Multimodal Engines (ASR, TTS, RAG)
│   │   │   ├── db/        # SQLite / SQLAlchemy models
│   │   │   └── main.py    # Core API Gateway
│   │   └── data/           # Persistent vectors and SQLite
│   └── frontend/           # Next.js 15+ application
│       ├── src/
│       │   ├── app/       # Page-level workbenches (ASR, TTS, Chat)
│       │   ├── components/ # Shared UI & Tools
│       │   └── hooks/      # Audio & Chat state hooks
└── README.md              # Project Overview
```

## 🔒 Security & Privacy

*   **100% Local Inference**: No telemetry or data leaves the local machine.
*   **Isolated Storage**: Vectors and chat logs are stored in the `./data` directory within the workspace.
*   **Sandbox Mode**: Frontend interactions are constrained to the local API node.

---

*Kimo Labs Research Nodes - Technical Specifications v2.0*
