import { NextRequest, NextResponse } from 'next/server';
import { createComponentLogger, LogContext } from '@/lib/logger';
import { 
  trackApiPerformance, 
  recordMetric, 
  reportError, 
  logContextToMonitoringContext 
} from './sentry-integration';

/**
 * Performance monitoring middleware for API routes
 */

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: {
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  };
}

interface ApiMetrics {
  requestCount: number;
  errorCount: number;
  totalDuration: number;
  averageDuration: number;
  memoryLeaks: number;
}

// In-memory metrics store (in production, use Redis or similar)
const metricsStore = new Map<string, ApiMetrics>();

/**
 * Performance monitoring wrapper for API route handlers
 */
export function withPerformanceMonitoring<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  options: {
    component?: string;
    operationName?: string;
    thresholds?: {
      slowResponseMs?: number;
      memoryLeakMb?: number;
    };
  } = {}
) {
  const {
    component = 'api',
    operationName,
    thresholds = {
      slowResponseMs: 1000,
      memoryLeakMb: 10,
    },
  } = options;

  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const logger = createComponentLogger(component);
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage();
    
    // Extract request context
    const requestContext: LogContext = {
      requestId: crypto.randomUUID(),
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      component,
    };

    // Get route key for metrics
    const routeKey = `${request.method} ${request.nextUrl.pathname}`;
    
    try {
      logger.info('API request started', {
        ...requestContext,
        action: 'request-start',
        operationName,
      });

      // Execute the handler
      const response = await handler(request, ...args);
      
      // Calculate performance metrics
      const endTime = Date.now();
      const duration = endTime - startTime;
      const memoryAfter = process.memoryUsage();
      
      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            external: memoryAfter.external - memoryBefore.external,
          },
        },
      };

      // Update metrics store
      updateMetricsStore(routeKey, duration, false, metrics.memoryUsage.delta.heapUsed);

      // Log successful completion
      logger.info('API request completed', {
        ...requestContext,
        action: 'request-complete',
        duration,
        statusCode: response.status,
        metadata: {
          memoryDelta: Math.round(metrics.memoryUsage.delta.heapUsed / 1024 / 1024 * 100) / 100, // MB
          operationName,
        },
      });

      // Track performance in Sentry
      trackApiPerformance(
        request.nextUrl.pathname,
        request.method,
        duration,
        response.status,
        logContextToMonitoringContext(requestContext)
      );

      // Record custom metrics
      recordMetric('api.request.duration', duration, 'milliseconds', {
        method: request.method,
        endpoint: request.nextUrl.pathname,
        status: response.status.toString(),
      });

      recordMetric('api.request.memory_delta', metrics.memoryUsage.delta.heapUsed, 'bytes', {
        method: request.method,
        endpoint: request.nextUrl.pathname,
      });

      // Check for performance issues
      await checkPerformanceThresholds(metrics, requestContext, thresholds, logger);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      const memoryAfter = process.memoryUsage();
      
      // Update metrics store for error
      updateMetricsStore(routeKey, duration, true, memoryAfter.heapUsed - memoryBefore.heapUsed);

      logger.error('API request failed', {
        ...requestContext,
        action: 'request-error',
        duration,
        statusCode: 500,
        errorCode: 'API_ERROR',
      }, error as Error);

      // Report error to Sentry
      reportError(
        error as Error,
        logContextToMonitoringContext({
          ...requestContext,
          duration,
          statusCode: 500,
        }),
        'error'
      );

      // Record error metrics
      recordMetric('api.request.errors', 1, 'count', {
        method: request.method,
        endpoint: request.nextUrl.pathname,
        error_type: (error as Error).name,
      });

      throw error;
    }
  };
}

/**
 * Update in-memory metrics store
 */
function updateMetricsStore(
  routeKey: string,
  duration: number,
  isError: boolean,
  memoryDelta: number
): void {
  const existing = metricsStore.get(routeKey) || {
    requestCount: 0,
    errorCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    memoryLeaks: 0,
  };

  existing.requestCount++;
  existing.totalDuration += duration;
  existing.averageDuration = existing.totalDuration / existing.requestCount;
  
  if (isError) {
    existing.errorCount++;
  }
  
  // Track potential memory leaks (>10MB delta)
  if (memoryDelta > 10 * 1024 * 1024) {
    existing.memoryLeaks++;
  }

  metricsStore.set(routeKey, existing);
}

