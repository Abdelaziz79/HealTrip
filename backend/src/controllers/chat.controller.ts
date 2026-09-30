import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiAgent } from '../services/ai/agent';
import { geminiPool } from '../services/ai/gemini-pool';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const CONTEXT = 'ChatController';

/**
 * Validation schema for chat requests.
 */
const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long (max 2000 chars)'),
  sessionId: z.string().max(128).optional(),
  language: z.enum(['en', 'ar']).optional(),
});

/**
 * POST /api/v1/chat
 * Send a message to the AI agent and get a response.
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validation = chatSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMsg = validation.error?.issues?.[0]?.message || 'Invalid request body';
      sendError(res, errorMsg, 400, 'VALIDATION_ERROR');
      return;
    }

    const { message, sessionId, language } = validation.data;
    logger.info(CONTEXT, `Chat request: "${message.substring(0, 50)}..."`, { sessionId, language });

    const response = await aiAgent.chat({ message, sessionId, language });

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/chat/stream
 * Send a message and stream the response via SSE.
 */
export const streamMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validation = chatSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMsg = validation.error?.issues?.[0]?.message || 'Invalid request body';
      sendError(res, errorMsg, 400, 'VALIDATION_ERROR');
      return;
    }

    const { message, sessionId, language } = validation.data;
    logger.info(CONTEXT, `Stream chat request: "${message.substring(0, 50)}..."`, { sessionId, language });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial event with session info
    res.write(`event: start\ndata: ${JSON.stringify({ status: 'processing' })}\n\n`);

    try {
      const response = await aiAgent.chat({ message, sessionId, language });

      // Send tool usage events
      for (const tool of response.toolsUsed) {
        res.write(
          `event: tool_call\ndata: ${JSON.stringify({
            tool: tool.toolName,
            args: tool.args,
          })}\n\n`
        );
      }

      // Send the final response
      res.write(
        `event: message\ndata: ${JSON.stringify({
          sessionId: response.sessionId,
          message: response.message,
          toolsUsed: response.toolsUsed,
          urgencyLevel: response.urgencyLevel,
        })}\n\n`
      );

      // End the stream
      res.write(`event: done\ndata: ${JSON.stringify({ status: 'complete' })}\n\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`
      );
    }

    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chat/ai-health
 * Get the health status of the AI pool (keys, models).
 */
export const getAIHealth = (_req: Request, res: Response): void => {
  const health = geminiPool.getHealthStatus();
  sendSuccess(res, health);
};
