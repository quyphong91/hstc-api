/**
 * Headings Route
 * GET /api/v1/headings/:code
 *
 * Get all notes related to a specific HS heading (4-digit code)
 */

import { Router, type Request, type Response } from 'express';
import { loadENNotes, loadSENNotes } from '../utils/dataLoader.js';
import type { SearchLanguage } from '../utils/types.js';

export const headingsRouter = Router();

/**
 * Extract HS codes from text (e.g., "01.01", "0102", "01.02.11")
 */
function extractHSCodeFromText(text: string): string | null {
  const match = text.match(/\d{2}\.?\d{2}/);
  if (match) {
    return match[0].replace(/\./g, '');
  }
  return null;
}

/**
 * GET /api/v1/headings/:headingCode
 * Get detailed notes for a specific HS heading (4-digit code)
 */
headingsRouter.get('/:headingCode', (req: Request, res: Response) => {
  try {
    const headingCode = req.params.headingCode.replace(/\./g, ''); // Remove dots if present
    const language = (req.query.language as SearchLanguage) || 'vi';
    const includeRelated = req.query.includeRelated === 'true';

    // Validate heading code (must be 4 digits)
    if (!/^\d{4}$/.test(headingCode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HEADING_CODE',
          message: 'Heading code must be a 4-digit number (e.g., "0101" or "01.01")',
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Validate language
    if (!['vi', 'en'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LANGUAGE',
          message: 'language must be "vi" or "en"',
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Determine chapter number from heading code
    const chapterNumber = parseInt(headingCode.substring(0, 2), 10);

    const responseData: any = {
      headingCode,
      chapterNumber,
      title: {},
      enNotes: [],
      senNotes: [],
    };

    // Search EN notes for this heading
    const enNotes = loadENNotes();
    const enChapter = enNotes.find(ch => ch.chapterNumber === chapterNumber);

    if (enChapter) {
      responseData.title = {
        vi: enChapter.titleVi,
        en: enChapter.titleEn,
      };

      let currentHeading = chapterNumber.toString().padStart(2, '0');
      let capturing = false;

      for (const row of enChapter.content) {
        const text = language === 'en' && row.en ? row.en : row.vi;

        // Check if this row defines a new heading
        if (row.type === 'heading') {
          const extractedCode = extractHSCodeFromText(text);
          if (extractedCode) {
            currentHeading = extractedCode;
          }

          // Start capturing if this is our heading
          if (currentHeading === headingCode) {
            capturing = true;
            responseData.enNotes.push({
              type: row.type,
              text,
            });
            continue;
          } else if (capturing) {
            // Stop capturing when we hit a different heading
            break;
          }
        }

        // Capture content under this heading
        if (capturing) {
          responseData.enNotes.push({
            type: row.type,
            text,
          });
        }
      }
    }

    // Search SEN notes for this heading
    const senNotes = loadSENNotes();
    const senChapter = senNotes.find(ch => ch.chapterNumber === chapterNumber);

    if (senChapter) {
      let currentHSCodes: string[] = [];
      let capturing = false;

      for (const row of senChapter.content) {
        const text = language === 'en' && row.en ? row.en : row.vi;

        if (row.type === 'heading') {
          // Extract HS codes from heading
          const hsCodePattern = /\d{4}(?:\.\d{2}(?:\.\d{2})?)?/g;
          const matches = text.match(hsCodePattern);
          currentHSCodes = matches || [];

          // Check if our heading code is in this list
          const headingMatch = currentHSCodes.some(code => {
            const cleanCode = code.replace(/\./g, '').substring(0, 4);
            return cleanCode === headingCode;
          });

          if (headingMatch) {
            capturing = true;
            responseData.senNotes.push({
              type: row.type,
              text,
            });
            continue;
          } else if (capturing) {
            // Stop capturing when we hit a different heading
            break;
          }
        }

        if (capturing) {
          responseData.senNotes.push({
            type: row.type,
            text,
          });
        }
      }
    }

    // Check if we found any notes
    if (responseData.enNotes.length === 0 && responseData.senNotes.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'HEADING_NOT_FOUND',
          message: `No notes found for heading ${headingCode}`,
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    res.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        attribution: {
          poweredBy: 'tracuuhs.com',
          documentation: 'https://tracuuhs.com/api/docs',
          github: 'https://github.com/quyphong91/hstc-api'
        }
      }
    });

  } catch (error) {
    console.error('Get heading error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching heading details',
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  }
});
