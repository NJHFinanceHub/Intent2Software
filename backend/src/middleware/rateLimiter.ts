import { Request, Response, NextFunction } from 'express';
import { PlatformError, ErrorCode } from '@intent-platform/shared';
import { logger } from '../utils/logger';

// Simple in-memory rate limiter (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const identifier = req.ip || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    next();
    return;
  }

  if (record.count >= RATE_LIMIT) {
    logger.warn(`Rate limit exceeded for ${identifier}`);
    next(new PlatformError(
      'Too many requests, please try again later',
      ErrorCode.VALIDATION_ERROR,
      429
    ));
    return;
  }

  record.count++;
  next();
}
