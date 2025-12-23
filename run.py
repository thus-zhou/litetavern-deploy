import uvicorn
import os
import sys
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    print("Opening browser...")
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    # Ensure backend is in python path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    print("Starting LiteTavern Backend...")
    print("Core Engines: Context, Prompt, Token initialized.")
    
    # Always open browser for better user experience
    threading.Thread(target=open_browser, daemon=True).start()
        
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
