import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { query } from '../database';

const router = Router();

// Demo login - auto-authenticate as the demo user (development only)
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const demoUserId = '00000000-0000-0000-0000-000000000001';

    // Verify demo user exists
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [demoUserId]);
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Demo user not found' });
    }

    // Set session
    req.session.userId = demoUserId;

    logger.info('Demo user logged in');

    res.json({
      user: result.rows[0],
      message: 'Logged in as demo user'
    });
  } catch (error) {
    logger.error('Demo login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Check current session
router.get('/session', (req: Request, res: Response) => {
  if (req.session?.userId) {
    res.json({ authenticated: true, userId: req.session.userId });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
