@echo off
:: Use standard English to avoid encoding errors on Windows CMD
set "REPO_USER=thus-zhou"
set "REPO_NAME=litetavern-deploy"
set "REPO_URL=https://github.com/%REPO_USER%/%REPO_NAME%.git"

echo ========================================================
echo       LiteTavern Git Uploader
echo ========================================================
echo.
echo Target Repo: %REPO_URL%
echo.
echo [IMPORTANT]
echo Please make sure you have created an EMPTY repository named "%REPO_NAME%" on GitHub!
echo URL: https://github.com/new
echo.
echo Press any key to start uploading...
pause >nul

:: Check Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b
)

:: Init
if not exist .git (
    echo [1/5] Initializing repository...
    git init
)

:: Add
echo [2/5] Adding files...
git add .

:: Commit
echo [3/5] Committing changes...
git commit -m "Auto update: %date% %time%"

:: Branch
git branch -M main

:: Remote
echo [4/5] Configuring remote...
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

:: Push
echo [5/5] Pushing to GitHub...
echo.
echo -------------------------------------------------------
echo If a login window appears, please sign in via browser.
echo If it fails, check if the repo exists on GitHub.
echo -------------------------------------------------------
echo.
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [FAILED] Push failed. Please check your network or repo settings.
) else (
    echo.
    echo [SUCCESS] Code uploaded successfully!
)

pause
