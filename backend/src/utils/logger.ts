import { config } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

class Logger {
  private minLevel: LogLevel;

  constructor() {
    this.minLevel = config.isProduction ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel];
  }

  private format(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString();
    const color = LEVEL_COLORS[level];
    const levelStr = level.toUpperCase().padEnd(5);
    return `${color}${BOLD}[${levelStr}]${RESET} ${timestamp} ${BOLD}[${context}]${RESET} ${message}`;
  }

  debug(context: string, message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.format('debug', context, message), data ?? '');
  }

  info(context: string, message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    console.info(this.format('info', context, message), data ?? '');
  }

  warn(context: string, message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.format('warn', context, message), data ?? '');
  }

  error(context: string, message: string, error?: unknown): void {
    if (!this.shouldLog('error')) return;
    console.error(this.format('error', context, message), error ?? '');
  }
}

export const logger = new Logger();
