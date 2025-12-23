import urllib.request
import os

assets = [
    ("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3", "assets/msg.mp3"),
    ("https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3", "assets/forest.mp3"),
    ("https://assets.mixkit.co/active_storage/sfx/2438/2438-preview.mp3", "assets/rain.mp3"),
    ("https://www.transparenttextures.com/patterns/paper.png", "assets/paper.png")
]

print("Downloading assets to speed up local access...")

for url, path in assets:
    try:
        print(f"Downloading {url}...")
        # Add a user agent to avoid 403 Forbidden on some sites
        req = urllib.request.Request(
            url, 
            data=None, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print(f"Saved to {path}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

print("Done!")