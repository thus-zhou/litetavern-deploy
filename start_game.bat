@echo off
cd /d "%~dp0"
title LiteTavern Local Launcher (Offline Mode)
cls

echo ========================================================
echo       LiteTavern Local Launcher (Offline Mode)
echo ========================================================
echo.
echo Note: This mode disables Cloudflare Tunnel (faster startup).
echo Use 'share_app.bat' if you need remote access.
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
echo [3/3] Starting Local Service...
echo.

:: Set flag to disable tunnel
set NO_TUNNEL=1

venv\Scripts\python.exe run.py
pause
