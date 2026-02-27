import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { Conversation, Message, MessageRole, ConversationContext } from '@intent-platform/shared';
import { logger } from '../utils/logger';

export class ConversationService {
  async createConversation(projectId: string): Promise<Conversation> {
    const id = uuidv4();
    const now = new Date();

    const initialContext: ConversationContext = {
      stage: 'initial',
      extractedRequirements: [],
      clarificationNeeded: [],
      userPreferences: {}
    };

    const result = await query(
      `INSERT INTO conversations (id, project_id, messages, context, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, projectId, JSON.stringify([]), JSON.stringify(initialContext), now, now]
    );

    logger.info(`Created conversation: ${id} for project ${projectId}`);

    return this.mapRowToConversation(result.rows[0]);
  }

  async getConversation(projectId: string): Promise<Conversation | null> {
    const result = await query(
      'SELECT * FROM conversations WHERE project_id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConversation(result.rows[0]);
  }

  async addMessage(projectId: string, role: MessageRole, content: string): Promise<Message> {
    const conversation = await this.getConversation(projectId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date()
    };

    const updatedMessages = [...conversation.messages, message];

    await query(
      'UPDATE conversations SET messages = $1, updated_at = $2 WHERE project_id = $3',
      [JSON.stringify(updatedMessages), new Date(), projectId]
    );

    logger.info(`Added ${role} message to conversation for project ${projectId}`);

    return message;
  }

  async updateContext(projectId: string, context: Partial<ConversationContext>): Promise<void> {
    const conversation = await this.getConversation(projectId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updatedContext = { ...conversation.context, ...context };

    await query(
      'UPDATE conversations SET context = $1, updated_at = $2 WHERE project_id = $3',
      [JSON.stringify(updatedContext), new Date(), projectId]
    );

    logger.info(`Updated conversation context for project ${projectId}`);
  }

  private mapRowToConversation(row: any): Conversation {
    return {
      id: row.id,
      projectId: row.project_id,
      messages: row.messages || [],
      context: row.context || {
        stage: 'initial',
        extractedRequirements: [],
        clarificationNeeded: [],
        userPreferences: {}
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
