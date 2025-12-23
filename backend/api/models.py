# Models Router
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from backend.core.database import db
import httpx

router = APIRouter()

class ModelUpdate(BaseModel):
    name: str
    model_id: str
    provider: str
    api_url: str
    api_key: str
    power_cost: int
    context_length: int
    enabled: bool

class TestConnectionRequest(BaseModel):
    api_url: str
    api_key: str
    model_id: str

@router.get("/admin/models")
async def get_models(admin_user: str = "admin", admin_pass: str = "admin123"):
    # In real app, verify admin token
    return db.get_models(include_secrets=True)

@router.post("/admin/models/{model_id}")
async def update_model(model_id: int, updates: ModelUpdate):
    # In real app, verify admin token
    db.update_model(model_id, updates.dict())
    return {"status": "ok"}

@router.post("/admin/models/test")
async def test_model_connection(payload: TestConnectionRequest):
    """
    Tests the connection to the LLM API.
    Supports OpenAI-compatible endpoints.
    """
    try:
        # Construct headers
        headers = {
            "Authorization": f"Bearer {payload.api_key}",
            "Content-Type": "application/json"
        }
        
        # Simple test payload (1 token max to save cost)
        data = {
            "model": payload.model_id,
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 1
        }
        
        # Determine URL (handle /v1/chat/completions suffix logic)
        url = payload.api_url.rstrip('/')
        if not url.endswith('/chat/completions'):
             # If user just gave base URL like https://api.openai.com/v1, append path
             # If user gave https://api.openai.com, append /v1/chat/completions?
             # Let's assume standard behavior: user provides base URL.
             if not url.endswith('/v1'):
                 url += '/v1'
             url += '/chat/completions'
        
        # For some providers (like Azure or custom), logic might differ.
        # But for "OpenAI Compatible", this is standard.
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=data, headers=headers)
            
            if resp.status_code == 200:
                return {"success": True, "message": "Connection Successful! (200 OK)"}
            elif resp.status_code == 401:
                return {"success": False, "message": "Authentication Failed (401). Check API Key."}
            else:
                return {"success": False, "message": f"Error {resp.status_code}: {resp.text[:100]}"}
                
    except Exception as e:
        return {"success": False, "message": f"Connection Error: {str(e)}"}
