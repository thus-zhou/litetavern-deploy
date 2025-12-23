@echo off
cd /d "%~dp0"
title LiteTavern Launcher
cls

echo ========================================================
echo       LiteTavern Pro Launcher
echo ========================================================
echo.

if not exist venv (
    echo [1/3] Creating virtual environment...
    python -m venv venv
    
    echo [2/3] Installing dependencies...
    venv\Scripts\python.exe -m pip install -r requirements.txt
    venv\Scripts\python.exe -m pip install email-validator
) else (
    echo [1/3] Virtual environment found.
    echo [2/3] Checking dependencies...
    venv\Scripts\python.exe -m pip install email-validator >nul 2>&1
)

echo.
echo [3/3] Starting Service...
echo.
echo     --------------------------------------------------
echo     Local URL: http://localhost:8000
echo     Remote URL: https://xxxx.trycloudflare.com
echo     --------------------------------------------------
echo.
echo     Please keep this window open.
echo.

venv\Scripts\python.exe run.py
pause
