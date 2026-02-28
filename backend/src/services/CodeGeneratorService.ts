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
  TestResults
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

      // Step 1: Generate architecture
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.PLANNING);
      this.wsService.broadcast(projectId, 'project:status:changed', { status: ProjectStatus.PLANNING });

      const architecture = await this.generateArchitecture(project, conversation);
      await this.projectService.updateProjectArchitecture(projectId, architecture);

      logger.info(`Architecture generated for project ${projectId}`);

      // Step 2: Generate files
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.GENERATING);
      this.wsService.broadcast(projectId, 'project:status:changed', { status: ProjectStatus.GENERATING });

      const files = await this.generateFiles(project, architecture);
      await this.projectService.updateProjectFiles(projectId, files);

      logger.info(`Generated ${files.length} files for project ${projectId}`);

      // Emit file generation events
      files.forEach(file => {
        this.wsService.broadcast(projectId, 'project:file:generated', { file });
      });

      // Step 3: Write files to disk
      await this.writeProjectFiles(projectId, files);

      // Mark as ready
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.READY);
      this.wsService.broadcast(projectId, 'project:status:changed', { status: ProjectStatus.READY });

      logger.info(`Project ${projectId} generation completed successfully`);
    } catch (error) {
      logger.error(`Code generation failed for project ${projectId}:`, error);
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.FAILED);
      this.wsService.broadcast(projectId, 'project:status:changed', {
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
      this.wsService.broadcast(projectId, 'project:build:started', {});

      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const projectPath = join(STORAGE_PATH, projectId);

      // Install dependencies
      this.wsService.broadcast(projectId, 'project:build:progress', {
        step: 'Installing dependencies'
      });
      // TODO: Ideally this should run inside a Docker sandbox to isolate untrusted code execution
      await execAsync('npm install --ignore-scripts', { cwd: projectPath, timeout: 300000 });

      // Run build
      this.wsService.broadcast(projectId, 'project:build:progress', {
        step: 'Building project'
      });
      // TODO: Ideally this should run inside a Docker sandbox to isolate untrusted code execution
      const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath, timeout: 300000 });

      const buildOutput: BuildOutput = {
        success: true,
        logs: stdout.split('\n'),
        errors: stderr ? stderr.split('\n') : [],
        warnings: [],
        artifacts: ['dist'],
        timestamp: new Date()
      };

      // Run tests
      this.wsService.broadcast(projectId, 'project:test:started', {});

      const testResults = await this.runTests(projectPath);

      // Update project with results
      await this.projectService.getProject(projectId); // Refresh
      // TODO: Update build output and test results in database

      this.wsService.broadcast(projectId, 'project:build:completed', { buildOutput });
      this.wsService.broadcast(projectId, 'project:test:completed', { testResults });

      logger.info(`Build completed for project ${projectId}`);
    } catch (error) {
      logger.error(`Build failed for project ${projectId}:`, error);
      await this.projectService.updateProjectStatus(projectId, ProjectStatus.FAILED);
      throw error;
    }
  }

  private async generateArchitecture(project: Project, conversation: any): Promise<ProjectArchitecture> {
    // Use AI to generate architecture based on conversation
    // For now, return a template-based architecture

    const techStack = this.determineTechStack(project.type);

    return {
      overview: `A ${project.type} application built with modern best practices`,
      components: [
        {
          name: 'Frontend',
          type: 'frontend',
          description: 'User interface built with React',
          files: ['src/App.tsx', 'src/main.tsx'],
          dependencies: ['react', 'react-dom']
        },
        {
          name: 'Backend',
          type: 'backend',
          description: 'API server built with Express',
          files: ['server/index.ts'],
          dependencies: ['express', 'cors']
        }
      ],
      dependencies: techStack.dependencies,
      fileStructure: {
        name: project.name,
        type: 'directory',
        path: '/',
        children: [
          {
            name: 'src',
            type: 'directory',
            path: '/src',
            children: []
          },
          {
            name: 'public',
            type: 'directory',
            path: '/public',
            children: []
          },
          {
            name: 'package.json',
            type: 'file',
            path: '/package.json'
          }
        ]
      },
      techStack
    };
  }

  private async generateFiles(project: Project, architecture: ProjectArchitecture): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson(project, architecture),
      language: 'json',
      purpose: 'Package configuration and dependencies'
    });

    // Generate README
    files.push({
      path: 'README.md',
      content: this.generateReadme(project),
      language: 'markdown',
      purpose: 'Project documentation'
    });

    // Generate main application files based on project type
    if (project.type === 'web-app-react') {
      files.push(...this.generateReactApp(project));
    }

    // Generate Docker configuration
    files.push({
      path: 'Dockerfile',
      content: this.generateDockerfile(project),
      language: 'dockerfile',
      purpose: 'Container configuration'
    });

    files.push({
      path: '.gitignore',
      content: this.generateGitignore(),
      language: 'text',
      purpose: 'Git ignore rules'
    });

    return files;
  }

  private generatePackageJson(project: Project, architecture: ProjectArchitecture): string {
    return JSON.stringify({
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: project.description,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        test: 'vitest'
      },
      dependencies: architecture.dependencies,
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        'typescript': '^5.3.0',
        'vite': '^5.0.0',
        'vitest': '^1.0.0'
      }
    }, null, 2);
  }

  private generateReadme(project: Project): string {
    return `# ${project.name}

${project.description}

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Test

\`\`\`bash
npm test
\`\`\`

## Deployment

See \`Dockerfile\` for containerized deployment.

---

*Generated by Intent-to-Software Platform*
`;
  }

  private generateReactApp(project: Project): GeneratedFile[] {
    return [
      {
        path: 'src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        language: 'typescript',
        purpose: 'Application entry point'
      },
      {
        path: 'src/App.tsx',
        content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>${project.name}</h1>
      <p>${project.description}</p>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default App`,
        language: 'typescript',
        purpose: 'Main application component'
      },
      {
        path: 'src/App.css',
        content: `.App {
  text-align: center;
  padding: 2rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}`,
        language: 'css',
        purpose: 'Application styles'
      },
      {
        path: 'src/index.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}`,
        language: 'css',
        purpose: 'Global styles'
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
        language: 'html',
        purpose: 'HTML entry point'
      },
      {
        path: 'vite.config.ts',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
        language: 'typescript',
        purpose: 'Vite configuration'
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
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
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true
          },
          include: ['src'],
          references: [{ path: './tsconfig.node.json' }]
        }, null, 2),
        language: 'json',
        purpose: 'TypeScript configuration'
      }
    ];
  }

  private generateDockerfile(project: Project): string {
    return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
`;
  }

  private generateGitignore(): string {
    return `node_modules
dist
.env
.env.local
*.log
.DS_Store
`;
  }

  private async writeProjectFiles(projectId: string, files: GeneratedFile[]): Promise<void> {
    const projectPath = join(STORAGE_PATH, projectId);

    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true });
    }

    for (const file of files) {
      // Path traversal protection: reject paths containing '..'
      if (file.path.includes('..')) {
        throw new Error(`Invalid file path (path traversal detected): ${file.path}`);
      }

      const filePath = resolve(projectPath, file.path);

      // Verify the resolved path is still within the project directory
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
      // TODO: Ideally this should run inside a Docker sandbox to isolate untrusted code execution
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

  private determineTechStack(projectType: string): any {
    return {
      frontend: ['react', 'typescript', 'vite'],
      backend: ['node', 'express'],
      database: [],
      testing: ['vitest'],
      deployment: ['docker'],
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0'
      }
    };
  }
}
