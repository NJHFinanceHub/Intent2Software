import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { User, AIConfig, UserPreferences } from '@intent-platform/shared';
import { logger } from '../utils/logger';

export class UserService {
  async getUser(userId: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async getOrCreateUser(email: string, name: string): Promise<User> {
    let result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return this.mapRowToUser(result.rows[0]);
    }

    // Create new user
    const id = uuidv4();
    const now = new Date();
    const defaultPreferences: UserPreferences = {
      theme: 'system',
      notifications: true
    };

    result = await query(
      `INSERT INTO users (id, email, name, preferences, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, email, name, JSON.stringify(defaultPreferences), now, now]
    );

    logger.info(`Created new user: ${id} (${email})`);

    return this.mapRowToUser(result.rows[0]);
  }

  async updateAIConfig(userId: string, aiConfig: AIConfig): Promise<void> {
    await query(
      'UPDATE users SET ai_config = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(aiConfig), new Date(), userId]
    );

    logger.info(`Updated AI config for user ${userId}`);
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedPreferences = { ...user.preferences, ...preferences };

    await query(
      'UPDATE users SET preferences = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(updatedPreferences), new Date(), userId]
    );

    logger.info(`Updated preferences for user ${userId}`);
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      aiConfig: row.ai_config,
      preferences: row.preferences || { theme: 'system', notifications: true },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
