@echo off
cd /d "%~dp0"
title LiteTavern 手机/局域网模式
color 0B
cls

echo ========================================================
echo       LiteTavern 手机端同步服务 (局域网模式)
echo ========================================================
echo.
echo [1] 环境检查...
if not exist venv (
    echo     未找到虚拟环境，请先运行 start_game.bat 初始化。
    pause
    exit
)
call venv\Scripts\activate

echo.
echo [2] 您的局域网 IP 地址:
echo     (请确保手机和电脑连接同一 Wi-Fi)
echo.
ipconfig | findstr "IPv4"
echo.
echo [3] 手机浏览器输入: http://<上面的IP>:8000
echo.
echo ========================================================
echo 服务正在启动...
echo.
python run.py
pause
