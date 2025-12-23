from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import os
import sys

# Import routers
from backend.api import chat, sync, system, auth, models, shop
from backend.core.tunnel import tunnel_service

app = FastAPI(title="LiteTavern Backend", version="0.1.0")

# Gzip Compression (Speed Boost)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to your Vercel domain e.g. ["https://litetavern.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix="/api") # /api/v1/chat/completions
app.include_router(sync.router, prefix="/api") # /api/data, /api/status
app.include_router(system.router, prefix="/api") # /api/system/tunnel
app.include_router(auth.router, prefix="/api") # /api/auth/login
app.include_router(models.router, prefix="/api") # /api/admin/models
app.include_router(shop.router, prefix="/api") # /api/shop/redeem

@app.on_event("startup")
async def startup_event():
    # Only start tunnel if NOT in production (Render/Vercel)
    # Render sets RENDER=true
    if not os.getenv("RENDER") and not os.getenv("NO_TUNNEL"):
        tunnel_service.start(port=8000)
    else:
        print("✅ Production environment detected (or NO_TUNNEL set). Skipping Cloudflare Tunnel.")

@app.on_event("shutdown")
async def shutdown_event():
    tunnel_service.stop()

# Static Files (Frontend)
static_dir = os.path.dirname(os.path.abspath(__file__)) # backend/
root_dir = os.path.dirname(static_dir) # root
frontend_dist = os.path.join(root_dir, 'frontend', 'dist')

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    # Fallback to serving root (legacy) if dist not found
    app.mount("/", StaticFiles(directory=root_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
