# Intent-to-Software Platform

A complete full-stack platform that generates working software projects from natural language descriptions. Users describe what they want to build in plain English, the AI clarifies requirements through conversation, and the system generates a complete, tested, downloadable software project.

## 🚀 Features

- **Natural Language Interface**: Describe your software project in plain English
- **Interactive Clarification**: AI asks follow-up questions to refine requirements
- **Multi-Provider AI Support**: Choose between Anthropic Claude, OpenAI GPT-4, or mock provider
- **Complete Code Generation**: Generates full project structure with all necessary files
- **Real-time Updates**: WebSocket-based live updates during generation
- **Project Preview**: Browse generated files with syntax highlighting
- **Build & Test**: Automated building and testing of generated projects
- **Download & Deploy**: Export projects as ZIP archives ready for deployment
- **Docker Support**: Fully containerized with Docker Compose

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Chat Panel   │  │ Project Tree │  │ Preview Panel   │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                Backend (Node.js + TypeScript)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Conversation Manager (Intent Clarification)       │   │
│  │  • AI Provider Service (Anthropic/OpenAI)            │   │
│  │  • Code Generator (Project Scaffolding)              │   │
│  │  • Build & Test Runner                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Storage & Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ PostgreSQL   │  │ Redis        │  │ File Storage    │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- Axios for API calls
- WebSocket for real-time updates

**Backend:**
- Node.js with TypeScript
- Express.js web framework
- PostgreSQL database
- Redis for sessions and caching
- WebSocket (ws) for real-time communication
- Anthropic SDK and OpenAI SDK for AI integration

**Infrastructure:**
- Docker & Docker Compose
- Nginx (for production)
- Volume-based file storage

## 📦 Prerequisites

- **Node.js**: Version 18 or higher
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **AI API Key**: Either Anthropic or OpenAI API key (or use mock for testing)

### Getting API Keys

**Anthropic Claude:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

**OpenAI:**
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/intent-to-software-platform.git
cd intent-to-software-platform
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# AI Provider (optional - can be configured in UI)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-api-key-here
# or
# AI_PROVIDER=openai
# OPENAI_API_KEY=your-api-key-here

# Database
DATABASE_URL=postgresql://platform_user:platform_password@postgres:5432/intent_platform

# Redis
REDIS_URL=redis://redis:6379

# Session
SESSION_SECRET=your-secret-key-change-in-production
```

### 3. Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## ⚙️ Configuration

### User Configuration (via UI)

1. Navigate to **Settings** in the web interface
2. Select your preferred AI provider (Anthropic or OpenAI)
3. Enter your API key
4. Optionally configure:
   - Model name (defaults to latest)
   - Temperature (0-2, default 0.7)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | See `.env.example` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `SESSION_SECRET` | Session encryption secret | Required |
| `AI_PROVIDER` | Default AI provider | `anthropic` |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `MAX_PROJECT_SIZE` | Max project size | `100M` |
| `SANDBOX_TIMEOUT` | Build timeout in ms | `300000` |

## 📚 Usage Guide

### Creating Your First Project

1. **Click "New Project"** on the home page

2. **Enter Project Details:**
   - Name: e.g., "Task Manager App"
   - Description: e.g., "A web application for managing daily tasks with user authentication"

3. **Conversation Phase:**
   - The AI will ask clarifying questions
   - Answer questions about:
     - Technology preferences
     - Features needed
     - Scale requirements
     - Authentication needs
     - Database requirements

4. **Generation Phase:**
   - Click "Generate Code" when ready
   - Watch real-time progress as files are generated
   - Review generated code in the preview panel

5. **Build & Test:**
   - Click "Build & Test" to verify the project
   - View build logs and test results

6. **Download:**
   - Click "Download" to get a ZIP file
   - Extract and use the project

### Example Conversations

**Simple Web App:**
```
User: "Create a simple to-do list app"
AI: "I'd be happy to help! A few questions:
     1. Do you need user accounts and authentication?
     2. Should tasks persist (database) or just in memory?
     3. Any specific styling preferences?"
User: "Yes to authentication, use a database, and modern clean design"
AI: "Perfect! I'll create a React app with:
     - User authentication (JWT)
     - PostgreSQL database
     - Modern UI with Tailwind CSS
     Ready to generate?"
```

**API Service:**
```
User: "I need a REST API for a blog"
AI: "Great! Questions:
     1. What operations do you need? (CRUD for posts/comments?)
     2. Authentication required?
     3. Preferred language (Node.js/Python)?"
