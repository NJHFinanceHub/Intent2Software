# Intent-to-Software Platform - Desktop Shortcut Creator
# Creates a desktop shortcut for easy access

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Desktop Shortcuts" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectDir = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell

# Function to create shortcut
function Create-Shortcut {
    param(
        [string]$Name,
        [string]$Target,
        [string]$Description,
        [string]$IconPath = ""
    )

    $shortcutPath = Join-Path $desktopPath "$Name.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $Target
    $shortcut.WorkingDirectory = $projectDir
    $shortcut.Description = $Description

    if ($IconPath -ne "") {
        $shortcut.IconLocation = $IconPath
    }

    $shortcut.Save()
    Write-Host "✓ Created: $Name" -ForegroundColor Green
}

# Create shortcuts
Write-Host "Creating shortcuts on your desktop..." -ForegroundColor Yellow
Write-Host ""

# Main launch shortcut
Create-Shortcut `
    -Name "🚀 Start Intent Platform" `
    -Target (Join-Path $projectDir "start-platform.bat") `
    -Description "Start the Intent-to-Software Platform"

# Background launch shortcut
Create-Shortcut `
    -Name "⚡ Start Intent Platform (Background)" `
    -Target (Join-Path $projectDir "start-platform-background.bat") `
    -Description "Start the platform in background mode"

# Stop shortcut
Create-Shortcut `
    -Name "⏹️ Stop Intent Platform" `
    -Target (Join-Path $projectDir "stop-platform.bat") `
    -Description "Stop the Intent-to-Software Platform"

# Open browser shortcut
Create-Shortcut `
    -Name "🌐 Open Intent Platform" `
    -Target (Join-Path $projectDir "open-browser.bat") `
    -Description "Open the Intent-to-Software Platform in browser"

# Project folder shortcut
Create-Shortcut `
    -Name "📁 Intent Platform Folder" `
    -Target $projectDir `
    -Description "Open the Intent-to-Software Platform folder"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Shortcuts Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check your desktop for these shortcuts:" -ForegroundColor Cyan
Write-Host "  🚀 Start Intent Platform" -ForegroundColor White
Write-Host "  ⚡ Start Intent Platform (Background)" -ForegroundColor White
Write-Host "  ⏹️ Stop Intent Platform" -ForegroundColor White
Write-Host "  🌐 Open Intent Platform" -ForegroundColor White
Write-Host "  📁 Intent Platform Folder" -ForegroundColor White
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  1. Make sure Docker Desktop is running" -ForegroundColor White
Write-Host "  2. Double-click '🚀 Start Intent Platform'" -ForegroundColor White
Write-Host "  3. Wait for services to start" -ForegroundColor White
Write-Host "  4. Click '🌐 Open Intent Platform' to open in browser" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
