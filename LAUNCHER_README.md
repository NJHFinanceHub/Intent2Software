# 🚀 Launcher Scripts Guide

This folder contains easy-to-use scripts for managing the Intent-to-Software Platform.

## 📋 Quick Reference

### Main Launchers

| Script | Description | When to Use |
|--------|-------------|-------------|
| **quick-start-guide.bat** | Interactive menu | First time setup |
| **start-platform.bat** | Start with logs visible | Development/debugging |
| **start-platform-background.bat** | Start in background | Normal daily use |
| **stop-platform.bat** | Stop all services | When finished |
| **open-browser.bat** | Open in web browser | After starting |

### Setup Scripts

| Script | Description |
|--------|-------------|
| **install-prerequisites-windows.ps1** | Install Docker, Node.js, Git |
| **create-desktop-shortcut.ps1** | Create desktop shortcuts |

### Utility Scripts

| Script | Description |
|--------|-------------|
| **view-logs.bat** | View live logs |

---

## 🎯 First Time Setup (Step by Step)

### Step 1: Install Prerequisites

**Option A: Interactive Guide (Recommended)**
```
Double-click: quick-start-guide.bat
Choose: 1. Install Prerequisites
```

**Option B: Direct Install**
```
Right-click PowerShell → Run as Administrator
cd C:\Users\nhunsaker\.local\bin\intent-to-software-platform
.\install-prerequisites-windows.ps1
```

**This installs:**
- ✅ Docker Desktop
- ✅ Node.js 20 LTS
- ✅ Git

**After installation:**
- Restart your computer
- Start Docker Desktop from Start menu

---

### Step 2: Configure API Key

**Option A: Using Quick Start Guide**
```
Double-click: quick-start-guide.bat
Choose: 2. Configure API Key
```

**Option B: Manual**
```
Double-click: .env file
Add your API key:
  ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Get API Keys:**
- Anthropic: https://console.anthropic.com
- OpenAI: https://platform.openai.com

---

### Step 3: Create Desktop Shortcuts

**Option A: Using Quick Start Guide**
```
Double-click: quick-start-guide.bat
Choose: 3. Create Desktop Shortcuts
```

**Option B: Direct**
```
Right-click PowerShell → Run as Administrator
.\create-desktop-shortcut.ps1
```

**Creates these shortcuts on your desktop:**
- 🚀 Start Intent Platform
- ⚡ Start Intent Platform (Background)
- ⏹️ Stop Intent Platform
- 🌐 Open Intent Platform
- 📁 Intent Platform Folder

---

## 🏃 Daily Usage

### Starting the Platform

**Method 1: From Desktop (After creating shortcuts)**
```
1. Make sure Docker Desktop is running
2. Double-click: 🚀 Start Intent Platform
3. Wait for services to start (5-10 min first time)
4. Double-click: 🌐 Open Intent Platform
```

**Method 2: From Project Folder**
```
1. Make sure Docker Desktop is running
2. Double-click: start-platform-background.bat
3. Double-click: open-browser.bat
```

**Method 3: Interactive Guide**
```
Double-click: quick-start-guide.bat
Choose: 4. Start the Platform
```

---

### Accessing the Platform

Once started, access at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

---

### Stopping the Platform

**Method 1: Desktop Shortcut**
```
Double-click: ⏹️ Stop Intent Platform
```

**Method 2: Project Folder**
```
Double-click: stop-platform.bat
```

**Method 3: Quick Start Guide**
```
Double-click: quick-start-guide.bat
Choose: 8. Stop the Platform
```

---

## 🔧 Troubleshooting

### "Docker is not running"

**Solution:**
1. Open Docker Desktop from Start menu
2. Wait for whale icon to become solid
3. Run start script again

---

### "Port already in use"

**Solution:**
```
Double-click: stop-platform.bat
Wait 10 seconds
Double-click: start-platform.bat
```

---

### "Services won't start"

**Solution: Reset everything**
```
1. Double-click: stop-platform.bat
2. Open PowerShell in project folder:
   docker compose down -v
3. Double-click: start-platform.bat
```

---

### "Can't access http://localhost:5173"

**Check if services are running:**
```
Double-click: quick-start-guide.bat
Choose: 7. View Running Services
```

**You should see:**
- intent-platform-frontend (running)
- intent-platform-backend (running)
- intent-platform-db (running)
- intent-platform-redis (running)

---

## 📊 Understanding the Scripts

### start-platform.bat
- Checks if Docker is running
- Starts all services with visible logs
- Keeps terminal window open
- Use: When you want to see what's happening

### start-platform-background.bat
- Starts services in the background
- Closes terminal automatically
- Use: Normal daily usage

### stop-platform.bat
- Gracefully stops all services
- Cleans up resources
- Use: When you're done for the day

### view-logs.bat
- Shows real-time logs from all services
- Useful for debugging
- Press Ctrl+C to exit

### quick-start-guide.bat
- Interactive menu for all operations
- Best for beginners
- Guides you through setup and usage

---

## 🎓 Tips & Best Practices

### Tip 1: Use Background Mode
For daily use, prefer `start-platform-background.bat` to keep your desktop clean.

### Tip 2: Create Desktop Shortcuts
Run `create-desktop-shortcut.ps1` once to get easy-access shortcuts.

### Tip 3: Check Docker First
Always make sure Docker Desktop is running before launching the platform.

### Tip 4: Use Quick Start Guide
If unsure, run `quick-start-guide.bat` for an interactive menu.

### Tip 5: View Logs for Debugging
If something's not working, run `view-logs.bat` to see what's happening.

---

## 🚀 Typical Workflow

**First Time:**
```
1. Run: install-prerequisites-windows.ps1 (as Admin)
2. Restart computer
3. Start Docker Desktop
4. Run: create-desktop-shortcut.ps1
5. Configure .env with API key
6. Double-click: 🚀 Start Intent Platform (from desktop)
7. Double-click: 🌐 Open Intent Platform (from desktop)
```

**Daily Use:**
```
1. Start Docker Desktop
2. Double-click: ⚡ Start Intent Platform (Background)
3. Double-click: 🌐 Open Intent Platform
4. Create projects!
5. When done: Double-click ⏹️ Stop Intent Platform
```

---

## 📁 Script Locations

All scripts are in:
```
C:\Users\nhunsaker\.local\bin\intent-to-software-platform\
```

Desktop shortcuts point to these scripts.

---

## ❓ Need Help?

1. Run `quick-start-guide.bat` for interactive help
2. Read `QUICKSTART.md` for platform usage
3. Read `INSTALL.md` for installation issues
4. Read `README.md` for complete documentation

---

**Happy Coding! 🎉**
