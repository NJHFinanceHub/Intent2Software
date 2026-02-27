@echo off
REM Intent-to-Software Platform - Background Launcher
REM Starts the platform in the background (minimized)

echo ========================================
echo Intent-to-Software Platform
echo Starting in background...
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "%~dp0"

echo Starting platform services...
docker compose up -d --build

echo.
echo ========================================
echo Platform is starting in the background!
echo ========================================
echo.
echo It will be ready in a few minutes at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo.
echo To stop the platform, run: stop-platform.bat
echo To view logs, run: view-logs.bat
echo.

timeout /t 5
