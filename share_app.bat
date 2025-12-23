@echo off
title LiteTavern 远程分享 (备用隧道)
color 0A
cls
echo ===================================================
echo   LiteTavern 远程访问 (LocalTunnel 模式)
echo ===================================================
echo.
echo [1/3] 正在检查环境...
call npm install -g localtunnel >nul 2>&1
echo.
echo [2/3] 获取访问密码...
echo.
echo ***************************************************
echo *  您的访问密码是:                                *
for /f "tokens=*" %%a in ('curl -s https://loca.lt/mytunnelpassword') do set IP=%%a
echo *  %IP%                                  *
echo ***************************************************
echo.
echo 注意: 如果打开网页提示输入 "Tunnel Password"，
echo       请输入上面显示的密码。
echo.
echo [3/3] 正在启动隧道...
echo.
echo ---------------------------------------------------
echo 请保持此窗口开启，不要关闭。
echo ---------------------------------------------------
echo.
call lt --port 8000
pause
