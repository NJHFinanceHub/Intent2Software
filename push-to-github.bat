@echo off
REM Push to GitHub - Helper Script

echo ========================================
echo Push to GitHub
echo ========================================
echo.

REM GitHub username configured
set GITHUB_USERNAME=NJHFinanceHub

echo Checking GitHub username...
if "%GITHUB_USERNAME%"=="YOUR-USERNAME-HERE" (
    echo ERROR: Please edit this file first!
    echo.
    echo Open push-to-github.bat in Notepad and change:
    echo   GITHUB_USERNAME=YOUR-USERNAME-HERE
    echo to:
    echo   GITHUB_USERNAME=your-actual-username
    echo.
    pause
    exit /b 1
)

echo GitHub Username: %GITHUB_USERNAME%
echo Repository: intent-to-software-platform
echo.

cd /d "%~dp0"

echo Checking if remote already exists...
git remote | findstr origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Remote 'origin' already exists. Removing...
    git remote remove origin
)

echo Adding remote...
git remote add origin https://github.com/%GITHUB_USERNAME%/intent-to-software-platform.git

echo Renaming branch to main...
git branch -M main

echo.
echo ========================================
echo Ready to Push!
echo ========================================
echo.
echo This will push to:
echo   https://github.com/%GITHUB_USERNAME%/intent-to-software-platform
echo.
echo Make sure you created the repository on GitHub first!
echo Visit: https://github.com/new
echo.
pause

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Success! Repository pushed to GitHub!
    echo ========================================
    echo.
    echo Your repository is now live at:
    echo   https://github.com/%GITHUB_USERNAME%/intent-to-software-platform
    echo.
) else (
    echo.
    echo ========================================
    echo Push failed!
    echo ========================================
    echo.
    echo Common issues:
    echo   1. Repository not created on GitHub yet
    echo   2. Authentication failed
    echo   3. Wrong username
    echo.
    echo Solutions:
    echo   1. Create repo at: https://github.com/new
    echo   2. Use Personal Access Token as password
    echo   3. Check username in this script
    echo.
)

pause
