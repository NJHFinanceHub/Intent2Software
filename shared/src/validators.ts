import { z } from 'zod';
import { AIProvider, ProjectType } from './types';

// Project validation schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(5000),
  aiConfig: z.object({
    provider: z.nativeEnum(AIProvider),
    apiKey: z.string().min(1),
    model: z.string().optional(),
    maxTokens: z.number().optional(),
    temperature: z.number().min(0).max(2).optional()
  }).optional()
});

export const SendMessageSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(5000)
});

export const GenerateProjectSchema = z.object({
  projectId: z.string().uuid(),
  confirmed: z.boolean()
});

export const BuildProjectSchema = z.object({
  projectId: z.string().uuid()
});

export const DownloadProjectSchema = z.object({
  projectId: z.string().uuid(),
  format: z.enum(['zip', 'tar'])
});

// User validation schemas
export const UpdateUserPreferencesSchema = z.object({
  defaultProjectType: z.nativeEnum(ProjectType).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional()
});

export const UpdateAIConfigSchema = z.object({
  provider: z.nativeEnum(AIProvider),
  apiKey: z.string().min(1),
  model: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional()
});
