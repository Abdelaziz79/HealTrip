import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * General API rate limiter.
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

/**
 * Stricter rate limiter for AI chat endpoints (more expensive).
 */
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      message: 'Too many chat requests. Please wait a moment before sending another message.',
      code: 'CHAT_RATE_LIMIT_EXCEEDED',
    },
  },
});
