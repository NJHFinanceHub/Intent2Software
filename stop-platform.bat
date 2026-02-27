@echo off
REM Intent-to-Software Platform - Stop Script

echo ========================================
echo Intent-to-Software Platform
echo Stopping all services...
echo ========================================
echo.

cd /d "%~dp0"

docker compose down

echo.
echo ========================================
echo Platform stopped successfully!
echo ========================================
echo.

timeout /t 3
