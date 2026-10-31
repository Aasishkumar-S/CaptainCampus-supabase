import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 minute
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

/**
 * Standard rate limiter: 100 requests per minute per IP
 */
export const defaultLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests created from this IP, please try again later.',
    },
    timestamp: new Date().toISOString(),
  },
});

/**
 * Auth rate limiter: 10 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again in a minute.',
    },
    timestamp: new Date().toISOString(),
  },
});

/**
 * Telemetry rate limiter: 30 requests per minute per device or IP
 */
export const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: Request) => {
    return (
      (req.headers['x-device-id'] as string) ||
      (req.body && req.body.busId ? String(req.body.busId) : req.ip || 'unknown')
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TELEMETRY_RATE_LIMIT_EXCEEDED',
      message: 'Telemetry ingestion rate limit exceeded for this device/bus.',
    },
    timestamp: new Date().toISOString(),
  },
});
