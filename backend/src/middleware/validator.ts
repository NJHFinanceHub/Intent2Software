import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { PlatformError, ErrorCode } from '@intent-platform/shared';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      next(new PlatformError(
        'Request validation failed',
        ErrorCode.VALIDATION_ERROR,
        400,
        error.errors
      ));
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error: any) {
      next(new PlatformError(
        'Query validation failed',
        ErrorCode.VALIDATION_ERROR,
        400,
        error.errors
      ));
    }
  };
}
