# LiteTavern Backend Refactoring Plan (Phase 1)

I have analyzed your "LiteTavern" blueprint and the current `server.py`. The current server is a basic file server, while your vision is a sophisticated AI orchestration layer.

To achieve Phase 1 (**Context Engine, Prompt Compiler, Token Manager**) without breaking the current functionality immediately, I propose the following implementation plan:

## 🏗️ Step 1: Directory & Dependency Setup
We will transition from a single script to a modular package structure.
*   **Create Directory Tree**:
    ```text
    /backend
      /core         # Context, Prompt, Token engines
      /domain       # Data models (Pydantic)
      /api          # FastAPI routes
    ```
*   **Dependencies**: Introduce `fastapi`, `uvicorn`, `pydantic`, `httpx` (for making upstream API calls), and `tiktoken` (for accurate token counting).

## 🧠 Step 2: Implement Core Engines (The "Brain")
I will build the three pillars of Phase 1 in `backend/core/`:

1.  **`context.py` (Context Engine)**:
    *   Define the `ContextFrame` model.
    *   Implement logic to assemble `System`, `Lore`, `History`, and `User Input` into a unified frame.
2.  **`token.py` (Token Manager)**:
    *   Implement a `TokenBudget` class.
    *   Add logic to trim "Low Priority" content (e.g., old history) before "High Priority" content (e.g., Character Persona) when the context limit is reached.
3.  **`prompt.py` (Prompt Compiler)**:
    *   Implement the pipeline that takes a `ContextFrame` and compiles it into the final JSON payload for the LLM.

## 🔌 Step 3: FastAPI Integration
*   Create `backend/main.py` as the new entry point.
*   **Endpoint**: Implement `/api/v1/chat/completions` (OpenAI-compatible).
    *   This allows the Frontend to simply change its `API URL` to point to `http://localhost:8000/api/v1/chat/completions`.
    *   The backend will receive the request, run it through the **Context Engine**, and then stream the result back.
*   **Static Serving**: Mount the current frontend files so `localhost:8000` still serves the UI.

## 🔄 Step 4: Frontend "Proxy" Switch
*   I will modify `script.js` slightly (or you can do it via settings) to point the API URL to our local backend by default.
*   This shifts the responsibility of "Prompt Construction" from the Frontend (JS) to the Backend (Python), enabling the advanced features you requested.

## 📦 Deliverables
*   A new `run.py` (or updated `server.py`) to launch the FastAPI server.
*   The modular `backend/` source code.
*   A working "Orchestration" layer that intercepts chat requests.

Do you confirm this plan?