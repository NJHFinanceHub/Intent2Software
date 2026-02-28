import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validator';
import { requireAuth } from '../middleware/auth';
import { SendMessageSchema, MessageRole } from '@intent-platform/shared';
import { ConversationService } from '../services/ConversationService';
import { AIProviderService } from '../services/AIProviderService';
import { logger } from '../utils/logger';

const router = Router();
router.use(requireAuth);
const conversationService = new ConversationService();
const aiProviderService = new AIProviderService();

// Send message in conversation
router.post('/message', validateRequest(SendMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, message } = req.body;

    // Add user message to conversation
    const userMessage = await conversationService.addMessage(projectId, MessageRole.USER, message);

    // Get conversation context
    const conversation = await conversationService.getConversation(projectId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Generate AI response
    const aiResponse = await aiProviderService.processConversation(conversation);

    // Add assistant message
    const assistantMessage = await conversationService.addMessage(projectId, MessageRole.ASSISTANT, aiResponse.content);

    // Update conversation context
    await conversationService.updateContext(projectId, aiResponse.context);

    logger.info(`Message processed for project ${projectId}`);

    res.json({
      message: assistantMessage,
      requiresClarification: aiResponse.requiresClarification,
      clarificationQuestions: aiResponse.clarificationQuestions,
      readyToGenerate: aiResponse.readyToGenerate
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation for project
router.get('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const conversation = await conversationService.getConversation(projectId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

export default router;
