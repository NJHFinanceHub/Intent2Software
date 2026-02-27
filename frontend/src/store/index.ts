import { create } from 'zustand';
import { Project, Conversation, AIConfig, Message } from '@intent-platform/shared';

interface AppState {
  // User
  aiConfig: AIConfig | null;
  setAIConfig: (config: AIConfig) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;

  // Conversations
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;

  // UI State
  isChatLoading: boolean;
  isGenerating: boolean;
  setIsChatLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // User
  aiConfig: null,
  setAIConfig: (config) => set({ aiConfig: config }),

  // Projects
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, ...updates } : p
    ),
    currentProject: state.currentProject?.id === projectId
      ? { ...state.currentProject, ...updates }
      : state.currentProject
  })),

  // Conversations
  currentConversation: null,
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  addMessage: (message) => set((state) => ({
    currentConversation: state.currentConversation
      ? {
          ...state.currentConversation,
          messages: [...state.currentConversation.messages, message]
        }
      : null
  })),

  // UI State
  isChatLoading: false,
  isGenerating: false,
  setIsChatLoading: (loading) => set({ isChatLoading: loading }),
  setIsGenerating: (generating) => set({ isGenerating: generating })
}));
