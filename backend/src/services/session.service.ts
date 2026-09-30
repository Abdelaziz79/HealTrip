import { v4 as uuidv4 } from 'uuid';
import { Session, ConversationMessage } from '../types';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/**
 * In-memory session store with TTL-based cleanup.
 * Each session holds conversation history for multi-turn AI context.
 */
export class SessionService {
  private sessions: Map<string, Session> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Create a new session.
   */
  createSession(language: 'en' | 'ar' = 'en', customId?: string): Session {
    const session: Session = {
      id: customId || uuidv4(),
      messages: [],
      language,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    this.sessions.set(session.id, session);
    logger.debug('Session', `Created session ${session.id}`);
    return session;
  }

  /**
   * Get a session by ID, or create one if sessionId is not provided.
   */
  getOrCreateSession(sessionId?: string, language?: 'en' | 'ar'): Session {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivity = Date.now();
        if (language) {
          session.language = language;
        }
        return session;
      }
      logger.info('Session', `Session ${sessionId} not found in memory, creating session with this ID`);
      return this.createSession(language || 'en', sessionId);
    }
    return this.createSession(language || 'en');
  }

  /**
   * Get a session by ID.
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  /**
   * Add a message to a session's conversation history.
   */
  addMessage(sessionId: string, message: ConversationMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn('Session', `Cannot add message: session ${sessionId} not found`);
      return;
    }
    session.messages.push(message);
    session.lastActivity = Date.now();
  }

  /**
   * Get all messages for a session (for AI context).
   */
  getMessages(sessionId: string): ConversationMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  /**
   * Delete a session.
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.debug('Session', `Deleted session ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Remove expired sessions.
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > config.sessionTtlMs) {
        this.sessions.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info('Session', `Cleaned up ${removed} expired session(s). Active: ${this.sessions.size}`);
    }
  }

  /**
   * Get count of active sessions (for monitoring).
   */
  getActiveCount(): number {
    return this.sessions.size;
  }

  /**
   * Graceful shutdown.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
}

export const sessionService = new SessionService();
