import { Router } from 'express';
import { sendMessage, streamMessage, getAIHealth } from '../controllers/chat.controller';
import { getSession, deleteSession } from '../controllers/session.controller';
import { chatRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// AI Chat endpoints
router.post('/', chatRateLimiter, sendMessage);
router.post('/stream', chatRateLimiter, streamMessage);

// AI health status
router.get('/ai-health', getAIHealth);

// Session management
router.get('/sessions/:sessionId', getSession);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