User: "CRUD for posts and comments, JWT auth, Node.js"
AI: "Excellent! Generating:
     - Express.js REST API
     - PostgreSQL with posts/comments tables
     - JWT authentication
     - Comprehensive tests"
```

## 🔌 API Documentation

### REST Endpoints

#### Projects

```
POST   /api/projects              Create new project
GET    /api/projects              List all projects
GET    /api/projects/:id          Get project by ID
POST   /api/projects/:id/generate Generate project code
POST   /api/projects/:id/build    Build and test project
GET    /api/projects/:id/download Download project archive
DELETE /api/projects/:id          Delete project
```

#### Conversations

```
POST   /api/conversations/message Send message in conversation
GET    /api/conversations/:projectId Get conversation
```

#### Users

```
GET    /api/users/me               Get current user
PUT    /api/users/me/ai-config     Update AI configuration
PUT    /api/users/me/preferences   Update preferences
```

### WebSocket Events

Connect to: `ws://localhost:3000/ws/:projectId`

**Server Events:**
```javascript
project:status:changed    // Project status updated
project:file:generated    // New file generated
project:build:started     // Build process started
project:build:progress    // Build progress update
project:build:completed   // Build completed
project:test:started      // Tests started
project:test:completed    // Tests completed
error                     // Error occurred
```

## 💻 Development

### Local Development (without Docker)

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Shared Package

```bash
cd shared
npm install
npm run build
npm run watch  # For development
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Project Structure

```
intent-to-software-platform/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── api/          # API client & WebSocket
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # State management
│   │   └── App.tsx       # Main app component
│   └── package.json
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── database/     # Database layer
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   ├── websocket/    # WebSocket handler
│   │   └── index.ts      # Main server file
│   └── package.json
├── shared/                # Shared types and utilities
│   ├── src/
│   │   ├── types.ts      # TypeScript interfaces
│   │   ├── validators.ts # Zod schemas
│   │   └── utils.ts      # Shared utilities
│   └── package.json
├── sandbox/               # Sandbox execution (future)
├── docs/                  # Additional documentation
├── examples/              # Example projects
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## 🚀 Deployment

### Cloud Deployment (AWS/GCP/Azure)

The platform is designed for easy cloud migration. Key steps:

1. **Container Registry:**
   ```bash
   # Build and push images
   docker-compose build
   docker tag intent-platform-backend:latest your-registry/backend:latest
   docker push your-registry/backend:latest
   ```

2. **Database:**
   - Use managed PostgreSQL (AWS RDS, Google Cloud SQL, Azure Database)
   - Update `DATABASE_URL` to point to managed instance

3. **Redis:**
   - Use managed Redis (ElastiCache, Cloud Memorystore, Azure Cache)
   - Update `REDIS_URL`

4. **Storage:**
   - Replace local storage with cloud object storage (S3, GCS, Azure Blob)
   - Update storage configuration

5. **Load Balancer:**
   - Set up load balancer for frontend and backend
   - Configure SSL/TLS certificates

### Kubernetes Deployment

Example Kubernetes manifests are provided in `deploy/kubernetes/` (to be added).

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**API Key Issues:**
```
Error: Anthropic API key not configured
```
Solution: Configure API key in Settings page or set environment variable.

**WebSocket Connection Failed:**
```
Check if backend is running and accessible
Verify CORS configuration
Check browser console for errors
```

**Build Failures:**
```bash
# Clean and rebuild
docker-compose down -v
docker-compose up --build
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f backend

# Backend application logs
docker-compose exec backend cat logs/combined.log
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Keep commits atomic and well-described

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Anthropic Claude](https://www.anthropic.com/) and [OpenAI](https://openai.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For issues and questions:
- Open an issue on [GitHub Issues](https://github.com/yourusername/intent-to-software-platform/issues)
- Check [Discussions](https://github.com/yourusername/intent-to-software-platform/discussions)

## 🗺️ Roadmap

- [ ] Support for more project types (Python, Go, Rust)
- [ ] Advanced sandbox with live preview
- [ ] Template library for common patterns
- [ ] Multi-user collaboration
- [ ] Version control integration (Git)
- [ ] CI/CD pipeline generation
- [ ] Cloud deployment automation
- [ ] Plugin system for custom generators

---

**Made with ❤️ for developers who dream in natural language**
