import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { preloadData } from './utils/dataLoader.js';
import { searchRouter } from './routes/search.js';
import { chaptersRouter } from './routes/chapters.js';
import { headingsRouter } from './routes/headings.js';
import { optionalAuth } from './middleware/auth.js';
import { publicRateLimiter, apiKeyRateLimiter } from './middleware/rateLimit.js';
import { attribution } from './middleware/attribution.js';

/**
 * HSTC API Server
 *
 * Vietnamese HS Code Classification API
 * - Free, open-source REST API
 * - Bilingual search (Vietnamese/English)
 * - Explanatory Notes (EN) and Supplementary Notes (SEN)
 */

export function createServer(): Express {
  // Preload data at server initialization
  preloadData();

  const app = express();

  // ============================================
  // Security & Middleware
  // ============================================

  // Helmet - Security headers
  app.use(helmet());

  // CORS - Allow all origins (public API)
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging (only in development)
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Optional authentication (checks for API key but doesn't require it)
  app.use(optionalAuth);

  // Rate limiting
  app.use(publicRateLimiter);  // IP-based rate limit (1000/hour)
  app.use(apiKeyRateLimiter);   // API key-based rate limit (5000/hour)

  // Attribution (adds "powered by" to responses)
  app.use(attribution);

  // ============================================
  // Routes
  // ============================================

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'HSTC API',
      description: 'Vietnamese HS Code Classification API',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        search: '/api/v1/search',
        chapters: '/api/v1/chapters',
        heading: '/api/v1/headings/:code',
      },
      documentation: 'https://tracuuhs.com/api/docs',
      github: 'https://github.com/quyphong91/hstc-api',
      attribution: {
        poweredBy: 'tracuuhs.com',
        license: 'MIT',
        openSource: true,
      }
    });
  });

  // Health check endpoint
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dataVersion: '2024',
      uptime: process.uptime(),
    });
  });

  // API Routes
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/chapters', chaptersRouter);
  app.use('/api/v1/headings', headingsRouter);

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An error occurred'
          : err.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  });

  return app;
}
