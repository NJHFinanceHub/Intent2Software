import { z } from 'zod';

// ============================================================================
// AI Provider Types
// ============================================================================

export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  MOCK = 'mock'
}

export const AIConfigSchema = z.object({
  provider: z.nativeEnum(AIProvider),
  apiKey: z.string().min(1),
  model: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional()
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

// ============================================================================
// Project Types
// ============================================================================

export enum ProjectType {
  WEB_APP_REACT = 'web-app-react',
  WEB_APP_VUE = 'web-app-vue',
  REST_API_NODE = 'rest-api-node',
  REST_API_PYTHON = 'rest-api-python',
  STATIC_WEBSITE = 'static-website',
  CLI_TOOL = 'cli-tool'
}

export enum ProjectStatus {
  INITIALIZING = 'initializing',
  GATHERING_REQUIREMENTS = 'gathering_requirements',
  PLANNING = 'planning',
  GENERATING = 'generating',
  BUILDING = 'building',
  TESTING = 'testing',
  READY = 'ready',
  FAILED = 'failed'
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  requirements: string[];
  architecture: ProjectArchitecture | null;
  files: GeneratedFile[];
  buildOutput: BuildOutput | null;
  testResults: TestResults | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectArchitecture {
  overview: string;
  components: Component[];
  dependencies: Record<string, string>;
  fileStructure: FileNode;
  techStack: TechStack;
}

export interface Component {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'utility';
  description: string;
  files: string[];
  dependencies: string[];
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  testing?: string[];
  deployment?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  purpose: string;
}

export interface BuildOutput {
  success: boolean;
  logs: string[];
  errors: string[];
  warnings: string[];
  artifacts: string[];
  timestamp: Date;
}

export interface TestResults {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testSuites: TestSuite[];
  coverage?: Coverage;
  timestamp: Date;
}

export interface TestSuite {
  name: string;
  tests: Test[];
  duration: number;
}

export interface Test {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface Coverage {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

// ============================================================================
// Conversation Types
// ============================================================================

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  projectId: string;
  messages: Message[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContext {
  stage: 'initial' | 'clarifying' | 'planning' | 'implementing' | 'completed';
  extractedRequirements: string[];
  clarificationNeeded: string[];
  userPreferences: Record<string, any>;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  aiConfig: AIConfig | null;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  defaultProjectType?: ProjectType;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  description: string;
  aiConfig?: AIConfig;
}

export interface CreateProjectResponse {
  project: Project;
  conversation: Conversation;
}

export interface SendMessageRequest {
  projectId: string;
  message: string;
}

export interface SendMessageResponse {
  message: Message;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  readyToGenerate?: boolean;
}

export interface GenerateProjectRequest {
  projectId: string;
  confirmed: boolean;
}

export interface GenerateProjectResponse {
  project: Project;
  status: ProjectStatus;
}

export interface BuildProjectRequest {
  projectId: string;
}

export interface BuildProjectResponse {
  buildOutput: BuildOutput;
  testResults: TestResults;
}

export interface DownloadProjectRequest {
  projectId: string;
  format: 'zip' | 'tar';
}

// ============================================================================
// WebSocket Events
// ============================================================================

export enum WebSocketEvent {
  PROJECT_STATUS_CHANGED = 'project:status:changed',
  FILE_GENERATED = 'project:file:generated',
  BUILD_STARTED = 'project:build:started',
  BUILD_PROGRESS = 'project:build:progress',
  BUILD_COMPLETED = 'project:build:completed',
  TEST_STARTED = 'project:test:started',
  TEST_COMPLETED = 'project:test:completed',
  ERROR = 'error'
}

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: any;
  timestamp: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export class PlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  BUILD_ERROR = 'BUILD_ERROR',
  SANDBOX_ERROR = 'SANDBOX_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
