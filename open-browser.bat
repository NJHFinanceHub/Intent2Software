@echo off
REM Intent-to-Software Platform - Open in Browser

echo Opening Intent-to-Software Platform in browser...

REM Wait a moment for services to be ready
timeout /t 2 >nul

REM Open frontend
start http://localhost:5173

echo.
echo Platform opened in your default browser!
echo.
timeout /t 2
