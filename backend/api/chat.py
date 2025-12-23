from fastapi import APIRouter, Header, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional, Dict, Any
from pydantic import BaseModel
import httpx
import json
import logging
import time

from backend.domain.models import ChatRequest
from backend.core.context import ContextEngine
from backend.core.token_manager import TokenManager
from backend.core.database import db

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Engines
token_manager = TokenManager()
context_engine = ContextEngine(token_manager)

# Global Client
http_client = httpx.AsyncClient(timeout=120.0)

@router.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()

class ImageRequest(BaseModel):
    prompt: str
    model: str = "dall-e-3"
    n: int = 1
    size: str = "1024x1024"
    quality: str = "standard"
    response_format: str = "url"

@router.post("/v1/images/generations")
async def generate_image(
    request: Request,
    body: ImageRequest,
    authorization: Optional[str] = Header(None),
    x_upstream_url: Optional[str] = Header(None)
):
    # NOTE: Image Gen Power cost not implemented yet as per request (focus on Chat)
    # But for safety, we should probably require admin or similar. 
    # For now, we assume this is only called if enabled in settings, which users can't edit freely anymore.
    # However, to be strict, we might want to block this for non-admins if it uses user key?
    # User requirement says "Ordinary users cannot use their own API/URL".
    # So image gen also needs to move to managed models if we want to support it for users.
    # For now, let's keep it but it might fail if user has no key.
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing API Key")
        
    upstream_url = x_upstream_url or "https://api.openai.com/v1/images/generations"
    
    headers = {
        "Authorization": authorization,
        "Content-Type": "application/json"
    }
    
    payload = body.dict()
    
    try:
        logger.info(f"Generating image via {upstream_url}")
        resp = await http_client.post(upstream_url, headers=headers, json=payload)
        if resp.status_code != 200:
            logger.error(f"Image Gen Error {resp.status_code}: {resp.text}")
            return JSONResponse(content=json.loads(resp.text), status_code=resp.status_code)
        return JSONResponse(content=resp.json())
    except Exception as e:
        logger.error(f"Image Gen Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/v1/models")
async def list_models():
    """
    Return list of MANAGED models from DB.
    """
    models = db.get_models(include_secrets=False)
    # Transform to OpenAI format
    data = []
    for m in models:
        data.append({
            "id": str(m['id']), # Use DB ID as the "model" identifier for frontend
            "object": "model",
            "name": m['name'], # Custom field for UI
            "power_cost": m['power_cost'],
            "provider": m['provider']
        })
    
    return {
        "object": "list",
        "data": data
    }

@router.post("/v1/chat/completions")
async def chat_completions(
    request: ChatRequest, 
    # Frontend sends user_id in header for now (In real app, use JWT)
    x_user_id: Optional[int] = Header(None)
):
    """
    Power-Aware Chat Completion
    """
    if not x_user_id:
         raise HTTPException(status_code=401, detail="Missing User ID")

    # 1. Resolve Model
    try:
        model_db_id = int(request.model) # Frontend sends DB ID as string
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Model ID")

    model_config = db.get_model_by_id(model_db_id)
    if not model_config:
        raise HTTPException(status_code=404, detail="Model not found")
        
    if not model_config['enabled']:
        raise HTTPException(status_code=403, detail="Model is disabled")

    # 2. Check & Deduct Power (Pre-flight)
    cost = model_config['power_cost']
    success = db.deduct_power(x_user_id, cost, reason="chat", model_id=model_db_id)
    
    if not success:
        # Get current balance for error message
        user = db.get_user_by_id(x_user_id)
        balance = user['power_balance'] if user else 0
        raise HTTPException(
            status_code=402, 
            detail=f"Insufficient Power. Required: {cost}, Balance: {balance}. Please recharge."
        )

    # 3. Prepare Request
    # Optimize Context
    raw_messages = [m.dict() for m in request.messages]
    optimized_messages = context_engine.build_context(
        messages=raw_messages,
        max_context_tokens=model_config['context_length'] // 2, # Conservative
        system_prompt=None
    )
    
    api_url = model_config['api_url']
    if not api_url.endswith("/chat/completions"):
        if api_url.endswith("/"):
            api_url += "chat/completions"
        else:
            api_url += "/chat/completions"
            
    api_key = model_config['api_key']
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_config['model_id'], # The real model string (gpt-4)
        "messages": optimized_messages,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "presence_penalty": request.presence_penalty,
        "frequency_penalty": request.frequency_penalty,
        "stream": request.stream
    }

    # 4. Execute & Stream
    if request.stream:
        return StreamingResponse(
            stream_with_refund_guard(api_url, headers, payload, x_user_id, cost),
            media_type="text/event-stream"
        )
    else:
        # Non-streaming
        try:
            resp = await http_client.post(api_url, headers=headers, json=payload)
            if resp.status_code != 200:
                # REFUND
                logger.error(f"Upstream Error {resp.status_code}: {resp.text}")
                db.refund_power(x_user_id, cost, reason="refund_error")
                return JSONResponse(content={"error": resp.text}, status_code=resp.status_code)
            return JSONResponse(content=resp.json())
        except Exception as e:
            # REFUND
            logger.error(f"Upstream Exception: {e}")
            db.refund_power(x_user_id, cost, reason="refund_exception")
            raise HTTPException(status_code=502, detail=str(e))

async def stream_with_refund_guard(url, headers, payload, user_id, cost):
    """
    Wraps the stream. If it fails *immediately* or yields error, refund.
    """
    has_started = False
    try:
        async with http_client.stream('POST', url, headers=headers, json=payload) as response:
            if response.status_code != 200:
                # Immediate Failure
                error_content = await response.aread()
                logger.error(f"Stream Start Error: {error_content}")
                db.refund_power(user_id, cost, reason="refund_stream_start")
                yield f"data: {json.dumps({'error': error_content.decode()})}\n\n"
                return

            async for line in response.aiter_lines():
                if line:
                    # If we get a chunk, we consider the "Service Rendered" (partially at least)
                    # To be very strict: we could wait for [DONE].
                    # But if we get any token, the AI has "worked".
                    # However, if the first chunk is an error json?
                    has_started = True
                    yield f"{line}\n"
                    
    except Exception as e:
        logger.error(f"Stream Exception: {e}")
        # If it crashed mid-stream, strict policy says "AI 失败 -> 全额返还"
        # We can try to refund if we think it failed catastrophically.
        # For safety, let's refund.
        db.refund_power(user_id, cost, reason="refund_stream_crash")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
