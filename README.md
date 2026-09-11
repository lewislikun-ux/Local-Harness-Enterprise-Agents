# Local-First Agent Harness

A modular, local-first multi-agent harness and execution runtime inspired by open-source agent frameworks (Grok Bot, Rakazo, OpenMausBot). The system provides persistent multi-bot agent personas, a model-agnostic routing abstraction defaulting to Google Gemini via the `@google/genai` SDK, and a safe, sandboxed execution runtime with a virtual workspace.

---

## 1. Architecture Overview (v1.0 MVP)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Developer Web UI                                 │
│  ┌──────────────────┐  ┌───────────────────────────┐  ┌──────────────────┐  │
│  │   Sidebar.tsx    │  │     ChatInterface.tsx     │  │ WorkspaceDrawer  │  │
│  │  - Bot Roster    │  │  - Streaming Feed         │  │  - Virtual Files │  │
│  │  - Agent Editor  │  │  - Collapsible Tool Logs  │  │  - Execution Logs│  │
│  │  - Settings Modal│  │  - Multi-turn Reasoning   │  │  - Sandbox State │  │
│  └─────────┬────────┘  └─────────────┬─────────────┘  └────────┬─────────┘  │
└────────────┼─────────────────────────┼─────────────────────────┼────────────┘
             │                         │                         │
             ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Client Storage Layer (lib/storage.ts)                  │
│       In-Memory State Synchronized with LocalStorage (Local-First)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Express Backend Server (server.ts)                     │
│  ┌───────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │    POST /api/chat                 │  │   POST /api/sandbox/execute    │  │
│  │    (Orchestration & LLM Routing)  │  │   GET/POST /api/sandbox/files  │  │
│  │                                   │  │   GET /api/sandbox/logs        │  │
│  └─────────────────┬─────────────────┘  └────────────────┬───────────────┘  │
│                    │                                     │                  │
│                    ▼                                     ▼                  │
│  ┌───────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │   LLM Provider (lib/ai/provider)  │  │ Sandbox Runtime (lib/sandbox)  │  │
│  │   - GeminiLLMProvider             │◄─┤ - execute_code (JS / Python)   │  │
│  │   - LocalFallbackLLMProvider      │  │ - file_writer (Virtual FS)     │  │
│  │   - Harness Tool Declarations     │  │ - web_search / fetch_url       │  │
│  └─────────────────┬─────────────────┘  └────────────────┬───────────────┘  │
│                    │                                     │                  │
│                    ▼                                     ▼                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              Structured Logger & Telemetry (lib/logger.ts)            │  │
│  │       - Function call logging (sanitized parameters)                  │  │
│  │       - GenAI call logging (model, prompt, config, stripped output)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Key Files

```text
├── components/
│   ├── AgentModal.tsx         # Modal to create, edit, or configure agent personas
│   ├── ChatInterface.tsx      # Main message stream, prompt starters, and input box
│   ├── SettingsModal.tsx      # Gateway configuration (Gemini / Local) & model switcher
│   ├── Sidebar.tsx            # Multi-bot persona roster and system navigation
│   ├── ToolCallLog.tsx        # Collapsible visualizer for tool status, duration, and I/O
│   └── WorkspaceDrawer.tsx    # Right-side panel: virtual file explorer, logs, and scratchpad
├── lib/
│   ├── ai/
│   │   ├── client.ts          # Lazy-initialized GoogleGenAI SDK client (User-Agent telemetry)
│   │   └── provider.ts        # Model-agnostic LLMProvider interface & Gemini function-calling loop
│   ├── config/
│   │   └── constants.ts       # Centralized configuration (models, limits, default personas)
│   ├── logger.ts              # Structured logger stripping heavy inline/binary data
│   ├── sandbox/
│   │   └── executor.ts        # In-process sandboxed JS/Python evaluator and virtual workspace
│   └── storage.ts             # Local-first persistence helpers (localStorage synchronization)
├── server/
│   └── routes/
│       ├── chat.ts            # /api/chat orchestration endpoint
│       └── sandbox.ts         # /api/sandbox file operations and tool runner
├── server.ts                  # Express entry point (port 3000, host 0.0.0.0, Vite middleware)
├── src/
│   ├── App.tsx                # Master 3-pane layout combining state and drawer management
│   ├── index.css              # Global Tailwind CSS imports
│   └── main.tsx               # Client React DOM entry point
└── types/
    └── index.ts               # Core TypeScript interfaces (Agent, ChatMessage, ToolCall, etc.)
```

---

## 3. Core Implementation Details

### Centralized Config (`lib/config/constants.ts`)
All configurable parameters are centralized:
- `AVAILABLE_MODELS`: List of supported models (`gemini-2.5-flash`, `gemini-3.8-flash`, `gemini-3.1-pro-preview`, `qwen-2.5-coder-local`).
- `DEFAULT_AGENTS`: Starter personas (Architect Alpha, Code-Monkey, Data-Analyst).
- `SANDBOX_LIMITS`: Maximum execution time (5000ms), output size limits, and allowed file extensions.

### Logging Policy (`lib/logger.ts`)
Strict adherence to telemetry guidelines:
- **Function Calls**: Logged as `info` with parameter objects (`logFunctionCall`).
- **GenAI Calls**: Logged with model name, input prompt structure, generation config, and model output (`logGenAICall`).
- **Data Stripping**: `stripInlineData` automatically replaces base64 inline binary data with size summaries to prevent memory bloat in logs.

