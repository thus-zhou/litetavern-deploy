from fastapi import APIRouter, Query, Body, HTTPException
from fastapi.responses import JSONResponse
import os
import json
import sys

router = APIRouter()

# --- Legacy Sync Logic Ported ---

DATA_FILE_DEFAULT = 'server_data.json'
DATA_FILE_PC = 'server_data_pc.json'
DATA_FILE_MOBILE = 'server_data_mobile.json'

# Determine App Data Dir
# Use same logic as server.py
APP_DATA_DIR = os.path.join(os.path.expanduser('~'), 'Documents', 'AI_RPG_Data')
if not os.path.exists(APP_DATA_DIR):
    try:
        os.makedirs(APP_DATA_DIR)
    except:
        APP_DATA_DIR = '.' 

def get_data_path(filename):
    return os.path.join(APP_DATA_DIR, filename)

def resolve_file(source: str):
    if source == 'pc':
        return get_data_path(DATA_FILE_PC)
    elif source == 'mobile':
        return get_data_path(DATA_FILE_MOBILE)
    return get_data_path(DATA_FILE_DEFAULT)

# Ensure files exist
for f in [DATA_FILE_DEFAULT, DATA_FILE_PC, DATA_FILE_MOBILE]:
    path = get_data_path(f)
    if not os.path.exists(path):
        with open(path, 'w') as file:
            file.write('{}')

@router.get("/data")
async def get_sync_data(source: str = Query(None)):
    data_file = resolve_file(source)
    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if not content: return {}
                return json.loads(content)
        except Exception as e:
            print(f"Error reading {data_file}: {e}")
            return {}
    return {}

@router.post("/data")
async def save_sync_data(source: str = Query(None), data: dict = Body(...)):
    data_file = resolve_file(source)
    try:
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return {"status": "saved", "file": data_file}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_status():
    return {"status": "ok", "backend": "LiteTavern v1"}
