@echo off
setlocal EnableDelayedExpansion

:: --- Configuration ---
set "REPO_USER=thus-zhou"
set "REPO_NAME=litetavern-deploy"
set "REPO_URL=https://github.com/%REPO_USER%/%REPO_NAME%.git"

:: --- Title & Info ---
echo ========================================================
echo       LiteTavern Git Uploader (Auto-Sync)
echo ========================================================
echo.
echo Target Repo: %REPO_URL%
echo.
echo This script will:
echo 1. Add all local changes.
echo 2. Commit them automatically.
echo 3. Push to GitHub main branch.
echo.
echo Press any key to start...
pause >nul

:: --- 1. Check Git Installation ---
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo Please install Git from https://git-scm.com/
    pause
    exit /b
)

:: --- 2. Initialize if needed ---
if not exist .git (
    echo [INFO] Initializing new Git repository...
    git init
    git branch -M main
    git remote add origin %REPO_URL%
) else (
    echo [INFO] Git repository found.
    :: Ensure remote is correct
    git remote remove origin >nul 2>nul
    git remote add origin %REPO_URL%
)

:: --- 3. Pull first (to avoid conflicts if repo is not empty) ---
echo [INFO] Pulling remote changes (if any)...
git pull origin main --rebase >nul 2>nul

:: --- 4. Add & Commit ---
echo [INFO] Adding files...
git add .

echo [INFO] Committing changes...
git commit -m "Auto update: %date% %time%" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] No changes to commit.
)

:: --- 5. Push ---
echo [INFO] Pushing to GitHub...
echo.
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed!
    echo Common reasons:
    echo  - Network issues (need VPN?)
    echo  - Authentication failed (Sign in via browser window)
    echo  - Remote repo has conflicting changes (try deleting remote repo and re-creating it empty)
) else (
    echo.
    echo [SUCCESS] Code uploaded successfully!
    echo Your Vercel/Render deployments should trigger automatically now.
)

endlocal
pause
