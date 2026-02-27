import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validator';
import { CreateProjectSchema, GenerateProjectSchema, BuildProjectSchema } from '@intent-platform/shared';
import { ProjectService } from '../services/ProjectService';
import { ConversationService } from '../services/ConversationService';
import { CodeGeneratorService } from '../services/CodeGeneratorService';
import { logger } from '../utils/logger';

const router = Router();
const projectService = new ProjectService();
const conversationService = new ConversationService();
const codeGeneratorService = new CodeGeneratorService();

// Create a new project
router.post('/', validateRequest(CreateProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, aiConfig } = req.body;

    // Create project
    const project = await projectService.createProject({
      userId: '00000000-0000-0000-0000-000000000001', // Demo user
      name,
      description,
      aiConfig
    });

    // Create conversation
    const conversation = await conversationService.createConversation(project.id);

    logger.info(`Project created: ${project.id}`);

    res.status(201).json({
      project,
      conversation
    });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const project = await projectService.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Get all projects for user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = '00000000-0000-0000-0000-000000000001'; // Demo user
    const projects = await projectService.getUserProjects(userId);

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Generate project code
router.post('/:projectId/generate', validateRequest(GenerateProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { confirmed } = req.body;

    if (!confirmed) {
      return res.status(400).json({ error: 'Generation must be confirmed' });
    }

    const project = await projectService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update status to generating
    await projectService.updateProjectStatus(projectId, 'generating');

    // Generate code asynchronously
    codeGeneratorService.generateProject(projectId).catch(error => {
      logger.error(`Code generation failed for project ${projectId}:`, error);
      projectService.updateProjectStatus(projectId, 'failed');
    });

    res.json({
      message: 'Code generation started',
      projectId
    });
  } catch (error) {
    next(error);
  }
});

// Build and test project
router.post('/:projectId/build', validateRequest(BuildProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;

    const project = await projectService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update status
    await projectService.updateProjectStatus(projectId, 'building');

    // Build project asynchronously
    codeGeneratorService.buildProject(projectId).catch(error => {
      logger.error(`Build failed for project ${projectId}:`, error);
      projectService.updateProjectStatus(projectId, 'failed');
    });

    res.json({
      message: 'Build started',
      projectId
    });
  } catch (error) {
    next(error);
  }
});

// Download project
router.get('/:projectId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const format = (req.query.format as string) || 'zip';

    const archivePath = await projectService.createProjectArchive(projectId, format as 'zip' | 'tar');

    res.download(archivePath, `project-${projectId}.${format}`);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    await projectService.deleteProject(projectId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
