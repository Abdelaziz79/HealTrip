import { GoogleGenerativeAI, GenerativeModel, Content, Part, FunctionDeclarationsTool } from '@google/generative-ai';
import { config } from '../../config/env';
import { GeminiKeyConfig, GeminiModelConfig } from '../../types';
import { logger } from '../../utils/logger';

const CONTEXT = 'GeminiPool';

/**
 * Multi-key, multi-model Gemini client with automatic failover.
 *
 * Strategy:
 * 1. Round-robin across API keys for load distribution
 * 2. On failure (429/500/503), mark key with cooldown and rotate to next key
 * 3. If all keys for a model fail, cascade to the next model in priority order
 * 4. Health tracking per key with configurable cooldown period
 */
export class GeminiKeyPool {
  private keys: GeminiKeyConfig[];
  private models: GeminiModelConfig[];
  private currentKeyIndex: number = 0;
  private maxRetries: number;
  private cooldownMs: number;

  constructor() {
    if (config.geminiApiKeys.length === 0) {
      throw new Error('No Gemini API keys configured. Set GEMINI_API_KEYS in .env');
    }

    this.keys = config.geminiApiKeys.map((key) => ({
      key,
      failureCount: 0,
      lastFailure: null,
      cooldownUntil: null,
    }));

    this.models = config.geminiModels.map((name, index) => ({
      name,
      priority: index,
    }));

    this.maxRetries = config.geminiMaxRetries;
    this.cooldownMs = config.geminiKeyCooldownMs;

    logger.info(CONTEXT, `Initialized with ${this.keys.length} key(s) and ${this.models.length} model(s): ${this.models.map(m => m.name).join(', ')}`);
  }

  /**
   * Dynamically detect if GEMINI_API_KEYS or GEMINI_MODELS changed in process.env.
   */
  private checkAndReloadConfig(): void {
    const rawKeys = process.env.GEMINI_API_KEYS || '';
    const currentKeysStr = this.keys.map((k) => k.key).join(',');
    if (rawKeys && rawKeys !== currentKeysStr) {
      const newKeys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
      if (newKeys.length > 0) {
        logger.info(CONTEXT, `Detected change in GEMINI_API_KEYS, reloading ${newKeys.length} key(s)`);
        this.keys = newKeys.map((key) => ({
          key,
          failureCount: 0,
          lastFailure: null,
          cooldownUntil: null,
        }));
        this.currentKeyIndex = 0;
      }
    }

    const rawModels = process.env.GEMINI_MODELS || '';
    const currentModelsStr = this.models.map((m) => m.name).join(',');
    if (rawModels && rawModels !== currentModelsStr) {
      const newModels = rawModels.split(',').map((m) => m.trim()).filter(Boolean);
      if (newModels.length > 0) {
        logger.info(CONTEXT, `Detected change in GEMINI_MODELS, reloading ${newModels.length} model(s)`);
        this.models = newModels.map((name, index) => ({
          name,
          priority: index,
          cooldownUntil: null,
        }));
      }
    }
  }

  /**
   * Get the next available API key, skipping those in cooldown.
   * If all keys are in cooldown, resets the earliest cooled-down key to prevent deadlock.
   */
  private getNextAvailableKey(): GeminiKeyConfig | null {
    const now = Date.now();
    const totalKeys = this.keys.length;
    if (totalKeys === 0) return null;

    for (let i = 0; i < totalKeys; i++) {
      const index = (this.currentKeyIndex + i) % totalKeys;
      const keyConfig = this.keys[index];

      // Check if key is in cooldown
      if (keyConfig.cooldownUntil && keyConfig.cooldownUntil > now) {
        continue;
      }

      // Reset cooldown if expired
      if (keyConfig.cooldownUntil && keyConfig.cooldownUntil <= now) {
        keyConfig.cooldownUntil = null;
        keyConfig.failureCount = 0;
      }

      this.currentKeyIndex = (index + 1) % totalKeys;
      return keyConfig;
    }

    // Fallback: If every single key is marked in cooldown, reset the one with earliest cooldown
    logger.warn(CONTEXT, 'All keys in cooldown, resetting the earliest cooled key');
    let earliestKey = this.keys[0];
    for (const k of this.keys) {
      if ((k.cooldownUntil || 0) < (earliestKey.cooldownUntil || 0)) {
        earliestKey = k;
      }
    }
    earliestKey.cooldownUntil = null;
    earliestKey.failureCount = 0;
    return earliestKey;
  }