/**
 * Check performance thresholds and alert if necessary
 */
async function checkPerformanceThresholds(
  metrics: PerformanceMetrics,
  context: LogContext,
  thresholds: { slowResponseMs?: number; memoryLeakMb?: number },
  logger: any
): Promise<void> {
  const { slowResponseMs = 1000, memoryLeakMb = 10 } = thresholds;
  
  // Check for slow responses
  if (metrics.duration > slowResponseMs) {
    logger.warn('Slow API response detected', {
      ...context,
      action: 'performance-warning',
      metadata: {
        duration: metrics.duration,
        threshold: slowResponseMs,
        type: 'slow_response',
      },
    });

    recordMetric('api.slow_responses', 1, 'count', {
      method: context.method || 'unknown',
      endpoint: context.path || 'unknown',
    });
  }

  // Check for memory leaks
  const memoryDeltaMb = metrics.memoryUsage.delta.heapUsed / 1024 / 1024;
  if (memoryDeltaMb > memoryLeakMb) {
    logger.warn('High memory usage detected', {
      ...context,
      action: 'memory-warning',
      metadata: {
        memoryDelta: memoryDeltaMb,
        threshold: memoryLeakMb,
        type: 'memory_leak',
      },
    });

    recordMetric('api.memory_warnings', 1, 'count', {
      method: context.method || 'unknown',
      endpoint: context.path || 'unknown',
    });
  }
}

/**
 * Get performance metrics for monitoring dashboard
 */
export function getPerformanceMetrics(): Record<string, ApiMetrics> {
  return Object.fromEntries(metricsStore);
}

/**
 * Reset performance metrics (useful for testing)
 */
export function resetPerformanceMetrics(): void {
  metricsStore.clear();
}

/**
 * Middleware for automatic request/response logging
 */
export function createRequestLogger(component: string = 'api') {
  const logger = createComponentLogger(component);
  
  return (req: NextRequest, res: NextResponse) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Log incoming request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      component,
      action: 'request-received',
    });

    // Add response logging (this would be called after handler execution)
    const logResponse = (statusCode: number, error?: Error) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        logger.error('Request failed', {
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          duration,
          statusCode,
          component,
          action: 'request-failed',
        }, error);
      } else {
        logger.info('Request completed', {
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          duration,
          statusCode,
          component,
          action: 'request-completed',
        });
      }
    };

    return { requestId, logResponse };
  };
}

/**
 * Database operation performance tracking
 */
export async function withDatabaseMonitoring<T>(
  operation: () => Promise<T>,
  context: {
    operation: string;
    table: string;
    component?: string;
    requestId?: string;
  }
): Promise<T> {
  const startTime = Date.now();
  const logger = createComponentLogger(context.component || 'database');
  
  try {
    logger.debug('Database operation started', {
      action: context.operation,
      resource: context.table,
      requestId: context.requestId,
    });

    const result = await operation();
    const duration = Date.now() - startTime;

    logger.info('Database operation completed', {
      action: context.operation,
      resource: context.table,
      duration,
      requestId: context.requestId,
    });

    // Record database metrics
    recordMetric('db.operation.duration', duration, 'milliseconds', {
      operation: context.operation,
      table: context.table,
    });

    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Database operation failed', {
      action: context.operation,
      resource: context.table,
      duration,
      requestId: context.requestId,
      errorCode: 'DB_OPERATION_FAILED',
    }, error as Error);

    recordMetric('db.operation.errors', 1, 'count', {
      operation: context.operation,
      table: context.table,
      error_type: (error as Error).name,
    });

    throw error;
  }
}

export default {
  withPerformanceMonitoring,
  getPerformanceMetrics,
  resetPerformanceMetrics,
  createRequestLogger,
  withDatabaseMonitoring,
};