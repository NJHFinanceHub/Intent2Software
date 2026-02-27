# Intent-to-Software Platform - Windows Prerequisites Installer
# This script installs all required software for running the platform

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Intent-to-Software Platform" -ForegroundColor Cyan
Write-Host "Prerequisites Installer for Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check if a command exists
function Test-Command {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to download and install
function Install-Software {
    param($name, $url, $filename)

    Write-Host "Installing $name..." -ForegroundColor Yellow
    $downloadPath = "$env:TEMP\$filename"

    try {
        Invoke-WebRequest -Uri $url -OutFile $downloadPath -UseBasicParsing
        Start-Process -FilePath $downloadPath -Wait
        Remove-Item $downloadPath -Force
        Write-Host "✓ $name installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install $name" -ForegroundColor Red
        Write-Host "  Please download manually from: $url" -ForegroundColor Yellow
    }
}

Write-Host "Checking prerequisites..." -ForegroundColor Cyan
Write-Host ""

# 1. Check for Chocolatey (package manager for Windows)
Write-Host "1. Checking Chocolatey..." -ForegroundColor Cyan
if (-not (Test-Command choco)) {
    Write-Host "  Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "  ✓ Chocolatey installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Chocolatey already installed" -ForegroundColor Green
}

# 2. Check for Node.js
Write-Host ""
Write-Host "2. Checking Node.js..." -ForegroundColor Cyan
if (-not (Test-Command node)) {
    Write-Host "  Installing Node.js 20 LTS..." -ForegroundColor Yellow
    choco install nodejs-lts -y
    Write-Host "  ✓ Node.js installed" -ForegroundColor Green
} else {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js already installed: $nodeVersion" -ForegroundColor Green
}

# 3. Check for Docker Desktop
Write-Host ""
Write-Host "3. Checking Docker Desktop..." -ForegroundColor Cyan
if (-not (Test-Command docker)) {
    Write-Host "  Docker Desktop not found" -ForegroundColor Yellow
    Write-Host "  Downloading Docker Desktop..." -ForegroundColor Yellow

    # Download Docker Desktop installer
    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"

    try {
        Write-Host "  Downloading from Docker..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller -UseBasicParsing

        Write-Host "  Installing Docker Desktop..." -ForegroundColor Yellow
        Write-Host "  (This will take a few minutes and may require a restart)" -ForegroundColor Yellow
        Start-Process -FilePath $dockerInstaller -ArgumentList "install" -Wait

        Remove-Item $dockerInstaller -Force

        Write-Host "  ✓ Docker Desktop installed" -ForegroundColor Green
        Write-Host "  ⚠ IMPORTANT: You may need to restart your computer" -ForegroundColor Yellow
        Write-Host "  ⚠ After restart, start Docker Desktop from the Start menu" -ForegroundColor Yellow
    } catch {
        Write-Host "  ✗ Failed to install Docker Desktop automatically" -ForegroundColor Red
        Write-Host "  Please install manually:" -ForegroundColor Yellow
        Write-Host "  1. Visit: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        Write-Host "  2. Download Docker Desktop for Windows" -ForegroundColor Yellow
        Write-Host "  3. Run the installer" -ForegroundColor Yellow
        Write-Host "  4. Restart your computer" -ForegroundColor Yellow
    }
} else {
    $dockerVersion = docker --version
    Write-Host "  ✓ Docker already installed: $dockerVersion" -ForegroundColor Green
}

# 4. Check for Git (optional but recommended)
Write-Host ""
Write-Host "4. Checking Git..." -ForegroundColor Cyan
if (-not (Test-Command git)) {
    Write-Host "  Installing Git..." -ForegroundColor Yellow
    choco install git -y
    Write-Host "  ✓ Git installed" -ForegroundColor Green
} else {
    $gitVersion = git --version
    Write-Host "  ✓ Git already installed: $gitVersion" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allInstalled = $true

# Check each component
Write-Host "Component Status:" -ForegroundColor Cyan
if (Test-Command node) {
    Write-Host "  ✓ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Node.js: Not installed" -ForegroundColor Red
    $allInstalled = $false
}

if (Test-Command docker) {
    Write-Host "  ✓ Docker: $(docker --version)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Docker: Not installed" -ForegroundColor Red
    Write-Host "    Action required: Install Docker Desktop and restart" -ForegroundColor Yellow
    $allInstalled = $false
}

if (Test-Command git) {
    Write-Host "  ✓ Git: $(git --version)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Git: Not installed (optional)" -ForegroundColor Yellow
}

Write-Host ""
if ($allInstalled) {
    Write-Host "✓ All prerequisites installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open Docker Desktop and wait for it to start" -ForegroundColor White
    Write-Host "2. Navigate to the platform directory:" -ForegroundColor White
    Write-Host "   cd intent-to-software-platform" -ForegroundColor Gray
    Write-Host "3. Start the platform:" -ForegroundColor White
    Write-Host "   docker compose up --build" -ForegroundColor Gray
} else {
    Write-Host "⚠ Some prerequisites need attention" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If Docker was just installed:" -ForegroundColor Cyan
    Write-Host "1. Restart your computer" -ForegroundColor White
    Write-Host "2. Start Docker Desktop" -ForegroundColor White
    Write-Host "3. Run this script again to verify" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
