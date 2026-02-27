@echo off
REM Intent-to-Software Platform - Interactive Quick Start Guide

color 0B
echo.
echo ========================================
echo   Intent-to-Software Platform
echo   Quick Start Guide
echo ========================================
echo.
echo This guide will help you get started!
echo.
pause

:MENU
cls
echo.
echo ========================================
echo   What would you like to do?
echo ========================================
echo.
echo   1. Install Prerequisites (Docker, Node.js)
echo   2. Configure API Key
echo   3. Create Desktop Shortcuts
echo   4. Start the Platform
echo   5. Start Platform in Background
echo   6. Open Platform in Browser
echo   7. View Running Services
echo   8. Stop the Platform
echo   9. View Documentation
echo   0. Exit
echo.
echo ========================================
echo.

set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto CONFIG
if "%choice%"=="3" goto SHORTCUTS
if "%choice%"=="4" goto START
if "%choice%"=="5" goto START_BG
if "%choice%"=="6" goto OPEN
if "%choice%"=="7" goto STATUS
if "%choice%"=="8" goto STOP
if "%choice%"=="9" goto DOCS
if "%choice%"=="0" goto EXIT

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MENU

:INSTALL
cls
echo.
echo ========================================
echo   Installing Prerequisites
echo ========================================
echo.
echo Opening PowerShell to install prerequisites...
echo This requires Administrator privileges.
echo.
pause
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0install-prerequisites-windows.ps1\"'"
pause
goto MENU

:CONFIG
cls
echo.
echo ========================================
echo   Configure API Key
echo ========================================
echo.
echo Opening .env file for editing...
echo.
echo Add your AI provider API key:
echo   ANTHROPIC_API_KEY=sk-ant-your-key-here
echo   OR
echo   OPENAI_API_KEY=sk-your-key-here
echo.
pause

if not exist "%~dp0.env" (
    copy "%~dp0.env.example" "%~dp0.env"
    echo .env file created from template
)

notepad "%~dp0.env"
goto MENU

:SHORTCUTS
cls
echo.
echo ========================================
echo   Creating Desktop Shortcuts
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0create-desktop-shortcut.ps1"
pause
goto MENU

:START
cls
echo.
echo ========================================
echo   Starting Platform
echo ========================================
echo.
call "%~dp0start-platform.bat"
goto MENU

:START_BG
cls
echo.
echo ========================================
echo   Starting Platform in Background
echo ========================================
echo.
call "%~dp0start-platform-background.bat"
pause
goto MENU

:OPEN
cls
echo.
echo ========================================
echo   Opening Platform
echo ========================================
echo.
call "%~dp0open-browser.bat"
goto MENU

:STATUS
cls
echo.
echo ========================================
echo   Running Services
echo ========================================
echo.
cd /d "%~dp0"
docker compose ps
echo.
echo ========================================
echo.
pause
goto MENU

:STOP
cls
echo.
echo ========================================
echo   Stopping Platform
echo ========================================
echo.
call "%~dp0stop-platform.bat"
pause
goto MENU

:DOCS
cls
echo.
echo ========================================
echo   Documentation
echo ========================================
echo.
echo Opening documentation in Notepad...
echo.
echo Available documentation:
echo   - README.md (Main documentation)
echo   - QUICKSTART.md (5-minute guide)
echo   - INSTALL.md (Installation guide)
echo.
set /p doc="Which would you like to read? (readme/quick/install): "

if /i "%doc%"=="readme" notepad "%~dp0README.md"
if /i "%doc%"=="quick" notepad "%~dp0QUICKSTART.md"
if /i "%doc%"=="install" notepad "%~dp0INSTALL.md"

goto MENU

:EXIT
cls
echo.
echo ========================================
echo   Thank you for using
echo   Intent-to-Software Platform!
echo ========================================
echo.
timeout /t 2
exit
