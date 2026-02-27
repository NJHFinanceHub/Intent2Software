import { Pool } from 'pg';
import { logger } from '../utils/logger';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://platform_user:platform_password@localhost:5432/intent_platform';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    const client = await pool.connect();
    logger.info('Database connection successful');

    // Create tables if they don't exist
    await createTables(client);

    client.release();
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables(client: any): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      ai_config JSONB,
      preferences JSONB DEFAULT '{"theme": "system", "notifications": true}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'initializing',
      requirements TEXT[] DEFAULT '{}',
      architecture JSONB,
      files JSONB DEFAULT '[]'::jsonb,
      build_output JSONB,
      test_results JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      messages JSONB DEFAULT '[]'::jsonb,
      context JSONB DEFAULT '{"stage": "initial", "extractedRequirements": [], "clarificationNeeded": [], "userPreferences": {}}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
  `);

  logger.info('Database tables created successfully');
}

export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
}
