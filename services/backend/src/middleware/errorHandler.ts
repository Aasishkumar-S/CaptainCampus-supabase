import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@captain-campus/shared_types';

/**
 * Custom application error with HTTP status code and application code
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async handler wrapper to catch unhandled promise rejections in Express routes
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Unified Express error handling middleware
 */
export const errorHandler = (
  err: Error | AppError | ZodError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === 'development';

  // 1. AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: fieldErrors,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 3. Firebase Auth Errors
  if (err?.code && typeof err.code === 'string' && err.code.startsWith('auth/')) {
    let statusCode = 401;
    let message = 'Authentication failed';

    switch (err.code) {
      case 'auth/id-token-expired':
        message = 'Firebase ID token has expired';
        break;
      case 'auth/id-token-revoked':
        message = 'Firebase ID token has been revoked';
        break;
      case 'auth/invalid-id-token':
      case 'auth/argument-error':
        message = 'Invalid authentication token provided';
        break;
      case 'auth/user-not-found':
        message = 'User account not found';
        statusCode = 404;
        break;
      case 'auth/user-disabled':
        message = 'User account is disabled';
        statusCode = 403;
        break;
      default:
        message = err.message || 'Authentication error';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code,
        message,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 4. Default Unknown Internal Server Error
  const statusCode = err.status || err.statusCode || 500;
  const message = isDev || statusCode < 500 ? err.message : 'Internal server error occurred';

  console.error('[Unhandled Error]:', err);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
      ...(isDev && err.stack ? { details: err.stack } : {}),
    },
    timestamp: new Date().toISOString(),
  });
};
