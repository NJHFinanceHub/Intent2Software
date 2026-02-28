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

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000
});

// Auto-login: attempt demo login on first request
let loginPromise: Promise<void> | null = null;

async function ensureAuthenticated(): Promise<void> {
  if (!loginPromise) {
    loginPromise = axios.post('/api/auth/demo-login', {}, { withCredentials: true })
      .then(() => { console.log('Demo login successful'); })
      .catch((err) => { console.error('Demo login failed:', err); loginPromise = null; });
  }
  return loginPromise;
}

// Error handling interceptor with auto-retry after demo login
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retried) {
      error.config._retried = true;
      await ensureAuthenticated();
      return client.request(error.config);
    }
    console.error('API Error:', error.response?.data || error.message);
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
