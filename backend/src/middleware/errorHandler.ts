import { Request, Response, NextFunction } from 'express';
import { PlatformError, ErrorCode } from '@intent-platform/shared';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error handler caught:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (error instanceof PlatformError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.message
      }
    });
    return;
  }

  // Default to 500 internal server error
  res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
}
