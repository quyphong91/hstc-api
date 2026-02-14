/**
 * Authentication Middleware (Optional)
 *
 * Optional API key validation for usage tracking (NOT for billing)
 * - API keys are optional - public access is allowed
 * - API keys enable higher rate limits and usage analytics
 */

import type { Request, Response, NextFunction } from 'express';

// Simple API key validation (in production, use a database)
// For now, accept any non-empty string as a valid API key
// In production, you'd validate against a database of registered keys
function isValidAPIKey(key: string): boolean {
  if (!key || key.trim().length === 0) {
    return false;
  }

  // For now, accept any API key format
  // In production, validate against database:
  // return await db.apiKeys.exists({ key, active: true });
  return key.length >= 10; // Minimum length requirement
}

/**
 * Optional API key middleware
 * Checks for API key in Authorization header but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No API key provided - continue with public access
      // @ts-ignore
      req.apiKey = null;
      return next();
    }

    // Check for "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Authorization header must be in format: Bearer <api-key>',
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    const apiKey = parts[1];

    // Validate API key
    if (!isValidAPIKey(apiKey)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key. Visit https://tracuuhs.com/developer to get a valid key.',
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Valid API key - attach to request for rate limiting
    // @ts-ignore
    req.apiKey = apiKey;

    // In production, you might also attach user info:
    // req.user = await db.users.findByAPIKey(apiKey);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication',
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  }
}
