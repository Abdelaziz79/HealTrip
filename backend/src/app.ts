import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { config } from './config/env';
import { logger } from './utils/logger';

const app: Application = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to HealTrip AI Backend API',
    version: '1.0.0',
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
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
