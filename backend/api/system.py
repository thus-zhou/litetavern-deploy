from fastapi import APIRouter
from backend.core.tunnel import tunnel_service

router = APIRouter()

@router.get("/system/tunnel")
async def get_tunnel_status():
    return {
        "url": tunnel_service.url,
        "password": tunnel_service.password,
        "status": "connected" if tunnel_service.url else "connecting" if tunnel_service.running else "stopped"
    }
