I will design and implement a **Mobile-First AI Role-Playing Web App** in the current directory. This application will run directly in a mobile browser (or desktop) and function like a native app.

**Technical Approach:**
*   **Architecture**: Single Page Application (SPA) using HTML5, CSS3, and Vanilla JavaScript.
*   **Mobile Support**: Responsive layout, touch-friendly interfaces, and persistent storage using `localStorage` (so data survives browser closes).
*   **AI Integration**: Direct connection to Large Language Models (OpenAI-compatible format) using the user's API Key.

**Implementation Plan:**

1.  **File Management**:
    *   Backup the existing Snake game files to a `snake_backup` folder to preserve them.
    *   Create new `index.html`, `style.css`, and `script.js` for the RPG app.

2.  **User Interface (Mobile Optimized)**:
    *   **Settings Screen**: 
        *   Input for API Key/URL (stored locally).
        *   Large text area for **Character Definition** (the "detailed plain text setting").
        *   "Start Chat" button.
    *   **Chat Screen**:
        *   Chat history view (bubbles for User vs. AI).
        *   Bottom input bar with text field and send button.
        *   "Back to Settings" button.

3.  **Core Logic (`script.js`)**:
    *   **State Management**: Load/Save character settings and chat history from `localStorage`.
    *   **AI Interaction**: Function to send the "Character Definition" as the *System Prompt* and the chat history to the LLM API.
    *   **Streaming/Loading**: Handle API waiting states (showing "Character is typing..." or similar).

4.  **Verification**:
    *   I will verify the responsive design simulates a mobile view.
    *   I will test the configuration storage.
