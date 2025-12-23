# Models Router
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from backend.core.database import db

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

@router.get("/admin/models")
async def get_models(admin_user: str = "admin", admin_pass: str = "admin123"):
    # In real app, verify admin token
    return db.get_models(include_secrets=True)

@router.post("/admin/models/{model_id}")
async def update_model(model_id: int, updates: ModelUpdate):
    # In real app, verify admin token
    db.update_model(model_id, updates.dict())
    return {"status": "ok"}
