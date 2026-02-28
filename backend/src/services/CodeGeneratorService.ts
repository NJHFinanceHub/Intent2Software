import { ProjectService } from './ProjectService';
import { ConversationService } from './ConversationService';
import { AIProviderService } from './AIProviderService';
import { WebSocketService } from './WebSocketService';
import {
  Project,
  ProjectArchitecture,
  GeneratedFile,
  ProjectStatus,
  BuildOutput,
  TestResults,
  WebSocketEvent
} from '@intent-platform/shared';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const STORAGE_PATH = process.env.PROJECT_STORAGE || './storage';

export class CodeGeneratorService {
  private projectService: ProjectService;
  private conversationService: ConversationService;
  private aiProviderService: AIProviderService;
  private wsService: WebSocketService;

  constructor() {
    this.projectService = new ProjectService();
    this.conversationService = new ConversationService();
    this.aiProviderService = new AIProviderService();
    this.wsService = new WebSocketService();
  }

  async generateProject(projectId: string): Promise<void> {
    try {
      logger.info(`Starting code generation for project ${projectId}`);

      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const conversation = await this.conversationService.getConversation(projectId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Extract requirements from the conversation
      const requirements = this.extractRequirements(project, conversation);

      // Step 1: Generate architecture
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.PLANNING);
      this.wsService.broadcast(projectId, WebSocketEvent.PROJECT_STATUS_CHANGED, { status: ProjectStatus.PLANNING });

      const architecture = this.generateArchitecture(project, requirements);
      await this.projectService.updateProjectArchitecture(projectId, architecture);

      logger.info(`Architecture generated for project ${projectId}`);

      // Step 2: Generate files
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.GENERATING);
      this.wsService.broadcast(projectId, WebSocketEvent.PROJECT_STATUS_CHANGED, { status: ProjectStatus.GENERATING });

      const files = this.generateFiles(project, architecture, requirements);
      await this.projectService.updateProjectFiles(projectId, files);

      logger.info(`Generated ${files.length} files for project ${projectId}`);

      // Emit file generation events
      files.forEach(file => {
        this.wsService.broadcast(projectId, WebSocketEvent.FILE_GENERATED, { file });
      });

      // Step 3: Write files to disk
      await this.writeProjectFiles(projectId, files);

      // Mark as ready
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.READY);
      this.wsService.broadcast(projectId, WebSocketEvent.PROJECT_STATUS_CHANGED, { status: ProjectStatus.READY });

