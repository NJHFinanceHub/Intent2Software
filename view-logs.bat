@echo off
REM Intent-to-Software Platform - View Logs

echo ========================================
echo Intent-to-Software Platform
echo Viewing logs...
echo ========================================
echo.
echo Press Ctrl+C to stop viewing logs
echo.

cd /d "%~dp0"

docker compose logs -f
