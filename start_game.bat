@echo off
cd /d "%~dp0"
if not exist venv (
    echo 正在创建虚拟环境... (Creating virtual environment...)
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo 正在启动 LiteTavern Pro...
python run.py
pause
