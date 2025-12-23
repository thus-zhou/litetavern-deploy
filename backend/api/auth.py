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

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# --- Email Service (SMTP) ---
def send_email_smtp(email: str, code: str):
    # Try multiple providers or default to a free relay service if env vars are missing
    # 1. User configured SMTP (Priority)
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    
    # 2. Brevo (Sendinblue) Free Tier Fallback (Optional hardcoded fallback for ease of use)
    # If user didn't config, we can try a public relay if we had one.
    # But for now, let's just make the error clearer or use a simpler default.
    
    # Auto-detect common providers if user only provided user/pass
    if not smtp_server and smtp_user:
        if "@gmail.com" in smtp_user:
            smtp_server = "smtp.gmail.com"
        elif "@outlook.com" in smtp_user or "@hotmail.com" in smtp_user:
            smtp_server = "smtp.office365.com"
        elif "@qq.com" in smtp_user:
            smtp_server = "smtp.qq.com"
            smtp_port = 465 # QQ usually needs SSL

    if not smtp_user or not smtp_pass:
        print("⚠️ SMTP credentials not set. Falling back to mock email.")
        send_email_mock(email, code)
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = email
        msg['Subject'] = "LiteTavern Verification Code"
        
        body = f"""
        <html>
          <body>
            <h2>Welcome to LiteTavern!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #3b82f6; letter-spacing: 5px;">{code}</h1>
            <p>This code expires in 5 minutes.</p>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        if not smtp_server:
             # Default fallback
             smtp_server = "smtp.gmail.com"

        # Handle SSL vs TLS based on port
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
            server.login(smtp_user, smtp_pass)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            
        server.send_message(msg)
        server.quit()
        logger.info(f"Sent email to {email}")
        print(f"✅ Email sent to {email}")
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Auth Error: {e}")
        print(f"❌ SMTP Authentication Failed. Check your Password/App Password. Response: {e.smtp_error}")
        send_email_mock(email, code)
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        print(f"❌ Failed to send email: {e}")
        # Fallback to mock if real email fails, so user can at least see code in logs if they have access
        send_email_mock(email, code)

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
    background_tasks.add_task(send_email_smtp, payload.email, code)
    
    return {"message": "Verification code sent."}

@router.post("/auth/register")
async def register(payload: RegisterRequest, request: Request):
    ip = get_client_ip(request)
    
    # 1. Check if Code is Invite Code or Email Code
    # Try invite code first
    if db.check_invite_code(payload.code):
        is_invite = True
    else:
        is_invite = False
        valid_code = db.get_valid_code(payload.email, payload.code)
        if not valid_code:
            raise HTTPException(status_code=400, detail="Invalid verification code or invite code.")
    
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
    if is_invite:
        # Need user_id, retrieve it
        user = db.get_user_by_auth(payload.username, payload.password)
        if user:
            db.mark_invite_code_used(payload.code, user['id'])
    else:
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
