/**
 * Search Route
 * POST /api/v1/search
 *
 * Search across EN and SEN notes with optional filters
 */

import { Router, type Request, type Response } from 'express';
import { searchNotesAdvanced } from '../utils/search.js';
import type { SearchLanguage, SearchMatchType } from '../utils/types.js';

export const searchRouter = Router();

// Validation helper
function validateSearchRequest(body: any): { valid: boolean; error?: string } {
  if (!body.keyword || typeof body.keyword !== 'string' || body.keyword.trim().length === 0) {
    return { valid: false, error: 'keyword is required and must be a non-empty string' };
  }

  if (body.keyword.length > 200) {
    return { valid: false, error: 'keyword must be 200 characters or less' };
  }

  if (body.language && !['vi', 'en'].includes(body.language)) {
    return { valid: false, error: 'language must be "vi" or "en"' };
  }

  if (body.matchType && !['tokens', 'exact'].includes(body.matchType)) {
    return { valid: false, error: 'matchType must be "tokens" or "exact"' };
  }

  if (body.material && body.material.length > 500) {
    return { valid: false, error: 'material must be 500 characters or less' };
  }

  if (body.functionFeature && body.functionFeature.length > 500) {
    return { valid: false, error: 'functionFeature must be 500 characters or less' };
  }

  if (body.maxResults && (typeof body.maxResults !== 'number' || body.maxResults < 1 || body.maxResults > 100)) {
    return { valid: false, error: 'maxResults must be a number between 1 and 100' };
  }

  return { valid: true };
}

/**
 * POST /api/v1/search
 * Search EN and SEN notes
 */
searchRouter.post('/', (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Validate request
    const validation = validateSearchRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: validation.error,
          details: {
            field: 'body',
            reason: validation.error,
          }
        },
        meta: {
          requestId: `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Extract parameters
    const {
      keyword,
      language = 'vi' as SearchLanguage,
      matchType = 'tokens' as SearchMatchType,
      material,
      functionFeature,
      maxResults = 20,
    } = req.body;

    // Perform search
    const matches = searchNotesAdvanced(
      keyword,
      language,
      material,
      functionFeature,
      matchType
    );

    // Limit results
    const limitedMatches = matches.slice(0, maxResults);

    const processingTime = Date.now() - startTime;

    // Return results
    res.json({
      success: true,
      data: {
        matches: limitedMatches,
        totalMatches: matches.length,
        query: {
          keyword,
          filters: {
            ...(material && { material }),
            ...(functionFeature && { functionFeature }),
          }
        }
      },
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
        processingTime,
        attribution: {
          poweredBy: 'tracuuhs.com',
          documentation: 'https://tracuuhs.com/api/docs',
          source: 'open-source',
          github: 'https://github.com/quyphong91/hstc-api'
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'An error occurred while searching',
      },
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
      }
    });
  }
});
