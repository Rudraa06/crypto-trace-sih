import { config } from '../config/env.js';

/**
 * Middleware to enforce API key authentication on protected routes.
 * Validates the X-API-Key header against the INTERNAL_API_KEY environment variable.
 */
export function requireApiKey(req, res, next) {
  const apiKey = req.get('X-API-Key');

  if (!apiKey || apiKey !== config.internalApiKey) {
    return res.status(401).json({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid X-API-Key header is required to access this endpoint.',
      }
    });
  }

  next();
}
