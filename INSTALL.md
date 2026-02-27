# Installation Guide

## Prerequisites

The Intent-to-Software Platform requires:

1. **Node.js 18+** - JavaScript runtime
2. **Docker Desktop** - Container platform
3. **Git** (optional) - Version control

## Quick Install

### Windows

**Option 1: Automated Installation (Recommended)**

1. Open PowerShell as Administrator (Right-click → "Run as Administrator")
2. Run the installation script:

```powershell
cd intent-to-software-platform
.\install-prerequisites-windows.ps1
```

3. Follow the prompts
4. **Restart your computer** after installation
5. Start Docker Desktop from the Start menu

**Option 2: Manual Installation**

1. **Install Node.js:**
   - Download from: https://nodejs.org/
   - Choose "20 LTS" version
   - Run installer, use default options

2. **Install Docker Desktop:**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Run installer
   - Restart computer
   - Start Docker Desktop

3. **Install Git (optional):**
   - Download from: https://git-scm.com/download/win
   - Run installer

---

### macOS

**Option 1: Automated Installation (Recommended)**

```bash
cd intent-to-software-platform
chmod +x install-prerequisites-linux.sh
./install-prerequisites-linux.sh
```

**Option 2: Manual Installation with Homebrew**

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install Docker Desktop manually from:
# https://www.docker.com/products/docker-desktop/

# Install Git
brew install git
```

---

### Linux (Ubuntu/Debian)

**Option 1: Automated Installation (Recommended)**

```bash
cd intent-to-software-platform
chmod +x install-prerequisites-linux.sh
./install-prerequisites-linux.sh
```

**Option 2: Manual Installation**

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Git
sudo apt-get install -y git

# Log out and back in for docker group to take effect
```

---

## Verification

After installation, verify everything is working:

```bash
# Check Node.js
node --version
# Should show: v20.x.x or higher

# Check npm
npm --version
# Should show: 10.x.x or higher

# Check Docker
docker --version
# Should show: Docker version 20.x.x or higher

# Check Docker Compose
docker compose version
# Should show: Docker Compose version 2.x.x or higher

# Check Git (optional)
git --version
# Should show: git version 2.x.x or higher
```

---

## Post-Installation

### 1. Get an AI API Key

You need an API key from either:

**Anthropic Claude (Recommended):**
- Visit: https://console.anthropic.com
- Sign up/login
- Create API key
- Copy the key (starts with `sk-ant-`)

**OpenAI:**
- Visit: https://platform.openai.com
- Sign up/login
- Create API key
- Copy the key (starts with `sk-`)

### 2. Configure the Platform

```bash
cd intent-to-software-platform

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add your API key to `.env`:

```env
# For Anthropic
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# OR for OpenAI
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Start Docker Desktop

**Windows/macOS:**
- Start Docker Desktop from the Start menu or Applications folder
- Wait for Docker to start (whale icon becomes solid)

**Linux:**
- Docker should start automatically after installation
- Or run: `sudo systemctl start docker`

---

## Launch the Platform

```bash
# Navigate to project directory
cd intent-to-software-platform

# Start all services (first time will take 5-10 minutes to build)
docker compose up --build

# Wait for these messages:
# ✓ Backend server running on port 3000
# ✓ Frontend running on port 5173
# ✓ Database connected
```

**Access the platform:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/api/health

---

## Troubleshooting

### "Docker command not found"

**Solution:**
- Make sure Docker Desktop is installed and running
- On Windows: Restart computer after installing Docker
- On Linux: Log out and back in after installation

### "Port already in use"

**Solution:**
```bash
# Stop the platform
docker compose down

# Edit docker-compose.yml to change ports
# Change "5173:5173" to "5174:5173" for frontend
# Change "3000:3000" to "3001:3000" for backend

# Restart
docker compose up
```

### "Database connection failed"

**Solution:**
```bash
# Reset all containers and volumes
docker compose down -v
docker compose up --build
```

### "Permission denied" (Linux)

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
# Or run:
newgrp docker
```

### Build takes too long

**Solution:**
- First build takes 5-10 minutes (downloads images)
- Subsequent builds are faster (uses cache)
- Make sure you have good internet connection
- Ensure Docker has enough resources (Settings → Resources)

---

## Alternative: Run Without Docker

If you can't use Docker, you can run services individually:

### 1. Install Dependencies

```bash
cd intent-to-software-platform

# Install all packages
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install shared package
cd shared && npm install && npm run build && cd ..
```

### 2. Start PostgreSQL and Redis

**Option A: Use Docker for databases only**
```bash
# Start only databases
docker compose up postgres redis -d
```

**Option B: Install locally**
- Install PostgreSQL: https://www.postgresql.org/download/
- Install Redis: https://redis.io/download/
- Configure connection strings in `.env`

### 3. Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## Next Steps

Once everything is running:

1. Read [QUICKSTART.md](QUICKSTART.md) for a 5-minute tutorial
2. Create your first project
3. Explore the generated code
4. Check [README.md](README.md) for full documentation

---

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
- Open an issue on GitHub
- Review Docker Desktop logs for errors

---

## System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB free space
- Internet: Required for AI API calls

**Recommended:**
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 20 GB free space
- SSD for better performance
