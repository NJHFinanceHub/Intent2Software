import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { Project, ProjectStatus, ProjectType, GeneratedFile } from '@intent-platform/shared';
import { logger } from '../utils/logger';
import archiver from 'archiver';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const STORAGE_PATH = process.env.PROJECT_STORAGE || './storage';

export class ProjectService {
  async createProject(data: {
    userId: string;
    name: string;
    description: string;
    aiConfig?: any;
  }): Promise<Project> {
    const id = uuidv4();
    const now = new Date();

    // Determine project type based on description keywords
    const type = this.inferProjectType(data.description);

    const result = await query(
      `INSERT INTO projects (id, user_id, name, description, type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, data.userId, data.name, data.description, type, ProjectStatus.INITIALIZING, now, now]
    );

    logger.info(`Created project: ${id} (${data.name})`);

    return this.mapRowToProject(result.rows[0]);
  }

  async getProject(projectId: string): Promise<Project | null> {
    const result = await query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map(row => this.mapRowToProject(row));
  }

  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
    await query(
      'UPDATE projects SET status = $1, updated_at = $2 WHERE id = $3',
      [status, new Date(), projectId]
    );

    logger.info(`Updated project ${projectId} status to ${status}`);
  }

  async updateProjectFiles(projectId: string, files: GeneratedFile[]): Promise<void> {
    await query(
      'UPDATE projects SET files = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(files), new Date(), projectId]
    );
  }

  async updateProjectArchitecture(projectId: string, architecture: any): Promise<void> {
    await query(
      'UPDATE projects SET architecture = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(architecture), new Date(), projectId]
    );
  }

  async deleteProject(projectId: string): Promise<void> {
    await query('DELETE FROM projects WHERE id = $1', [projectId]);
    logger.info(`Deleted project: ${projectId}`);
  }

  async createProjectArchive(projectId: string, format: 'zip' | 'tar'): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Ensure storage directory exists
    if (!existsSync(STORAGE_PATH)) {
      mkdirSync(STORAGE_PATH, { recursive: true });
    }

    const archivePath = join(STORAGE_PATH, `${projectId}.${format}`);
    const output = createWriteStream(archivePath);
    const archive = archiver(format === 'zip' ? 'zip' : 'tar');

    archive.pipe(output);

    // Add files to archive
    project.files.forEach(file => {
      archive.append(file.content, { name: file.path });
    });

    await archive.finalize();

    return archivePath;
  }

  private inferProjectType(description: string): ProjectType {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('react') || lowerDesc.includes('web app')) {
      return ProjectType.WEB_APP_REACT;
    }
    if (lowerDesc.includes('vue')) {
      return ProjectType.WEB_APP_VUE;
    }
    if (lowerDesc.includes('api') || lowerDesc.includes('backend') || lowerDesc.includes('server')) {
      if (lowerDesc.includes('python')) {
        return ProjectType.REST_API_PYTHON;
      }
      return ProjectType.REST_API_NODE;
    }
    if (lowerDesc.includes('static') || lowerDesc.includes('landing page') || lowerDesc.includes('website')) {
      return ProjectType.STATIC_WEBSITE;
    }
    if (lowerDesc.includes('cli') || lowerDesc.includes('command line') || lowerDesc.includes('tool')) {
      return ProjectType.CLI_TOOL;
    }

    // Default to React web app
    return ProjectType.WEB_APP_REACT;
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      requirements: row.requirements || [],
      architecture: row.architecture,
      files: row.files || [],
      buildOutput: row.build_output,
      testResults: row.test_results,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
