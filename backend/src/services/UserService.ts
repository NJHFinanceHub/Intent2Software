import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../database';
import { User, AIConfig, UserPreferences } from '@intent-platform/shared';
import { logger } from '../utils/logger';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

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
    // Encrypt the API key before storing
    const configToStore = { ...aiConfig };
    if (configToStore.apiKey) {
      configToStore.apiKey = encrypt(configToStore.apiKey);
    }

    await query(
      'UPDATE users SET ai_config = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(configToStore), new Date(), userId]
    );

    logger.info(`Updated AI config for user ${userId}`);
  }

  async getDecryptedAIConfig(userId: string): Promise<AIConfig | null> {
    const user = await this.getUser(userId);
    if (!user || !user.aiConfig) {
      return null;
    }

    const config = { ...user.aiConfig };
    if (config.apiKey) {
      try {
        config.apiKey = decrypt(config.apiKey);
      } catch (error) {
        logger.error(`Failed to decrypt API key for user ${userId}:`, error);
        throw new Error('Failed to decrypt API key');
      }
    }

    return config;
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
    // Mask the API key in the response (show only last 4 chars)
    let aiConfig = row.ai_config;
    if (aiConfig && aiConfig.apiKey) {
      aiConfig = { ...aiConfig };
      const key = aiConfig.apiKey;
      aiConfig.apiKey = key.length > 4 ? '****' + key.slice(-4) : '****';
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      aiConfig,
      preferences: row.preferences || { theme: 'system', notifications: true },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
