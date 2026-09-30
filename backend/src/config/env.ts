import dotenv from 'dotenv';

dotenv.config();

/** Parse a string env var, stripping optional surrounding quotes */
function cleanStr(val?: string, fallback = ''): string {
  if (!val) return fallback;
  return val.replace(/^["']|["']$/g, '').trim() || fallback;
}

/** Parse an integer env var, stripping quotes and falling back if NaN */
function cleanInt(val?: string, fallback = 0): number {
  if (!val) return fallback;
  const cleaned = val.replace(/['"]/g, '').trim();
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse comma-separated or newline-separated Gemini API keys from env */
function parseGeminiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return raw
    .split(/[\n,]+/)
    .map((k) => k.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/** Parse comma-separated or newline-separated model names from env */
function parseGeminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash,gemini-3.1-flash-lite,gemini-3.1-pro';
  return raw
    .split(/[\n,]+/)
    .map((m) => m.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

const nodeEnv = cleanStr(process.env.NODE_ENV, 'development');

export const config = {
  // Server
  port: cleanInt(process.env.PORT, 5001),
  nodeEnv,
  clientUrl: cleanStr(process.env.CLIENT_URL, 'http://localhost:3000'),
  isProduction: nodeEnv === 'production',

  // Gemini AI
  geminiApiKeys: parseGeminiKeys(),
  geminiModels: parseGeminiModels(),
  geminiMaxRetries: cleanInt(process.env.GEMINI_MAX_RETRIES, 3),
  geminiKeyCooldownMs: cleanInt(process.env.GEMINI_KEY_COOLDOWN_MS, 60000),

  // Session
  sessionTtlMs: cleanInt(process.env.SESSION_TTL_MS, 3600000), // 1 hour

  // Rate Limiting
  rateLimitWindowMs: cleanInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: cleanInt(process.env.RATE_LIMIT_MAX_REQUESTS, 30),
};
