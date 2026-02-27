# Architecture Documentation

## Overview

The Intent-to-Software Platform is a full-stack application that transforms natural language descriptions into working software projects. This document provides an in-depth look at the system architecture, design decisions, and implementation details.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                   (React + TypeScript)                       │
│                                                               │
│  • Chat Interface    • Project Tree    • Code Preview        │
│  • State Management (Zustand)                                │
│  • Real-time Updates (WebSocket)                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
                    REST API + WebSocket
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                   (Node.js + TypeScript)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Layer (Express)                                   │   │
│  │  • Routes  • Middleware  • Validation                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Service Layer                                         │   │
│  │  • ProjectService     • ConversationService          │   │
│  │  • AIProviderService  • CodeGeneratorService         │   │
│  │  • UserService        • WebSocketService             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AI Integration Layer                                  │   │
│  │  • Anthropic SDK  • OpenAI SDK  • Mock Provider      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │ PostgreSQL  │  │   Redis     │  │  File Storage      │  │
│  │             │  │             │  │                    │  │
│  │ • Projects  │  │ • Sessions  │  │ • Generated Files  │  │
│  │ • Users     │  │ • Cache     │  │ • Project Archives │  │
│  │ • Convs     │  │             │  │                    │  │
│  └─────────────┘  └─────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (Presentation Layer)

#### Technology Choices
- **React 18**: Modern UI framework with concurrent features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Axios**: HTTP client with interceptors
- **Lucide React**: Icon library

#### Key Components

**1. ChatPanel**
- Manages conversation with AI
- Displays message history
- Handles user input
- Shows loading states

**2. ProjectTree**
- Displays generated file structure
- Tree view with expand/collapse
- File selection handling
- Visual indicators for file types

**3. PreviewPanel**
- Displays file contents
- Syntax highlighting
- Copy to clipboard
- File metadata display

**4. Pages**
- HomePage: Project listing and creation
- ProjectPage: Main workspace
- SettingsPage: Configuration

### Backend (Application Layer)

#### Technology Choices
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe backend code
- **Express.js**: Web framework
- **PostgreSQL**: Relational database
- **Redis**: Caching and sessions
- **WebSocket (ws)**: Real-time communication

#### Service Architecture

**1. ProjectService**
- CRUD operations for projects
- Project status management
- File management
- Archive creation (ZIP/TAR)

**2. ConversationService**
- Conversation lifecycle management
- Message history
- Context tracking
- Requirement extraction

**3. AIProviderService**
- Multi-provider support (Anthropic/OpenAI/Mock)
- Message formatting
- Response parsing
- Requirement extraction

**4. CodeGeneratorService**
- Architecture planning
- File generation
- Template-based scaffolding
- Build orchestration

**5. UserService**
- User management
- Preferences
- AI configuration

**6. WebSocketService**
- Real-time event broadcasting
- Connection management
- Reconnection handling

### Data Layer

#### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  ai_config JSONB,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  requirements TEXT[],
  architecture JSONB,
  files JSONB,
  build_output JSONB,
  test_results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  messages JSONB,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Redis Usage
- Session storage
- Rate limiting counters
- Temporary caching
- WebSocket connection tracking

## Code Generation Pipeline

### Phase 1: Requirement Gathering

```
User Input → AI Processing → Clarification Questions → User Answers
                                      ↓
                            Extract Requirements
                                      ↓
                          Build Requirement Context
```

### Phase 2: Architecture Planning

```
Requirements → AI Analysis → Tech Stack Selection
                                    ↓
                          Component Design
                                    ↓
                          File Structure Planning
                                    ↓
                          Dependency Resolution
```

### Phase 3: Code Generation

```
Architecture → Template Selection → File Generation
                                           ↓
                                  Content Population
                                           ↓
                                  Validation
                                           ↓
                                  Storage
```

### Phase 4: Build & Test

```
Generated Files → Install Dependencies → Build
                                           ↓
                                    Run Tests
                                           ↓
                                    Collect Results
                                           ↓
                                    Update Status
```

## AI Integration

### Provider Abstraction

The `AIProviderService` provides a unified interface for multiple AI providers:

```typescript
interface AIProvider {
  processConversation(
    conversation: Conversation,
    config?: AIConfig
  ): Promise<AIResponse>;
}
```

### Prompt Engineering

System prompts guide the AI through different stages:

1. **Initial Stage**: Understand user intent
2. **Clarification Stage**: Ask targeted questions
3. **Planning Stage**: Design architecture
4. **Ready Stage**: Confirm before generation

## Security Considerations

### Input Validation
- Zod schemas for all API inputs
- Sanitization of user content
- File path validation
- Size limits on uploads

### Authentication & Authorization
- Session-based authentication (ready for JWT upgrade)
- API key encryption
- User isolation
- Rate limiting

### Sandbox Security
- Docker container isolation
- Resource limits (CPU, memory, disk)
- Network isolation
- Timeout enforcement

## Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Memoization (React.memo, useMemo)
- Virtual scrolling for large file lists

### Backend
- Connection pooling (PostgreSQL)
- Redis caching
- Async operations
- Streaming responses

### Database
- Indexed queries
- Query optimization
- Connection pooling
- JSONB for flexible data

## Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Session storage in Redis
- Load balancer ready
- Database replication support

### Cloud Migration Path
1. Replace file storage with S3/GCS
2. Use managed databases
3. Add load balancers
4. Implement CDN for frontend
5. Use container orchestration (K8s)

## Monitoring & Logging

### Logging Strategy
- Winston for structured logging
- Different log levels (error, warn, info, debug)
- Separate log files
- JSON format for parsing

### Metrics to Track
- Request latency
- AI API call duration
- Code generation time
- Build success rate
- User engagement

## Future Enhancements

### Planned Features
1. **Advanced Sandbox**: Live preview with hot reload
2. **Version Control**: Git integration
3. **Collaboration**: Multi-user editing
4. **Templates**: Pre-built project templates
5. **Plugins**: Custom generator plugins
6. **CI/CD**: Automated deployment pipelines

### Technical Debt
- Add comprehensive test coverage
- Implement proper authentication
- Add database migrations system
- Improve error handling
- Add API documentation (OpenAPI/Swagger)

## Design Decisions

### Why Node.js?
- JavaScript/TypeScript across full stack
- Excellent async I/O for AI API calls
- Rich ecosystem
- Good Docker support

### Why PostgreSQL?
- JSONB for flexible schema
- Strong ACID guarantees
- Excellent TypeScript support
- Proven scalability

### Why Zustand over Redux?
- Simpler API
- Less boilerplate
- Good TypeScript support
- Sufficient for app complexity

### Why Docker Compose?
- Easy local development
- Consistent environments
- Simple deployment
- Service orchestration

## Conclusion

This architecture provides a solid foundation for a code generation platform that can scale from local development to production deployment. The modular design allows for easy extension and maintenance while maintaining separation of concerns.
