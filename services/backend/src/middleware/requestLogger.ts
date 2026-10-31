import morgan from 'morgan';
import { Request } from 'express';

// Custom token to capture user UID if authenticated
morgan.token('user-id', (req: Request) => {
  return req.user?.uid || 'anonymous';
});

const isProd = process.env.NODE_ENV === 'production';

// Skip health check endpoint from polluting access logs
const skipHealthCheck = (req: Request) => {
  return req.originalUrl === '/api/v1/health' || req.originalUrl === '/health';
};

/**
 * Production JSON structured logger (FormatFn signature)
 */
const prodFormat: morgan.FormatFn = (tokens, req, res) => {
  return JSON.stringify({
    timestamp: tokens.date(req, res, 'iso'),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    responseTimeMs: Number(tokens['response-time'](req, res)),
    userId: tokens['user-id'](req, res),
    remoteAddr: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res),
  });
};

/**
 * Development format string with colors and timing
 */
const devFormat = ':method :url :status :response-time ms - user: :user-id';

export const requestLogger = isProd
  ? morgan(prodFormat, { skip: skipHealthCheck })
  : morgan(devFormat, { skip: skipHealthCheck });
