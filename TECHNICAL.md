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

| Service | Protocol | Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js | `3001` | [Monolith Console](http://localhost:3001) |
| **Backend** | FastAPI | `8001` | [Intelligence API](http://localhost:8001/docs) |
| **ChromaDB** | Vector Lake | `8002` | High-dimensional Storage |
| **Chroma GUI** | Admin | `8003` | Vector Diagnostics |

## 🔒 Modern Engineering Standards
*   **Hybrid Inference**: Real-time cloud speed (Deepgram) + Local privacy (Whisper/Ollama).
*   **Atomic Design**: Monolith components are built with high-reusability via Tailwind v4 tokens.
*   **Persistent Context**: ReAct agent loops with local memory nodes ensure long-term intelligence consistency.

---

*Kimo Labs Research Node - Monolith Standard v3.0*
