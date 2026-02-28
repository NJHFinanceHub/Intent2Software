import axios from 'axios';
import {
  CreateProjectRequest,
  CreateProjectResponse,
  SendMessageRequest,
  SendMessageResponse,
  GenerateProjectRequest,
  GenerateProjectResponse,
  Project,
  Conversation,
  AIConfig
} from '@intent-platform/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000
});

// Error handling interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      window.location.href = '/';
    }
    throw error;
  }
);

// Projects API
export const projectsApi = {
  create: async (data: CreateProjectRequest): Promise<CreateProjectResponse> => {
    const response = await client.post('/projects', data);
    return response.data;
  },

  getById: async (projectId: string): Promise<Project> => {
    const response = await client.get(`/projects/${projectId}`);
    return response.data;
  },

  list: async (): Promise<Project[]> => {
    const response = await client.get('/projects');
    return response.data;
  },

  generate: async (data: GenerateProjectRequest): Promise<GenerateProjectResponse> => {
    const response = await client.post(`/projects/${data.projectId}/generate`, data);
    return response.data;
  },

  build: async (projectId: string): Promise<void> => {
    await client.post(`/projects/${projectId}/build`, { projectId });
  },

  download: async (projectId: string, format: 'zip' | 'tar' = 'zip'): Promise<Blob> => {
    const response = await client.get(`/projects/${projectId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await client.delete(`/projects/${projectId}`);
  }
};

// Conversations API
export const conversationsApi = {
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await client.post('/conversations/message', data);
    return response.data;
  },

  getByProjectId: async (projectId: string): Promise<Conversation> => {
    const response = await client.get(`/conversations/${projectId}`);
    return response.data;
  }
};

// Users API
export const usersApi = {
  getMe: async (): Promise<any> => {
    const response = await client.get('/users/me');
    return response.data;
  },

  updateAIConfig: async (config: AIConfig): Promise<void> => {
    await client.put('/users/me/ai-config', config);
  },

  updatePreferences: async (preferences: any): Promise<void> => {
    await client.put('/users/me/preferences', preferences);
  }
};

// Health check
export const healthApi = {
  check: async (): Promise<any> => {
    const response = await client.get('/health');
    return response.data;
  }
};

export default client;
