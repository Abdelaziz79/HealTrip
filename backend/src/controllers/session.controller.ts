import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * GET /api/v1/chat/sessions/:sessionId
 * Get conversation history for a session.
 */
export const getSession = (req: Request, res: Response): void => {
  const sessionId = req.params.sessionId as string;

  const session = sessionService.getSession(sessionId);

  if (!session) {
    sendError(res, 'Session not found', 404, 'SESSION_NOT_FOUND');
    return;
  }

  sendSuccess(res, {
    id: session.id,
    language: session.language,
    messageCount: session.messages.length,
    messages: session.messages,
    urgencyLevel: session.urgencyLevel,
    createdAt: new Date(session.createdAt).toISOString(),
    lastActivity: new Date(session.lastActivity).toISOString(),
  });
};

/**
 * DELETE /api/v1/chat/sessions/:sessionId
 * Delete a chat session.
 */
export const deleteSession = (req: Request, res: Response): void => {
  const sessionId = req.params.sessionId as string;

  const deleted = sessionService.deleteSession(sessionId);

  if (!deleted) {
    sendError(res, 'Session not found', 404, 'SESSION_NOT_FOUND');
    return;
  }

  sendSuccess(res, { message: 'Session deleted successfully' });
};
