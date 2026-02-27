# Quick Start Guide

Get the Intent-to-Software Platform running in 5 minutes.

## Step 1: Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check Docker
docker --version

# Check Docker Compose
docker-compose --version
```

If any are missing, install them first.

## Step 2: Get an API Key

You need either an **Anthropic** or **OpenAI** API key (or use mock for testing).

### Anthropic (Recommended)
1. Go to https://console.anthropic.com
2. Sign up/login
3. Create API key
4. Copy the key (starts with `sk-ant-`)

### OpenAI (Alternative)
1. Go to https://platform.openai.com
2. Sign up/login
3. Create API key
4. Copy the key (starts with `sk-`)

## Step 3: Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd intent-to-software-platform

# Create environment file
cp .env.example .env

# Edit .env and add your API key
nano .env  # or use your preferred editor
```

Add this line to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Step 4: Start the Platform

```bash
# Build and start all services (takes 2-3 minutes first time)
docker-compose up --build

# Wait for these messages:
# ✓ Backend server running on port 3000
# ✓ Frontend running on port 5173
# ✓ Database connected
```

## Step 5: Create Your First Project

1. **Open browser**: http://localhost:5173

2. **Configure API key** (if not in .env):
   - Click "Settings" in header
   - Select "Anthropic Claude"
   - Paste your API key
   - Click "Save Settings"

3. **Create a project**:
   - Click "New Project"
   - Name: "My First App"
   - Description: "A simple to-do list web application with user authentication"
   - Click "Create Project"

4. **Have a conversation**:
   - The AI will ask clarifying questions
   - Answer them naturally
   - Example answers:
     - "I want React for the frontend"
     - "Yes, I need user authentication"
     - "Use a PostgreSQL database"
     - "Modern, clean design"

5. **Generate code**:
   - When AI says it's ready, click "Generate Code"
   - Watch as files are created in real-time
   - Preview the generated code

6. **Download**:
   - Click "Download" button
   - Extract the ZIP file
   - You now have a complete working project!

## Next Steps

- Try building the project: Click "Build & Test"
- Create another project with different requirements
- Explore the generated code structure
- Read the full [README.md](./README.md) for advanced features

## Troubleshooting

**Port already in use?**
```bash
# Stop the platform
docker-compose down

# Change ports in docker-compose.yml
# Then restart
docker-compose up
```

**Database connection error?**
```bash
# Reset everything
docker-compose down -v
docker-compose up --build
```

**API key not working?**
- Check it's correctly copied (no extra spaces)
- Verify it's active in your AI provider console
- Try the mock provider for testing without an API key

## Getting Help

- Read the [full documentation](./README.md)
- Check [GitHub Issues](https://github.com/yourusername/intent-to-software-platform/issues)
- Join our community discussions

Happy building! 🚀