      logger.info(`Project ${projectId} generation completed successfully`);
    } catch (error) {
      logger.error(`Code generation failed for project ${projectId}:`, error);
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.FAILED);
      this.wsService.broadcast(projectId, WebSocketEvent.PROJECT_STATUS_CHANGED, {
        status: ProjectStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async buildProject(projectId: string): Promise<void> {
    try {
      logger.info(`Starting build for project ${projectId}`);

      await this.projectService.updateProjectStatus(projectId, ProjectStatus.BUILDING);
      this.wsService.broadcast(projectId, WebSocketEvent.BUILD_STARTED, {});

      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const projectPath = join(STORAGE_PATH, projectId);

      // Install dependencies
      this.wsService.broadcast(projectId, WebSocketEvent.BUILD_PROGRESS, {
        step: 'Installing dependencies'
      });
      await execAsync('npm install --ignore-scripts', { cwd: projectPath, timeout: 300000 });

      // Run build
      this.wsService.broadcast(projectId, WebSocketEvent.BUILD_PROGRESS, {
        step: 'Building project'
      });
      const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath, timeout: 300000 });

      const buildOutput: BuildOutput = {
        success: true,
        logs: stdout.split('\n'),
        errors: stderr ? stderr.split('\n') : [],
        warnings: [],
        artifacts: ['dist'],
        timestamp: new Date()
      };

      this.wsService.broadcast(projectId, WebSocketEvent.BUILD_COMPLETED, { buildOutput });

      // Back to ready after build
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.READY);
      this.wsService.broadcast(projectId, WebSocketEvent.PROJECT_STATUS_CHANGED, { status: ProjectStatus.READY });

      logger.info(`Build completed for project ${projectId}`);
    } catch (error) {
      logger.error(`Build failed for project ${projectId}:`, error);
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.FAILED);
      this.wsService.broadcast(projectId, WebSocketEvent.PROJECT_STATUS_CHANGED, { status: ProjectStatus.FAILED });
      throw error;
    }
  }

  private extractRequirements(project: Project, conversation: any): ProjectRequirements {
    const allText = [
      project.description,
      ...(conversation.messages || []).map((m: any) => m.content)
    ].join('\n').toLowerCase();

    const features: string[] = [];
    const techPrefs: string[] = [];

    // Extract features from conversation
    if (allText.includes('auth') || allText.includes('login') || allText.includes('signup')) {
      features.push('authentication');
    }
    if (allText.includes('drag') && allText.includes('drop')) {
      features.push('drag-and-drop');
    }
    if (allText.includes('dark mode') || allText.includes('theme')) {
      features.push('dark-mode');
    }
    if (allText.includes('dashboard')) {
      features.push('dashboard');
    }
    if (allText.includes('chart') || allText.includes('graph') || allText.includes('analytics')) {
      features.push('charts');
    }
    if (allText.includes('form') || allText.includes('input') || allText.includes('submit')) {
      features.push('forms');
    }
    if (allText.includes('list') || allText.includes('table') || allText.includes('grid')) {
      features.push('data-display');
    }
    if (allText.includes('search') || allText.includes('filter')) {
      features.push('search-filter');
    }
    if (allText.includes('notification') || allText.includes('alert') || allText.includes('toast')) {
      features.push('notifications');
    }
    if (allText.includes('api') || allText.includes('backend') || allText.includes('server') || allText.includes('database')) {
      features.push('api-backend');
    }
    if (allText.includes('crud') || allText.includes('create') || allText.includes('delete') || allText.includes('edit')) {
      features.push('crud');
    }
    if (allText.includes('responsive') || allText.includes('mobile')) {
      features.push('responsive');
    }

    // Extract tech preferences
    if (allText.includes('tailwind')) techPrefs.push('tailwindcss');
    if (allText.includes('typescript') || allText.includes('ts')) techPrefs.push('typescript');
    if (allText.includes('next') || allText.includes('nextjs')) techPrefs.push('nextjs');

    // If no specific features detected, infer from the project description
    if (features.length === 0) {
      features.push('crud', 'data-display', 'forms');
    }

    return {
      projectName: project.name,
      description: project.description,
      features,
      techPrefs,
      allText
    };
  }

  private generateArchitecture(project: Project, reqs: ProjectRequirements): ProjectArchitecture {
    const components: any[] = [
      {
        name: 'Frontend',
        type: 'frontend',
        description: `React application for ${project.description}`,
        files: ['src/App.tsx', 'src/main.tsx'],
        dependencies: ['react', 'react-dom']
      }
    ];

    if (reqs.features.includes('api-backend')) {
      components.push({
        name: 'Backend',
        type: 'backend',
        description: 'Express API server',
        files: ['server/index.ts'],
        dependencies: ['express', 'cors']
      });
    }

    const deps: Record<string, string> = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    };

    if (reqs.features.includes('drag-and-drop')) deps['@dnd-kit/core'] = '^6.0.0';
    if (reqs.features.includes('charts')) deps['recharts'] = '^2.10.0';
    if (reqs.features.includes('notifications')) deps['react-hot-toast'] = '^2.4.0';

    return {
      overview: `A ${project.type} application: ${project.description}`,
      components,
      dependencies: deps,
      fileStructure: {
        name: project.name,
        type: 'directory',
        path: '/',
        children: [
          { name: 'src', type: 'directory', path: '/src', children: [] },
          { name: 'public', type: 'directory', path: '/public', children: [] },
          { name: 'package.json', type: 'file', path: '/package.json' }
        ]
      },
      techStack: {
        frontend: ['react', 'typescript', 'vite', 'tailwindcss'],
        backend: reqs.features.includes('api-backend') ? ['node', 'express'] : [],
        database: [],
        testing: ['vitest'],
        deployment: ['docker']
      }
    };
  }

  private generateFiles(project: Project, architecture: ProjectArchitecture, reqs: ProjectRequirements): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // package.json
    files.push({
      path: 'package.json',
      content: this.genPackageJson(project, architecture, reqs),
      language: 'json',
      purpose: 'Package configuration'
    });

    // Config files
    files.push({
      path: 'vite.config.ts',
      content: this.genViteConfig(reqs),
      language: 'typescript',
      purpose: 'Vite configuration'
    });

    files.push({
      path: 'tsconfig.json',
      content: this.genTsConfig(),
      language: 'json',
      purpose: 'TypeScript configuration'
    });

    files.push({
      path: 'tailwind.config.js',
      content: this.genTailwindConfig(),
      language: 'javascript',
      purpose: 'Tailwind CSS configuration'
    });

    files.push({
      path: 'postcss.config.js',
      content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`,
      language: 'javascript',
      purpose: 'PostCSS configuration'
    });

    // HTML entry
    files.push({
      path: 'index.html',
      content: this.genIndexHtml(project),
      language: 'html',
      purpose: 'HTML entry point'
    });

    // Source files
    files.push({
      path: 'src/main.tsx',
      content: this.genMainTsx(),
      language: 'typescript',
      purpose: 'Application entry point'
    });

    files.push({
      path: 'src/index.css',
      content: this.genIndexCss(),
      language: 'css',
      purpose: 'Global styles with Tailwind'
    });

    files.push({
      path: 'src/App.tsx',
      content: this.genAppTsx(project, reqs),
      language: 'typescript',
      purpose: 'Main application component'
    });

    // Generate feature-specific components
    const componentFiles = this.genComponents(project, reqs);
    files.push(...componentFiles);

    // Generate types
    files.push({
      path: 'src/types.ts',
      content: this.genTypes(project, reqs),
      language: 'typescript',
      purpose: 'TypeScript type definitions'
    });

    // Generate hooks
    files.push({
      path: 'src/hooks/useLocalStorage.ts',
      content: this.genUseLocalStorage(),
      language: 'typescript',
      purpose: 'Local storage persistence hook'
    });

    // README
    files.push({
      path: 'README.md',
      content: this.genReadme(project, reqs),
      language: 'markdown',
      purpose: 'Project documentation'
    });

    // Docker
    files.push({
      path: 'Dockerfile',
      content: this.genDockerfile(),
      language: 'dockerfile',
      purpose: 'Container configuration'
    });

    files.push({
      path: '.gitignore',
      content: 'node_modules\ndist\n.env\n.env.local\n*.log\n.DS_Store\n',
      language: 'text',
      purpose: 'Git ignore rules'
    });

    return files;
  }

  private genPackageJson(project: Project, arch: ProjectArchitecture, reqs: ProjectRequirements): string {
    const name = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const deps: Record<string, string> = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'lucide-react': '^0.307.0',
    };

    if (reqs.features.includes('drag-and-drop')) {
      deps['@dnd-kit/core'] = '^6.1.0';
      deps['@dnd-kit/sortable'] = '^8.0.0';
      deps['@dnd-kit/utilities'] = '^3.2.0';
    }
    if (reqs.features.includes('charts')) {
      deps['recharts'] = '^2.10.0';
    }
    if (reqs.features.includes('notifications')) {
      deps['react-hot-toast'] = '^2.4.1';
    }

    return JSON.stringify({
      name,
      private: true,
      version: '1.0.0',
      description: project.description,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        test: 'vitest'
      },
      dependencies: deps,
      devDependencies: {
        '@types/react': '^18.2.48',
        '@types/react-dom': '^18.2.18',
        '@vitejs/plugin-react': '^4.2.1',
        'autoprefixer': '^10.4.17',
        'postcss': '^8.4.33',
        'tailwindcss': '^3.4.1',
        'typescript': '^5.3.3',
        'vite': '^5.0.12',
        'vitest': '^1.2.0'
      }
    }, null, 2);
  }

  private genViteConfig(reqs: ProjectRequirements): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
`;
  }

  private genTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true
      },
      include: ['src']
    }, null, 2);
  }

  private genTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
  }

  private genIndexHtml(project: Project): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name}</title>
  </head>
  <body class="bg-gray-50 dark:bg-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private genMainTsx(): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  }

  private genIndexCss(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased text-gray-900 dark:text-gray-100;
  }
}
`;
  }

  private genAppTsx(project: Project, reqs: ProjectRequirements): string {
    const imports: string[] = [`import { useState } from 'react'`];
    const componentImports: string[] = [];
    const stateVars: string[] = [];
    const bodyParts: string[] = [];

    // Header with dark mode
    componentImports.push(`import Header from './components/Header'`);

    // Main content based on features
    if (reqs.features.includes('crud') || reqs.features.includes('data-display')) {
      componentImports.push(`import ItemList from './components/ItemList'`);
      componentImports.push(`import ItemForm from './components/ItemForm'`);
      imports.push(`import { Item } from './types'`);
      imports.push(`import { useLocalStorage } from './hooks/useLocalStorage'`);

      stateVars.push(`  const [items, setItems] = useLocalStorage<Item[]>('${project.name.toLowerCase().replace(/\s+/g, '-')}-items', [])`);
      stateVars.push(`  const [editingItem, setEditingItem] = useState<Item | null>(null)`);

      stateVars.push(`
  const addItem = (item: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setItems([newItem, ...items])
  }

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
    setEditingItem(null)
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }`);

      bodyParts.push(`        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ItemForm
              onSubmit={editingItem ? (data) => updateItem(editingItem.id, data) : addItem}
              initialData={editingItem || undefined}
              onCancel={editingItem ? () => setEditingItem(null) : undefined}
            />
          </div>
          <div className="lg:col-span-2">
            <ItemList
              items={items}
              onEdit={setEditingItem}
              onDelete={deleteItem}
              onUpdate={updateItem}
            />
          </div>
        </div>`);
    }

    if (reqs.features.includes('search-filter')) {
      stateVars.push(`  const [searchQuery, setSearchQuery] = useState('')`);
      stateVars.push(`  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )`);
    }

    const hasSearch = reqs.features.includes('search-filter');

    return `${imports.join('\n')}
