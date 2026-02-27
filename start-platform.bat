@echo off
REM ============================================================
REM  Intent-to-Software Platform — Fully Automatic Launcher
REM  Just double-click this file. It handles EVERYTHING.
REM ============================================================

color 0B
echo.
echo ========================================
echo   Intent-to-Software Platform
echo   Automatic Setup and Launch
echo ========================================
echo.

REM Navigate to script directory
cd /d "%~dp0"

REM -----------------------------------
REM  Step 1: Check for Docker
REM -----------------------------------
echo [1/4] Checking for Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Docker is not installed. Installing now...
    echo  This requires Administrator privileges.
    echo.
    powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0install-prerequisites-windows.ps1\"' -Wait"
    echo.
    echo  Prerequisites installer finished.
    echo  Checking Docker again...
    docker --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  ERROR: Docker still not found after install.
        echo  You may need to RESTART your computer, then double-click
        echo  this file again.
        echo.
        pause
        exit /b 1
    )
)
echo  OK: Docker found.
echo.

REM -----------------------------------
REM  Step 2: Make sure Docker daemon is running
REM -----------------------------------
echo [2/4] Making sure Docker Desktop is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker Desktop is not running. Starting it now...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %errorlevel% neq 0 (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    echo  Waiting for Docker to start (this can take 30-60 seconds)...
    echo.

    REM Wait up to 120 seconds for Docker to be ready
    set /a attempts=0
    :WAIT_DOCKER
    set /a attempts+=1
    if %attempts% gtr 24 (
        echo.
        echo  ERROR: Docker did not start after 120 seconds.
        echo  Please open Docker Desktop manually, wait for the whale
        echo  icon to become solid, then double-click this file again.
        echo.
        pause
        exit /b 1
    )
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo  Still waiting... (%attempts%/24)
        goto WAIT_DOCKER
    )
)
echo  OK: Docker is running.
echo.

REM -----------------------------------
REM  Step 3: Build and start everything
REM -----------------------------------
echo [3/4] Building and starting the platform...
echo  (First time takes 3-5 minutes while images download)
echo.

docker compose up --build -d
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: docker compose failed. Check the output above.
    echo.
    pause
    exit /b 1
)

REM -----------------------------------
REM  Step 4: Wait for services and open browser
REM -----------------------------------
echo.
echo [4/4] Waiting for services to be ready...

REM Wait for backend health check
set /a attempts=0
:WAIT_HEALTHY
set /a attempts+=1
if %attempts% gtr 30 (
    echo.
    echo  Services are taking a while. Opening browser anyway...
    goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo  Waiting for backend... (%attempts%/30)
    goto WAIT_HEALTHY
)

:OPEN_BROWSER
echo.
echo ========================================
echo   Platform is RUNNING!
echo ========================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo.
echo   Opening in your browser now...
echo.
echo   To stop:  double-click stop-platform.bat
echo            or run: docker compose down
echo.
echo ========================================
echo.

start http://localhost:5173

echo Press any key to view live logs (Ctrl+C to stop viewing)...
pause >nul
docker compose logs -f
