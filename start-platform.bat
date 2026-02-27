@echo off
REM Intent-to-Software Platform - Easy Launcher
REM Double-click this file to start the platform

echo ========================================
echo Intent-to-Software Platform
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo.
    echo Please start Docker Desktop first:
    echo 1. Open Docker Desktop from the Start menu
    echo 2. Wait for Docker to start (whale icon becomes solid)
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo Docker is running...
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo Starting the platform...
echo This will take 5-10 minutes the first time.
echo.
echo The platform will be available at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo.
echo Press Ctrl+C to stop the platform when you're done.
echo ========================================
echo.

REM Start the platform
docker compose up --build

pause