${componentImports.join('\n')}

export default function App() {
${stateVars.join('\n')}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header title="${project.name}" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
${hasSearch ? `        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
          />
        </div>` : ''}
${bodyParts.join('\n')}
      </main>
    </div>
  )
}
`;
  }

  private genComponents(project: Project, reqs: ProjectRequirements): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Header component
    files.push({
      path: 'src/components/Header.tsx',
      content: `import { useState, useEffect } from 'react'
import { Sun, Moon, ${reqs.features.includes('crud') ? 'PlusCircle, ' : ''}Menu } from 'lucide-react'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
`,
      language: 'typescript',
      purpose: 'Header with dark mode toggle'
    });

    // CRUD components
    if (reqs.features.includes('crud') || reqs.features.includes('data-display')) {
      files.push({
        path: 'src/components/ItemForm.tsx',
        content: this.genItemForm(project, reqs),
        language: 'typescript',
        purpose: 'Form for creating/editing items'
      });

      files.push({
        path: 'src/components/ItemList.tsx',
        content: this.genItemList(project, reqs),
        language: 'typescript',
        purpose: 'List display with actions'
      });

      files.push({
        path: 'src/components/ItemCard.tsx',
        content: this.genItemCard(project, reqs),
        language: 'typescript',
        purpose: 'Individual item card'
      });
    }

    return files;
  }

  private genItemForm(project: Project, reqs: ProjectRequirements): string {
    return `import { useState, useEffect } from 'react'
