/**
 * Chapters Routes
 * GET /api/v1/chapters - List all chapters
 * GET /api/v1/chapters/:num - Get chapter details
 */

import { Router, type Request, type Response } from 'express';
import { loadChapters, loadENNotes, loadSENNotes } from '../utils/dataLoader.js';
import type { SearchLanguage } from '../utils/types.js';

export const chaptersRouter = Router();

/**
 * GET /api/v1/chapters
 * List all chapters with metadata
 */
chaptersRouter.get('/', (req: Request, res: Response) => {
  try {
    const language = (req.query.language as SearchLanguage) || 'vi';

    if (language && !['vi', 'en'].includes(language)) {
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

    const chapters = loadChapters();

    res.json({
      success: true,
      data: {
        chapters: chapters.map(ch => ({
          chapterNumber: ch.chapterNumber,
          title: language === 'en' ? ch.titleEn : ch.titleVi,
          hasEN: ch.hasEN,
          hasSEN: ch.hasSEN,
        }))
      },
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
    console.error('List chapters error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while listing chapters',
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  }
});

/**
 * GET /api/v1/chapters/:chapterNumber
 * Get full chapter details with EN/SEN notes
 */
chaptersRouter.get('/:chapterNumber', (req: Request, res: Response) => {
  try {
    const chapterNumber = parseInt(req.params.chapterNumber, 10);
    const source = (req.query.source as string) || 'both'; // 'en', 'sen', or 'both'
    const language = (req.query.language as SearchLanguage) || 'vi';

    // Validate chapter number
    if (isNaN(chapterNumber) || chapterNumber < 1 || chapterNumber > 99) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CHAPTER',
          message: 'Chapter number must be between 1 and 99',
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Validate source
    if (!['en', 'sen', 'both'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SOURCE',
          message: 'source must be "en", "sen", or "both"',
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

    const responseData: any = {
      chapterNumber,
      title: {},
    };

    // Load EN notes if requested
    if (source === 'en' || source === 'both') {
      const enNotes = loadENNotes();
      const enChapter = enNotes.find(ch => ch.chapterNumber === chapterNumber);

      if (!enChapter) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHAPTER_NOT_FOUND',
            message: `Chapter ${chapterNumber} not found in EN notes`,
          },
          meta: {
            timestamp: new Date().toISOString(),
          }
        });
      }

      responseData.title = {
        vi: enChapter.titleVi,
        en: enChapter.titleEn,
      };

      responseData.enNotes = enChapter.content.map(row => ({
        type: row.type,
        text: language === 'en' && row.en ? row.en : row.vi,
      }));
    }

    // Load SEN notes if requested
    if (source === 'sen' || source === 'both') {
      const senNotes = loadSENNotes();
      const senChapter = senNotes.find(ch => ch.chapterNumber === chapterNumber);

      if (senChapter) {
        if (!responseData.title.vi) {
          responseData.title = {
            vi: senChapter.titleVi,
            en: senChapter.titleEn,
          };
        }

        responseData.senNotes = senChapter.content.map(row => ({
          type: row.type,
          text: language === 'en' && row.en ? row.en : row.vi,
        }));
      }
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
    console.error('Get chapter error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching chapter',
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  }
});