  /**
   * Mark a key as failed and apply cooldown.
   */
  private markKeyFailed(keyConfig: GeminiKeyConfig): void {
    keyConfig.failureCount++;
    keyConfig.lastFailure = Date.now();

    // Apply exponential cooldown: base * 2^(failures-1), capped at 5 minutes
    const cooldownDuration = Math.min(
      this.cooldownMs * Math.pow(2, keyConfig.failureCount - 1),
      5 * 60 * 1000
    );
    keyConfig.cooldownUntil = Date.now() + cooldownDuration;

    const keyIndex = this.keys.indexOf(keyConfig);
    logger.warn(CONTEXT, `Key ${keyIndex} failed (count: ${keyConfig.failureCount}). Cooldown: ${cooldownDuration / 1000}s`);
  }

  /**
   * Mark a key as disabled due to authentication / permission error.
   */
  private markKeyDisabled(keyConfig: GeminiKeyConfig, reason: string): void {
    keyConfig.failureCount += 5;
    keyConfig.lastFailure = Date.now();
    keyConfig.cooldownUntil = Date.now() + 60 * 60 * 1000; // 1 hour cooldown

    const keyIndex = this.keys.indexOf(keyConfig);
    logger.error(CONTEXT, `Key ${keyIndex} disabled for 1 hour: ${reason}`);
  }

