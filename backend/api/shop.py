from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import uuid
import random
import string
from backend.core.database import db

router = APIRouter()

class RedeemRequest(BaseModel):
    code: str

class GenerateRequest(BaseModel):
    amount: int # How many codes
    value: int  # Value of each code (Power)

class ConfigRequest(BaseModel):
    key: str
    value: str

# --- Rate Limit for Redeem ---
# In-memory simple rate limit
redeem_attempts = {} # {ip: [timestamps]}

def check_redeem_limit(ip: str):
    now = time.time()
    history = redeem_attempts.get(ip, [])
    # Clean old
    history = [t for t in history if t > now - 3600]
    redeem_attempts[ip] = history
    
    if len(history) > 10: # 10 tries per hour
        return False
    
    history.append(now)
    redeem_attempts[ip] = history
    return True

import time

# --- Endpoints ---

@router.get("/shop/config")
async def get_shop_config():
    notice = db.get_config("shop_notice")
    reg_enabled = db.get_config("registration_enabled")
    return {
        "notice": notice,
        "registration_enabled": reg_enabled == "true"
    }

@router.post("/shop/redeem")
async def redeem_code(payload: RedeemRequest, request: Request):
    # Verify User
    # For now we rely on X-User-Id or similar from frontend, OR we parse it from body if we had auth token.
    # But wait, frontend doesn't send token yet in this simple app. 
    # We will assume the user is logged in on frontend and passes ID in header.
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Please login first")
    
    ip = request.client.host
    if not check_redeem_limit(ip):
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")

    success, msg, amount = db.redeem_code(int(user_id), payload.code.strip())
    
    if not success:
        raise HTTPException(status_code=400, detail=msg)
        
    return {"message": "Success", "added": amount}

# --- Admin Endpoints ---

@router.post("/admin/shop/generate")
async def generate_codes(payload: GenerateRequest):
    # Security: In real app, check admin auth
    
    codes = []
    for _ in range(payload.amount):
        # Format: LT-XXXX-XXXX-XXXX
        part1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        part3 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        code = f"LT-{part1}-{part2}-{part3}"
        codes.append({"code": code, "value": payload.value})
        
    db.create_recharge_codes(codes)
    return {"message": f"Generated {payload.amount} codes", "codes": codes}

@router.get("/admin/shop/codes")
async def list_codes():
    return db.get_all_codes()

@router.post("/admin/config")
async def update_config(payload: ConfigRequest):
    db.set_config(payload.key, payload.value)
    return {"status": "ok"}
