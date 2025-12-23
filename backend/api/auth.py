from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from backend.core.database import db
import time
import random
import string
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SendCodeRequest(BaseModel):
    email: EmailStr

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserDataSync(BaseModel):
    user_id: int
    data_type: str 
    content: Dict[str, Any]

def generate_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

def get_client_ip(request: Request):
    return request.client.host

# --- Email Service (Mock) ---
def send_email_mock(email: str, code: str):
    """
    In a real system, use smtplib or an API like SendGrid/Mailgun.
    Here we log to console for the user to see.
    """
    print(f"\n==========================================")
    print(f"📧 [Mock Email Service] To: {email}")
    print(f"🔑 Verification Code: {code}")
    print(f"==========================================\n")
    logger.info(f"Sent verification code {code} to {email}")

# --- Endpoints ---

@router.post("/auth/send-code")
async def send_code(payload: SendCodeRequest, request: Request, background_tasks: BackgroundTasks):
    ip = get_client_ip(request)
    
    # 1. Rate Limit Check
    last_min, last_hour, last_day = db.get_ip_code_stats(ip)
    
    if last_min >= 1:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait 1 minute.")
    if last_hour >= 5:
        raise HTTPException(status_code=429, detail="Too many requests. Limit 5 per hour.")
    if last_day >= 20:
        raise HTTPException(status_code=429, detail="Daily limit exceeded.")
        
    # 2. Generate & Save
    code = generate_code()
    expires_at = time.time() + 300 # 5 minutes
    
    db.save_verification_code(payload.email, code, ip, expires_at)
    
    # 3. Send (Async)
    background_tasks.add_task(send_email_mock, payload.email, code)
    
    return {"message": "Verification code sent. Check your email (or server console)."}

@router.post("/auth/register")
async def register(payload: RegisterRequest, request: Request):
    ip = get_client_ip(request)
    
    # 1. Check Code
    valid_code = db.get_valid_code(payload.email, payload.code)
    if not valid_code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    
    # 2. Check IP Limit (1 Account per IP)
    # Admin is exempt or special logic? We stick to strict rule for now.
    # But wait, localhost might be shared. Let's allow localhost to have multiple for dev, but enforce on real IPs.
    if ip != "127.0.0.1" and db.check_ip_registered(ip):
         raise HTTPException(status_code=403, detail="Registration limit exceeded for this IP address.")

    # 3. Create User
    success = db.create_user(payload.username, payload.password, payload.email, ip)
    if not success:
        raise HTTPException(status_code=400, detail="Username or Email already exists.")
    
    # 4. Mark Code Used
    db.mark_code_used(payload.email, payload.code)
    
    return {"message": "User registered successfully."}

@router.post("/auth/login")
async def login(user: LoginRequest):
    user_record = db.get_user_by_auth(user.username, user.password)
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "id": user_record['id'],
        "username": user_record['username'],
        "is_admin": bool(user_record['is_admin']),
        "power_balance": user_record['power_balance']
    }

@router.post("/sync/push")
async def push_data(payload: UserDataSync):
    # Security note: In a real app, verify token. Here we trust the client provided user_id for simplicity as requested.
    db.save_user_data(payload.user_id, payload.data_type, payload.content)
    return {"status": "ok"}

@router.get("/sync/pull/{user_id}/{data_type}")
async def pull_data(user_id: int, data_type: str):
    data = db.get_user_data(user_id, data_type)
    return {"content": data} # Returns null if not found, client handles merge

@router.get("/admin/users")
async def admin_get_users(admin_user: str = "admin", admin_pass: str = "admin123"):
    return db.get_all_users_full_data()
