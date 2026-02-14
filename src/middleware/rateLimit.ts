/**
 * Rate Limiting Middleware
 *
 * Anti-abuse rate limiting (not for monetization)
 * - Per IP: 1000 requests/hour
 * - With API key: 5000 requests/hour
 */

import rateLimit from 'express-rate-limit';

// Rate limit for requests without API key (by IP)
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Maximum 1000 requests per hour per IP. Consider getting a free API key for higher limits (5000/hour).',
      details: {
        limit: 1000,
        windowMs: 3600000,
        suggestion: 'Visit https://tracuuhs.com/developer to get a free API key, or self-host from https://github.com/quyphong91/hstc-api'
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
});

// Rate limit for requests with API key
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // 5000 requests per hour with API key
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Maximum 5000 requests per hour with API key.',
      details: {
        limit: 5000,
        windowMs: 3600000,
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip if no API key (will be handled by publicRateLimiter)
  skip: (req) => {
    // @ts-ignore
    return !req.apiKey;
  }
});
