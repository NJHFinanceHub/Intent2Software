import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validator';
import { requireAuth } from '../middleware/auth';
import { UpdateAIConfigSchema, UpdateUserPreferencesSchema } from '@intent-platform/shared';
import { UserService } from '../services/UserService';

const router = Router();
router.use(requireAuth);
const userService = new UserService();

// Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const user = await userService.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update AI config
router.put('/me/ai-config', validateRequest(UpdateAIConfigSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const aiConfig = req.body;

    await userService.updateAIConfig(userId, aiConfig);

    res.json({ message: 'AI configuration updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put('/me/preferences', validateRequest(UpdateUserPreferencesSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const preferences = req.body;

    await userService.updatePreferences(userId, preferences);

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
