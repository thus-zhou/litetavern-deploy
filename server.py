import http.server
import socketserver
import json
import os
import sys
import webbrowser
import threading
import time
from urllib.parse import urlparse, parse_qs

# --- Resource Path Handling for PyInstaller ---
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

PORT = 8000
DATA_FILE_DEFAULT = 'server_data.json'
DATA_FILE_PC = 'server_data_pc.json'
DATA_FILE_MOBILE = 'server_data_mobile.json'

# Ensure we are in the directory where data files should be (cwd)
# When frozen, CWD might be different, but data files should be in user data or alongside exe?
# If we want data persistence across updates, we should store in AppData or Documents.
# For simplicity, let's store in the directory of the executable (if writable) or user home.
APP_DATA_DIR = os.path.join(os.path.expanduser('~'), 'Documents', 'AI_RPG_Data')
if not os.path.exists(APP_DATA_DIR):
    try:
        os.makedirs(APP_DATA_DIR)
    except:
        APP_DATA_DIR = '.' # Fallback to local

def get_data_path(filename):
    return os.path.join(APP_DATA_DIR, filename)

def get_data_file(path):
    parsed = urlparse(path)
    params = parse_qs(parsed.query)
    source = params.get('source', [''])[0]
    
    if source == 'pc':
        return get_data_path(DATA_FILE_PC)
    elif source == 'mobile':
        return get_data_path(DATA_FILE_MOBILE)
    return get_data_path(DATA_FILE_DEFAULT)

class SyncHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set directory to resource path for serving static files
        try:
            directory = sys._MEIPASS
        except Exception:
            directory = os.getcwd()
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/status'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
            return
        
        if self.path.startswith('/api/data'):
            data_file = get_data_file(self.path)
            if os.path.exists(data_file):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                with open(data_file, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                # Return empty json if not exists
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{}')
            return
            
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/data'):
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Decode bytes to string
                json_str = post_data.decode('utf-8')
                
                # Validate JSON
                json.loads(json_str)
                
                data_file = get_data_file(self.path)
                
                # Write original bytes to file (utf-8)
                with open(data_file, 'wb') as f:
                    f.write(post_data)
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "saved", "file": "' + data_file.encode() + b'"}')
                print(f"Data saved to {data_file}")
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                print(f"Error saving data: {e}")
            return
            
        return super().do_POST()

def open_browser():
    time.sleep(1)
    print("Opening browser...")
    webbrowser.open(f'http://localhost:{PORT}')

print(f"Starting Sync Server on port {PORT}...")
print(f"Data Directory: {APP_DATA_DIR}")

# Create default data files if not exists
for f in [DATA_FILE_DEFAULT, DATA_FILE_PC, DATA_FILE_MOBILE]:
    path = get_data_path(f)
    if not os.path.exists(path):
        with open(path, 'w') as file:
            file.write('{}')

# Allow address reuse
socketserver.TCPServer.allow_reuse_address = True

# Start browser thread
if getattr(sys, 'frozen', False):
    threading.Thread(target=open_browser, daemon=True).start()

with socketserver.TCPServer(("", PORT), SyncHandler) as httpd:
    print("Serving forever. Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
