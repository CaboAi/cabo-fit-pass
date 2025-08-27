import { NextRequest } from 'next/server';

// Define log levels
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

// Type definitions
export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  component?: string;
  action?: string;
  resource?: string;
  recordId?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

export interface LogEntry {
  level: keyof typeof LOG_LEVELS;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
  service: string;
  environment: string;
}

// Edge-compatible logger (no Winston dependency)
class EdgeLogger {
  private logLevel: number;
  private isDevelopment: boolean;
  
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    const level = process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
    this.logLevel = LOG_LEVELS[level as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;
  }
  
  private shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    return LOG_LEVELS[level] <= this.logLevel;
  }
  
  private formatMessage(level: string, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    
    if (this.isDevelopment) {
      // Simple console format for development
      let output = `${timestamp} [${level.toUpperCase()}] ${message}`;
      
      if (context && Object.keys(context).length > 0) {
        const contextStr = Object.entries(context)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        if (contextStr) {
          output += ` | ${contextStr}`;
        }
      }
      
      if (error) {
        output += `\n${error.stack || error.message}`;
      }
      return output;
    } else {
      // JSON format for production
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'cabo-fit-pass',
        environment: process.env.NODE_ENV || 'development',
        ...(context && { context }),
        ...(error && { error: { message: error.message, stack: error.stack } })
      });
    }
  }
  
  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context, error));
    }
  }
  
  warn(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context, error));
    }
  }
  
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }
  
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

// Singleton logger instance
const edgeLogger = new EdgeLogger();

// Utility function to extract request context
export const extractRequestContext = (
  request: NextRequest,
  additionalContext?: Partial<LogContext>
): LogContext => {
  const headers = request.headers;
  
  return {
    requestId: headers.get('x-request-id') || crypto.randomUUID(),
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: headers.get('user-agent') || undefined,
    ip: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
    ...additionalContext,
  };
};

// Utility function to extract user context from session
export const extractUserContext = (session: any): Partial<LogContext> => {
  if (!session?.user) return {};
  
  return {
    userId: session.user.id,
    sessionId: session.user.email ? `session_${session.user.email}` : undefined,
  };
};

// Main logger class
export class Logger {
  private defaultContext: LogContext;

  constructor(defaultContext: Partial<LogContext> = {}) {
    this.defaultContext = {
      component: 'unknown',
      ...defaultContext,
    };
  }

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  error(message: string, context?: LogContext, error?: Error): void {
    edgeLogger.error(message, this.mergeContext(context), error);
  }

  warn(message: string, context?: LogContext): void {
    edgeLogger.warn(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    edgeLogger.info(message, this.mergeContext(context));
  }

  debug(message: string, context?: LogContext): void {
    edgeLogger.debug(message, this.mergeContext(context));
  }

  // Convenience method for API route logging
  apiRequest(message: string, request: NextRequest, additionalContext?: Partial<LogContext>): void {
    const context = extractRequestContext(request, additionalContext);
    this.info(message, context);
  }

  // Convenience method for API errors
  apiError(
    message: string,
    error: Error,
    request?: NextRequest,
    additionalContext?: Partial<LogContext>
  ): void {
    const context = request 
      ? extractRequestContext(request, additionalContext)
      : additionalContext;
    this.error(message, context, error);
  }

  // Convenience method for database operations
  dbOperation(
    operation: string,
    table: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    const logContext: LogContext = {
      action: operation,
      resource: table,
      ...context,
    };

    if (error) {
      this.error(`Database ${operation} failed on ${table}`, logContext, error);
    } else {
      this.info(`Database ${operation} completed on ${table}`, logContext);
    }
  }

  // Convenience method for authentication events
  authEvent(
    event: string,
    userId?: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    const logContext: LogContext = {
      component: 'auth',
      action: event,
      userId,
      ...context,
    };

    if (error) {
      this.error(`Authentication ${event} failed`, logContext, error);
    } else {
      this.info(`Authentication ${event} completed`, logContext);
    }
  }

  // Convenience method for payment operations
  paymentEvent(
    event: string,
    amount?: number,
    currency?: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    const logContext: LogContext = {
      component: 'payments',
      action: event,
      metadata: {
        amount,
        currency,
      },
      ...context,
    };

    if (error) {
      this.error(`Payment ${event} failed`, logContext, error);
    } else {
      this.info(`Payment ${event} completed`, logContext);
    }
  }

  // Create a child logger with additional default context
  child(additionalContext: Partial<LogContext>): Logger {
    return new Logger({ ...this.defaultContext, ...additionalContext });
  }
}

// Default logger instance
export const logger = new Logger();

// Convenience function to create component-specific loggers
export const createComponentLogger = (component: string, additionalContext?: Partial<LogContext>): Logger => {
  return new Logger({ component, ...additionalContext });
};

// Middleware helper for request logging
export const logMiddleware = (request: NextRequest, response?: Response) => {
  const context = extractRequestContext(request, {
    statusCode: response?.status,
  });
  
  const message = `${request.method} ${request.nextUrl.pathname}`;
  
  if (response && response.status >= 400) {
    logger.error(`API Error: ${message}`, context);
  } else {
    logger.info(`API Request: ${message}`, context);
  }
};

export default logger;