import subprocess
import threading
import sys
import os
import httpx
import time
import shutil

class TunnelService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TunnelService, cls).__new__(cls)
            cls._instance.process = None
            cls._instance.url = None
            cls._instance.password = None
            cls._instance.running = False
            cls._instance.provider = None # 'cloudflare' or 'localtunnel'
        return cls._instance

    def get_public_ip(self):
        try:
            with httpx.Client() as client:
                resp = client.get("https://api.ipify.org", timeout=5)
                return resp.text.strip()
        except Exception as e:
            print(f"[Tunnel] Failed to get public IP: {e}")
            return "Unknown"

    def _ensure_cloudflared(self):
        """Downloads cloudflared if not present."""
        exe_name = "cloudflared.exe" if os.name == 'nt' else "cloudflared"
        exe_path = os.path.join(os.getcwd(), exe_name)
        
        if os.path.exists(exe_path):
            return exe_path
            
        print("[Tunnel] Cloudflared not found. Downloading...")
        
        # URL List (Try mirror first for China users)
        urls = [
            "https://mirror.ghproxy.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe",
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        ]
        
        if os.name != 'nt':
             urls = [
                "https://mirror.ghproxy.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
                "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
             ]
        
        for url in urls:
            try:
                print(f"[Tunnel] Trying to download from: {url}")
                with httpx.stream("GET", url, follow_redirects=True, timeout=120.0) as resp:
                    if resp.status_code != 200:
                        print(f"[Tunnel] Failed with status {resp.status_code}")
                        continue
                        
                    with open(exe_path, "wb") as f:
                        for chunk in resp.iter_bytes():
                            f.write(chunk)
                
                if os.name != 'nt':
                    os.chmod(exe_path, 0o755)
                    
                print("[Tunnel] Cloudflared downloaded successfully.")
                return exe_path
            except Exception as e:
                print(f"[Tunnel] Download failed from {url}: {e}")
                continue

        print("❌ All download attempts failed.")
        print("👉 Please manually download 'cloudflared-windows-amd64.exe' from GitHub and place it in this folder.")
        print("👉 Download Link: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe")
        return None

    def start(self, port=8000):
        if self.running:
            return

        self.running = True
        
        # Try Cloudflare first
        self.thread = threading.Thread(target=self._run_cloudflare, args=(port,), daemon=True)
        self.thread.start()

    def _run_cloudflare(self, port):
        print(f"[Tunnel] Starting Cloudflare Tunnel on port {port}...")
        exe_path = self._ensure_cloudflared()
        
        if not exe_path:
            print("[Tunnel] Cloudflare binary missing. Falling back to LocalTunnel...")
            self._run_localtunnel(port)
            return

        self.provider = "cloudflare"
        cmd = f'"{exe_path}" tunnel --url http://localhost:{port}'
        
        self.process = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        cf_success = False
        
        while self.process and self.process.poll() is None:
            line = self.process.stdout.readline()
            if not line:
                break
            line = line.strip()
            if line:
                # Cloudflare outputs the URL in a specific format
                # e.g. "https://cool-name.trycloudflare.com"
                if ".trycloudflare.com" in line:
                    # Extract URL
                    import re
                    match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
                    if match:
                        self.url = match.group(0)
                        cf_success = True
                        print(f"==================================================")
                        print(f"  CLOUDFLARE TUNNEL: {self.url}")
                        print(f"==================================================")
        
        # If process exited and we didn't get a URL or it crashed quickly
        if not cf_success and self.running:
            print("[Tunnel] Cloudflare Tunnel failed/exited. Falling back to LocalTunnel...")
            self.provider = None
            self._run_localtunnel(port)

    def _run_localtunnel(self, port):
        print(f"[Tunnel] Starting LocalTunnel on port {port}...")
        self.provider = "localtunnel"
        
        # Get password for localtunnel
        def fetch_password():
            try:
                with httpx.Client() as client:
                    self.password = client.get("https://loca.lt/mytunnelpassword", timeout=5).text.strip()
            except:
                self.password = "Unknown"
        threading.Thread(target=fetch_password, daemon=True).start()

        cmd = "lt --port " + str(port)
        use_npx = False
        try:
            subprocess.run("lt --version", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            use_npx = True
        
        if use_npx:
            cmd = "npx localtunnel --port " + str(port)

        self.process = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        while self.process and self.process.poll() is None:
            line = self.process.stdout.readline()
            if not line:
                break
            line = line.strip()
            if line:
                if "your url is" in line.lower():
                    self.url = line.split("is:")[1].strip()
                    print(f"==================================================")
                    print(f"  LOCALTUNNEL URL: {self.url}")
                    print(f"  PASSWORD: {self.password}")
                    print(f"==================================================")
        
        self.running = False
        self.url = None

    def stop(self):
        if self.process:
            print("[Tunnel] Stopping tunnel...")
            try:
                subprocess.run(f"taskkill /F /T /PID {self.process.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except:
                pass
            self.process = None
            self.running = False
            self.url = None
            self.provider = None

tunnel_service = TunnelService()
