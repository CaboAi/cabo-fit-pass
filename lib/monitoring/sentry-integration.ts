import * as Sentry from '@sentry/nextjs';
import { LogContext } from '@/lib/logger';

/**
 * Sentry integration utilities for enhanced error tracking and performance monitoring
 */

export interface MonitoringContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced error reporting to Sentry with structured context
 */
export const reportError = (
  error: Error,
  context: MonitoringContext = {},
  level: 'error' | 'warning' | 'info' = 'error'
) => {
  Sentry.withScope((scope) => {
    // Set user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    // Set tags for filtering and grouping
    if (context.component) {
      scope.setTag('component', context.component);
    }
    if (context.action) {
      scope.setTag('action', context.action);
    }

    // Set context data
    scope.setContext('monitoring', {
      requestId: context.requestId,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
      ...context.metadata,
    });

    // Set level
    scope.setLevel(level);

    // Capture the error
    Sentry.captureException(error);
  });
};

/**
 * Track business events and metrics
 */
export const trackBusinessEvent = (
  eventName: string,
  properties: Record<string, any> = {},
  context: MonitoringContext = {}
) => {
  Sentry.withScope((scope) => {
    // Set user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    // Set tags
    scope.setTag('event_type', 'business');
    if (context.component) {
      scope.setTag('component', context.component);
    }

    // Capture as a message with context
    Sentry.captureMessage(`Business Event: ${eventName}`, {
      level: 'info',
      extra: {
        properties,
        context,
        timestamp: new Date().toISOString(),
      },
    });
  });
};

/**
 * Track API performance metrics
 */
export const trackApiPerformance = (
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  context: MonitoringContext = {}
) => {
  // Use startSpan instead of deprecated startTransaction
  const span = Sentry.startSpan({
    name: `${method} ${endpoint}`,
    op: 'http.server',
    attributes: {
      'http.method': method,
      'http.status_code': statusCode.toString(),
      component: context.component || 'api',
    },
  });

  // Add context to the span
  span.setContext('api', {
    endpoint,
    method,
    duration,
    statusCode,
    requestId: context.requestId,
    userId: context.userId,
    timestamp: new Date().toISOString(),
  });

  // Record the measurement and end span
  span.setAttribute('response_time', duration);
  span.end();
};

/**
 * Track database operations
 */
export const trackDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  context: MonitoringContext = {}
) => {
  const span = Sentry.startSpan({
    name: `db.${operation}`,
    op: 'db',
    attributes: {
      'db.operation': operation,
      'db.table': table,
      'db.duration': duration,
      'db.success': success,
    },
  });

  // Add additional context
  span.setContext('database', {
    operation,
    table,
    duration,
    success,
    requestId: context.requestId,
    userId: context.userId,
    timestamp: new Date().toISOString(),
  });

  span.end();
};

/**
 * Track payment events with enhanced context
 */
export const trackPaymentEvent = (
  event: string,
  amount: number,
  currency: string,
  success: boolean,
  context: MonitoringContext = {}
) => {
  Sentry.withScope((scope) => {
    // Set user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    // Set tags for payment events
    scope.setTag('event_type', 'payment');
    scope.setTag('payment_event', event);
    scope.setTag('payment_success', success.toString());
    scope.setTag('currency', currency);

    // Set financial context (be careful with sensitive data)
    scope.setContext('payment', {
      event,
      amount: amount, // Consider masking in production
      currency,
      success,
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
    });

    // Capture the event
    const level = success ? 'info' : 'warning';
    Sentry.captureMessage(`Payment Event: ${event}`, { level });
  });
};

/**
 * Set user context for the session
 */
export const setUserContext = (userId: string, email?: string, additionalData?: Record<string, any>) => {
  Sentry.setUser({
    id: userId,
    email,
    ...additionalData,
  });
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
    data,
  });
};

/**
 * Create a performance monitoring decorator for functions
 */
export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  options: { component?: string; tags?: Record<string, string> } = {}
): T => {
  return ((...args: Parameters<T>) => {
    const span = Sentry.startSpan({
      name: operationName,
      op: 'function',
      attributes: {
        component: options.component || 'unknown',
        ...options.tags,
      },
    });

    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then((res) => {
            span.setStatus({ code: 1 }); // OK status
            span.end();
            return res;
          })
          .catch((error) => {
            span.setStatus({ code: 2 }); // Error status
            Sentry.captureException(error);
            span.end();
            throw error;
          });
      }
      
      // Handle sync functions
      span.setStatus({ code: 1 }); // OK status
      span.end();
      return result;
    } catch (error) {
      span.setStatus({ code: 2 }); // Error status
      Sentry.captureException(error);
      span.end();
      throw error;
    }
  }) as T;
};

/**
 * Convert log context to monitoring context
 */
export const logContextToMonitoringContext = (logContext: LogContext): MonitoringContext => {
  return {
    userId: logContext.userId,
    sessionId: logContext.sessionId,
    component: logContext.component,
    action: logContext.action,
    requestId: logContext.requestId,
    metadata: {
      path: logContext.path,
      method: logContext.method,
      statusCode: logContext.statusCode,
      duration: logContext.duration,
      errorCode: logContext.errorCode,
      ...logContext.metadata,
    },
  };
};

/**
 * Custom metrics collection
 */
export const recordMetric = (
  name: string,
  value: number,
  unit: string = 'count',
  tags: Record<string, string> = {}
) => {
  // For now, we'll capture as a message with metric data
  // In a full implementation, you might send to a metrics service
  Sentry.withScope((scope) => {
    scope.setTag('metric_type', 'custom');
    scope.setTag('metric_name', name);
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(`metric_${key}`, value);
    });

    scope.setContext('metric', {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    });

    Sentry.captureMessage(`Metric: ${name}`, { level: 'info' });
  });
};

export default {
  reportError,
  trackBusinessEvent,
  trackApiPerformance,
  trackDatabaseOperation,
  trackPaymentEvent,
  setUserContext,
  addBreadcrumb,
  withPerformanceMonitoring,
  logContextToMonitoringContext,
  recordMetric,
};