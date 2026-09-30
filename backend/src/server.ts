import app from './app';
import { config } from './config/env';
import { sessionService } from './services/session.service';
import { logger } from './utils/logger';

const port = config.port;

const server = app.listen(port, () => {
  logger.info('Server', `🚀 HealTrip Backend is running on http://localhost:${port}`);
  logger.info('Server', `🩺 Health check: http://localhost:${port}/api/v1/health`);
  logger.info('Server', `💬 Chat endpoint: POST http://localhost:${port}/api/v1/chat`);
  logger.info('Server', `🌐 Environment: ${config.nodeEnv}`);
  logger.info('Server', `🔑 Gemini API keys configured: ${config.geminiApiKeys.length}`);
  logger.info('Server', `🤖 Gemini models: ${config.geminiModels.join(', ')}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function gracefulShutdown(signal: string): void {
  logger.info('Server', `Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('Server', 'HTTP server closed');
    sessionService.destroy();
    logger.info('Server', 'Cleanup complete. Exiting.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Server', 'Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Server', 'Unhandled Promise Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Server', 'Uncaught Exception', error);
  process.exit(1);
});