### Multi-Turn Tool Calling Orchestration (`lib/ai/provider.ts`)
When an agent is queried:
1. Formats conversation turns into Gemini SDK content parts.
2. Attaches the `HARNESS_TOOL_DECLARATIONS` (`execute_code`, `file_writer`, `web_search`, `fetch_url`).
3. If the model emits `functionCalls`, dispatches them to `dispatchSandboxTool`.
4. Appends tool results as `functionResponse` blocks and continues the loop up to `APP_CONFIG.maxToolIterations` (6 turns) until the final synthesis is returned.

### Virtual Workspace & Sandbox (`lib/sandbox/executor.ts`)
- **Virtual File System**: In-memory file repository with auto-language detection, line count, and byte measurement.
- **Code Sandbox**: Evaluates code in an isolated scope with a custom sandboxed console, capturing stdout/stderr and return values without polluting the global environment.

---

## 4. Next Version (v2.0) Implementation Blueprint

The following items were intentionally deferred from the MVP to follow the "Ponytail" principle of minimal, high-leverage code. Here is the architectural guide for the next iteration:

### A. Persistent SQLite / Wasm Backend
* **Goal**: Upgrade from browser `localStorage` and server memory to a unified local SQLite database.
* **Target Packages**:
  - Client-side: `@sqlite.org/sqlite-wasm` or `sql.js` using the Origin Private File System (OPFS).
  - Server-side: `better-sqlite3` or `sqlite3` backed by a local file (`data/harness.db`).
* **Schema Definition**:
  ```sql
  CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    avatar TEXT,
    model TEXT,
    temperature REAL,
    system_prompt TEXT,
    created_at INTEGER
  );

  CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT,
    tool_calls_json TEXT,
    timestamp INTEGER
  );

  CREATE TABLE workspace_files (
    path TEXT PRIMARY KEY,
    content TEXT,
    language TEXT,
    size INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE execution_logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER,
    level TEXT,
    category TEXT,
    message TEXT,
    metadata_json TEXT
  );
  ```
* **Integration Strategy**: Replace calls in `lib/storage.ts` with SQLite query bridges or a lightweight Drizzle ORM layer over SQLite.

---

### B. External Containerized / MicroVM Sandbox Runtime
* **Goal**: Transition from in-process Node `Function` evaluation to an external isolated container runner.
* **Execution Options**:
  1. **Local Docker / Podman Bridge**: Spawns ephemeral scratch containers (`alpine:latest` or `python:3.11-slim`) mounted to a sandboxed workspace directory with network disabled (`--network none`) and memory capped (`--memory 256m`).
  2. **WebAssembly / Pyodide In-Browser Worker**: Run Python and C/Rust compiled code inside a dedicated Web Worker via Pyodide (`pyodide.loadPackage()`), completely isolated from the main thread.
  3. **Node.js `vm` or `isolated-vm`**: Use V8 isolates (`isolated-vm`) on the server for strict CPU time limits and zero access to filesystem/network primitives.
* **Integration Strategy**:
  - Update `lib/sandbox/executor.ts`: replace `executeCodeInSandbox` with an adapter calling the isolate or container service runner.

---

### C. Voice & Audio Live API Streaming
* **Goal**: Add real-time speech-to-speech interaction with agents via Gemini's Live API.
* **Architecture**:
  1. **Server WebSocket Gateway**:
     - Connect to `ai.live.connect` using model `'gemini-3.1-flash-live-preview'`.
     - Set `responseModalities: [Modality.AUDIO]` with prebuilt voice config (e.g. `'Zephyr'` or `'Kore'`).
     - Relay binary PCM chunks between browser WebSocket and Gemini Live session.
  2. **Browser Audio Pipeline**:
     - Input: 16kHz PCM audio captured via `navigator.mediaDevices.getUserMedia` and `ScriptProcessorNode` / `AudioWorkletNode`.
     - Output: 24kHz PCM audio playback buffer with precise chunk scheduling (`nextStartTime += buffer.duration`).
     - Handle interruption signals (`message.serverContent?.interrupted`) by clearing the active audio queue.
* **UI Integration**:
  - Add a microphone toggle button in `components/ChatInterface.tsx` with a live audio visualizer.

---

## 5. Development & Running the Project

### Prerequisites
- Node.js 20+ (supports native TypeScript stripping and ES modules)
- A valid `GEMINI_API_KEY` (configured in `.env` or injected via AI Studio secrets)

### Commands
```bash
# Install dependencies
npm install

# Start full-stack development server (Express + Vite on http://0.0.0.0:3000)
npm run dev

# Run TypeScript linter verification
npm run lint

# Production build (bundles client with Vite and server with esbuild)
npm run build

# Start production server
npm run start
```

### Environment Configuration (`.env.example`)
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
APP_URL="http://localhost:3000"
```

### Vercel Deployment
When deploying to Vercel:
1. Ensure `GEMINI_API_KEY` is added to your Vercel Project Settings under **Environment Variables**.
2. Vercel automatically detects `vercel.json` and routes all `/api/*` traffic to the serverless function in `api/index.ts`.
3. The client SPA is served statically from `dist/` with client-side fallback.

