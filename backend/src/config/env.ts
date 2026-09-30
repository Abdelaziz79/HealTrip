import dotenv from 'dotenv';

dotenv.config();

/** Parse comma-separated Gemini API keys from env */
function parseGeminiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEYS || '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

/** Parse comma-separated model names from env */
function parseGeminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS || 'gemini-3.5-flash,gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.1-pro,gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-lite';
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',

  // Gemini AI
  geminiApiKeys: parseGeminiKeys(),
  geminiModels: parseGeminiModels(),
  geminiMaxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10),
  geminiKeyCooldownMs: parseInt(process.env.GEMINI_KEY_COOLDOWN_MS || '60000', 10),

  // Session
  sessionTtlMs: parseInt(process.env.SESSION_TTL_MS || '3600000', 10), // 1 hour

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
};