  /**
   * Check if an error indicates invalid or unauthorized API key.
   */
  private isKeyError(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('api key not valid') ||
        msg.includes('api_key_invalid') ||
        msg.includes('invalid api key') ||
        msg.includes('key expired') ||
        msg.includes('unauthorized') ||
        msg.includes('authentication') ||
        msg.includes('401')
      );
    }
    return false;
  }

  /**
   * Check if an error indicates the model is not supported or access is denied.
   */
  private isModelUnavailableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('404') ||
        message.includes('403') ||
        message.includes('not found') ||
        message.includes('denied access') ||
        message.includes('permission denied') ||
        message.includes('unsupported') ||
        message.includes('does not exist') ||
        message.includes('publisher model') ||
        message.includes('not supported') ||
        message.includes('not available') ||
        message.includes('deprecated')
      );
    }
    return false;
  }

  /**
   * Check if an error is retryable (rate limit or server error).
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('429') ||
        message.includes('500') ||
        message.includes('503') ||
        message.includes('rate limit') ||
        message.includes('quota') ||
        message.includes('overloaded') ||
        message.includes('resource exhausted') ||
        message.includes('unavailable') ||
        message.includes('internal')
      );
    }
    return false;
  }

  /**
   * Create a GenerativeModel instance with a specific key and model.
   * Disables internal thinking budget to prevent chain-of-thought leaking into responses.
   */
  private createModel(
    keyConfig: GeminiKeyConfig,
    modelName: string,
    systemInstruction?: string,
    tools?: FunctionDeclarationsTool[]
  ): GenerativeModel {
    const genAI = new GoogleGenerativeAI(keyConfig.key);
    const generationConfig: Record<string, unknown> = {};

    // For models that support thinking mode, disable thinking tokens
    if (modelName.includes('2.5') || modelName.includes('2.0') || modelName.includes('thinking')) {
      generationConfig.thinkingConfig = {
        thinkingBudget: 0,
      };
    }

    return genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools,
      generationConfig: Object.keys(generationConfig).length > 0 ? (generationConfig as any) : undefined,
    });
  }

  /**
   * Execute a Gemini API call with automatic key rotation and model fallback.
   *
   * @param systemInstruction - System prompt for the model
   * @param contents - Conversation history
   * @param tools - Function calling tools
   * @returns The model's response
   */
  async generateContent(
    systemInstruction: string,
    contents: Content[],
    tools?: FunctionDeclarationsTool[]
  ): Promise<{ response: any; modelUsed: string }> {
    this.checkAndReloadConfig();

    const now = Date.now();
    // Filter out models currently in cooldown
    let availableModels = this.models.filter(
      (m) => !m.cooldownUntil || m.cooldownUntil <= now
    );

    // If all models are in cooldown, reset all model cooldowns to avoid deadlock
    if (availableModels.length === 0) {
      logger.warn(CONTEXT, 'All models were in cooldown, resetting model cooldowns');
      this.models.forEach((m) => (m.cooldownUntil = null));
      availableModels = this.models;
    }

    // Try each available model in priority order
    for (const modelConfig of availableModels) {
      let attempts = 0;

      while (attempts < this.maxRetries) {
        const keyConfig = this.getNextAvailableKey();

        if (!keyConfig) {
          logger.warn(CONTEXT, `All keys in cooldown for model ${modelConfig.name}, trying next model`);
          break;
        }

        attempts++;
        const keyIndex = this.keys.indexOf(keyConfig);

        try {
          logger.debug(CONTEXT, `Attempt ${attempts}/${this.maxRetries} with key ${keyIndex}, model ${modelConfig.name}`);

          const model = this.createModel(keyConfig, modelConfig.name, systemInstruction, tools);
          let timeoutHandle: NodeJS.Timeout | undefined;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(
              () => reject(new Error(`Model ${modelConfig.name} timed out after 15s`)),
              15000
            );
          });

          const result = await Promise.race([
            model.generateContent({ contents }),
            timeoutPromise,
          ]).finally(() => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
          });

          const response = (result as any).response;

          // Success — reset failure count for this key and clear any model cooldown
          keyConfig.failureCount = 0;
          keyConfig.cooldownUntil = null;
          modelConfig.cooldownUntil = null;

          logger.info(CONTEXT, `Success with key ${keyIndex}, model ${modelConfig.name}`);
          return { response, modelUsed: modelConfig.name };
        } catch (error) {
          logger.error(CONTEXT, `Error with key ${keyIndex}, model ${modelConfig.name}`, error);

          if (this.isKeyError(error)) {
            // Bad or revoked key — mark disabled and rotate to next key immediately
            this.markKeyDisabled(keyConfig, (error as Error).message);
            continue;
          } else if (this.isModelUnavailableError(error) || (error instanceof Error && error.message.includes('timed out'))) {
            logger.warn(
              CONTEXT,
              `Model ${modelConfig.name} is unavailable, timed out, or denied access. Marking in cooldown and cascading to next model.`
            );
            // Put model in 15-minute cooldown so next requests don't waste time on it
            modelConfig.cooldownUntil = Date.now() + 15 * 60 * 1000;
            break;
          } else if (this.isRetryableError(error)) {
            this.markKeyFailed(keyConfig);
            // Continue to next iteration — will try another key
          } else {
            // For other errors, try another key if attempts remain, else cascade
            this.markKeyFailed(keyConfig);
          }
        }
      }
    }

    // All models and keys exhausted
    throw new Error(
      'All Gemini AI keys and models are currently unavailable. Please verify API keys in .env or try again shortly.'
    );
  }

  /**
   * Get pool health status for monitoring.
   */
  getHealthStatus(): {
    totalKeys: number;
    availableKeys: number;
    models: string[];
    keys: Array<{
      index: number;
      failureCount: number;
      inCooldown: boolean;
      cooldownRemainingMs: number | null;
    }>;
  } {
    const now = Date.now();
    return {
      totalKeys: this.keys.length,
      availableKeys: this.keys.filter(
        (k) => !k.cooldownUntil || k.cooldownUntil <= now
      ).length,
      models: this.models.map((m) => m.name),
      keys: this.keys.map((k, i) => ({
        index: i,
        failureCount: k.failureCount,
        inCooldown: !!(k.cooldownUntil && k.cooldownUntil > now),
        cooldownRemainingMs: k.cooldownUntil ? Math.max(0, k.cooldownUntil - now) : null,
      })),
    };
  }
}

export const geminiPool = new GeminiKeyPool();
