/**
 * Structured logging utility for production observability
 * Provides consistent log format with context, timestamps, and severity levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    if (this.isDevelopment) {
      // Readable format for development
      let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      if (context && Object.keys(context).length > 0) {
        log += ` | Context: ${JSON.stringify(context)}`;
      }
      if (error) {
        log += ` | Error: ${error.message}`;
      }
      return log;
    } else {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // TODO: Send to external logging service (Sentry, DataDog, etc.)
    if (!this.isDevelopment && level === 'error') {
      // Future: Send to error tracking service
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log('error', message, context, error);
  }

  /**
   * Log API request with timing
   */
  apiRequest(endpoint: string, method: string, context?: LogContext) {
    this.info(`API ${method} ${endpoint}`, {
      endpoint,
      method,
      ...context,
    });
  }

  /**
   * Log API response with duration
   */
  apiResponse(endpoint: string, status: number, durationMs: number, context?: LogContext) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this.log(level, `API response ${endpoint} - ${status}`, {
      endpoint,
      status,
      duration: durationMs,
      ...context,
    });
  }

  /**
   * Log database query with timing
   */
  dbQuery(operation: string, durationMs: number, context?: LogContext) {
    if (durationMs > 1000) {
      this.warn(`Slow DB query: ${operation} (${durationMs}ms)`, {
        operation,
        duration: durationMs,
        ...context,
      });
    } else if (this.isDevelopment) {
      this.debug(`DB query: ${operation} (${durationMs}ms)`, {
        operation,
        duration: durationMs,
        ...context,
      });
    }
  }

  /**
   * Log external API call
   */
  externalApi(service: string, operation: string, success: boolean, context?: LogContext) {
    const level = success ? 'info' : 'error';
    this.log(level, `External API: ${service}.${operation}`, {
      service,
      operation,
      success,
      ...context,
    });
  }
}

export const logger = new Logger();
