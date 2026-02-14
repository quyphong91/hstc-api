/**
 * Attribution Middleware
 *
 * Adds attribution information to all API responses
 * This drives traffic back to tracuuhs.com
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Add attribution to response object
 * This is optional and added by individual routes
 */
export function attribution(req: Request, res: Response, next: NextFunction): void {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to add attribution if not already present
  res.json = function(body: any): Response {
    // Only add attribution to successful responses that don't already have it
    if (body && typeof body === 'object' && body.success !== false) {
      if (body.meta && !body.meta.attribution) {
        body.meta.attribution = {
          poweredBy: 'tracuuhs.com',
          documentation: 'https://tracuuhs.com/api/docs',
          source: 'open-source',
          github: 'https://github.com/quyphong91/hstc-api'
        };
      }
    }

    return originalJson(body);
  };

  next();
}
