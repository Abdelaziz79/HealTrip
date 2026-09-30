import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { config } from './config/env';
import { logger } from './utils/logger';

const app: Application = express();

// ─── Trust Proxy (Required for Vercel & Reverse Proxies) ──────────────────────
app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const cleanUrl = (url?: string) => (url ? url.trim().replace(/\/$/, '') : '');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, direct browser URL navigation, server-to-server)
      if (!origin) return callback(null, true);

      const incomingOrigin = cleanUrl(origin);
      const configuredClient = cleanUrl(config.clientUrl);

      // Allow configured client URL, localhost dev, or any vercel.app deployment
      if (
        incomingOrigin === configuredClient ||
        incomingOrigin.endsWith('.vercel.app') ||
        incomingOrigin.includes('localhost') ||
        incomingOrigin.includes('127.0.0.1') ||
        !config.isProduction
      ) {
        return callback(null, true);
      }

      // Permissive fallback in prototype to guarantee frontend is never blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  })
);

// ─── Vercel Path Normalizer Middleware ────────────────────────────────────────
// When deployed on Vercel with rewrites, restore the original requested path if collapsed to /api
app.use((req: Request, _res: Response, next) => {
  const original = (req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.originalUrl) as string;
  if (original && original !== req.url && !req.url.startsWith('/api/v1') && !req.url.startsWith('/v1')) {
    if (req.url === '/' || req.url === '/api' || req.url === '/api/' || req.url === '/api/index') {
      req.url = original;
    }
  }
  next();
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Root & Info Routes ───────────────────────────────────────────────────────
const rootHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'HealTrip AI Backend API',
    version: '1.0.0',
    environment: config.nodeEnv,
    modelsAvailable: config.geminiModels.length,
    keysConfigured: config.geminiApiKeys.length,
    endpoints: {
      health: '/api/v1/health',
      chat: 'POST /api/v1/chat',
      chatStream: 'POST /api/v1/chat/stream',
      aiHealth: '/api/v1/chat/ai-health',
      doctors: '/api/v1/doctors',
      hospitals: '/api/v1/hospitals',
      specialties: '/api/v1/specialties',
    },
  });
};

app.get('/', rootHandler);
app.get('/api', rootHandler);
app.get('/api/index', rootHandler);

// ─── API Routes (support both /api/v1 and /v1 for Vercel flexibility) ────────
app.use('/api/v1', routes);
app.use('/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint '${req.method} ${req.originalUrl || req.url}' not found`,
      code: 'NOT_FOUND',
    },
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

(app as any).default = app;
export = app;