import { PlusCircle, Save, X } from 'lucide-react'
import { Item } from '../types'

interface ItemFormProps {
  onSubmit: (data: Omit<Item, 'id' | 'createdAt'>) => void
  initialData?: Item
  onCancel?: () => void
}

export default function ItemForm({ onSubmit, initialData, onCancel }: ItemFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description)
      setStatus(initialData.status)
      setPriority(initialData.priority)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({ title: title.trim(), description: description.trim(), status, priority })

    if (!initialData) {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {initialData ? 'Edit Item' : 'Add New Item'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            {initialData ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {initialData ? 'Save Changes' : 'Add Item'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
`;
  }

  private genItemList(project: Project, reqs: ProjectRequirements): string {
    return `import { Item } from '../types'
import ItemCard from './ItemCard'
import { Inbox } from 'lucide-react'

interface ItemListProps {
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Item>) => void
}

export default function ItemList({ items, onEdit, onDelete, onUpdate }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Create your first item using the form.</p>
      </div>
    )
  }

  const statusOrder = { 'in-progress': 0, 'todo': 1, 'done': 2 }
  const sorted = [...items].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Items ({items.length})
        </h2>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {items.filter(i => i.status === 'todo').length} todo
          </span>
          <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {items.filter(i => i.status === 'in-progress').length} active
          </span>
          <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            {items.filter(i => i.status === 'done').length} done
          </span>
        </div>
      </div>
      {sorted.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item.id)}
          onStatusChange={(status) => onUpdate(item.id, { status })}
        />
      ))}
    </div>
  )
}
`;
  }

  private genItemCard(project: Project, reqs: ProjectRequirements): string {
    return `import { Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Item } from '../types'

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Item['status']) => void
}

const statusConfig = {
  'todo': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'To Do' },
  'in-progress': { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'In Progress' },
  'done': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Done' },
}

const priorityConfig = {
  'low': { color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  'medium': { color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  'high': { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

export default function ItemCard({ item, onEdit, onDelete, onStatusChange }: ItemCardProps) {
  const status = statusConfig[item.status]
  const priority = priorityConfig[item.priority]
  const StatusIcon = status.icon

  const nextStatus = (): Item['status'] => {
    switch (item.status) {
      case 'todo': return 'in-progress'
      case 'in-progress': return 'done'
      case 'done': return 'todo'
    }
  }

  return (
    <div className={\`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all \${item.status === 'done' ? 'opacity-60' : ''}\`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusChange(nextStatus())}
          className={\`mt-0.5 p-1 rounded-lg \${status.bg} hover:opacity-80 transition-colors\`}
          title={\`Mark as \${nextStatus()}\`}
        >
          <StatusIcon className={\`w-5 h-5 \${status.color}\`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={\`font-medium text-gray-900 dark:text-white \${item.status === 'done' ? 'line-through' : ''}\`}>
              {item.title}
            </h3>
            <span className={\`text-[11px] px-2 py-0.5 rounded-full font-medium \${priority.color}\`}>
              {item.priority}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
`;
  }

  private genTypes(project: Project, reqs: ProjectRequirements): string {
    return `export interface Item {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}
`;
  }

  private genUseLocalStorage(): string {
    return `import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // ignore write errors
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
`;
  }

  private genReadme(project: Project, reqs: ProjectRequirements): string {
    return `# ${project.name}

${project.description}

## Features

${reqs.features.map(f => `- ${f.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n')}
- Dark mode support
- Responsive design
- Local storage persistence

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

\`\`\`bash
npm run build
\`\`\`

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

---

*Generated by Intent-to-Software Platform*
`;
  }

  private genDockerfile(): string {
    return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
  }

  private async writeProjectFiles(projectId: string, files: GeneratedFile[]): Promise<void> {
    const projectPath = join(STORAGE_PATH, projectId);

    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true });
    }

    for (const file of files) {
      if (file.path.includes('..')) {
        throw new Error(`Invalid file path (path traversal detected): ${file.path}`);
      }

      const filePath = resolve(projectPath, file.path);

      if (!filePath.startsWith(resolve(projectPath))) {
        throw new Error(`Invalid file path (escapes project directory): ${file.path}`);
      }

      const dir = filePath.substring(0, filePath.lastIndexOf('/'));

      if (dir && !existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(filePath, file.content, 'utf-8');
    }

    logger.info(`Wrote ${files.length} files to ${projectPath}`);
  }

  private async runTests(projectPath: string): Promise<TestResults> {
    try {
      const { stdout } = await execAsync('npm test', { cwd: projectPath, timeout: 300000 });

      return {
        success: true,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testSuites: [],
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testSuites: [],
        timestamp: new Date()
      };
    }
  }
}

interface ProjectRequirements {
  projectName: string
  description: string
  features: string[]
  techPrefs: string[]
  allText: string
}
