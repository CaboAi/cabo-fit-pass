import { Logger, LogContext, createComponentLogger } from '@/lib/logger';
import { 
  reportError, 
  trackBusinessEvent, 
  recordMetric, 
  addBreadcrumb,
  logContextToMonitoringContext 
} from './sentry-integration';

/**
 * Enhanced logger that integrates with Sentry monitoring
 */
export class MonitoringLogger extends Logger {
  constructor(defaultContext: Partial<LogContext> = {}) {
    super(defaultContext);
  }

  /**
   * Enhanced error logging with automatic Sentry reporting
   */
  error(message: string, context?: LogContext, error?: Error): void {
    // Call parent error method for Winston logging
    super.error(message, context, error);

    // Report to Sentry if error is provided
    if (error) {
      reportError(
        error,
        logContextToMonitoringContext(context || {}),
        'error'
      );

      // Record error metric
      recordMetric('app.errors', 1, 'count', {
        component: context?.component || 'unknown',
        action: context?.action || 'unknown',
        error_type: error.name,
      });
    }
  }

  /**
   * Enhanced warning logging
   */
  warn(message: string, context?: LogContext): void {
    super.warn(message, context);

    // Add breadcrumb for warnings
    addBreadcrumb(
      message,
      'warning',
      'warning',
      context
    );

    // Record warning metric
    recordMetric('app.warnings', 1, 'count', {
      component: context?.component || 'unknown',
      action: context?.action || 'unknown',
    });
  }

  /**
   * Enhanced info logging with business event tracking
   */
  info(message: string, context?: LogContext): void {
    super.info(message, context);

    // Add breadcrumb for significant events
    if (context?.action) {
      addBreadcrumb(
        message,
        context.component || 'app',
        'info',
        context
      );
    }
  }

  /**
   * Track business events with both logging and monitoring
   */
  businessEvent(
    event: string,
    context?: LogContext,
    properties?: Record<string, any>
  ): void {
    const message = `Business Event: ${event}`;
    
    // Log the event
    this.info(message, {
      ...context,
      action: 'business-event',
      metadata: {
        event,
        ...properties,
        ...context?.metadata,
      },
    });

    // Track in Sentry
    trackBusinessEvent(
      event,
      properties || {},
      logContextToMonitoringContext(context || {})
    );

    // Record metric
    recordMetric('business.events', 1, 'count', {
      event,
      component: context?.component || 'unknown',
    });
  }

  /**
   * Track payment events with enhanced logging
   */
  paymentEvent(
    event: string,
    amount?: number,
    currency?: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    // Call parent payment event method
    super.paymentEvent(event, amount, currency, context, error);

    // Record payment metrics
    if (amount) {
      recordMetric('payments.amount', amount, currency || 'usd', {
        event,
        success: !error ? 'true' : 'false',
      });
    }

    recordMetric('payments.events', 1, 'count', {
      event,
      currency: currency || 'usd',
      success: !error ? 'true' : 'false',
    });
  }

  /**
   * Track authentication events with enhanced monitoring
   */
  authEvent(
    event: string,
    userId?: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    // Call parent auth event method
    super.authEvent(event, userId, context, error);

    // Record auth metrics
    recordMetric('auth.events', 1, 'count', {
      event,
      success: !error ? 'true' : 'false',
      provider: context?.metadata?.provider || 'unknown',
    });

    // Track failed auth attempts more carefully
    if (error && event.includes('failed')) {
      recordMetric('auth.failures', 1, 'count', {
        event,
        reason: context?.metadata?.reason || 'unknown',
      });
    }
  }

  /**
   * Track database operations with performance metrics
   */
  dbOperation(
    operation: string,
    table: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    // Call parent db operation method
    super.dbOperation(operation, table, context, error);

    // Record database metrics
    recordMetric('db.operations', 1, 'count', {
      operation,
      table,
      success: !error ? 'true' : 'false',
    });

    // Track slow queries if duration is available
    if (context?.duration && context.duration > 1000) {
      recordMetric('db.slow_queries', 1, 'count', {
        operation,
        table,
        duration: context.duration.toString(),
      });
    }
  }

  /**
   * Track performance metrics
   */
  performance(
    operation: string,
    duration: number,
    context?: LogContext
  ): void {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    
    this.info(message, {
      ...context,
      action: 'performance-metric',
      duration,
      metadata: {
        operation,
        ...context?.metadata,
      },
    });

    // Record performance metric
    recordMetric('performance.operations', duration, 'milliseconds', {
      operation,
      component: context?.component || 'unknown',
    });

    // Track slow operations
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${operation}`, {
        ...context,
        action: 'slow-operation',
        duration,
      });
    }
  }

  /**
   * Create a child logger with enhanced monitoring
   */
  child(additionalContext: Partial<LogContext>): MonitoringLogger {
    return new MonitoringLogger({ ...this['defaultContext'], ...additionalContext });
  }
}

/**
 * Create component-specific monitoring logger
 */
export const createMonitoringLogger = (
  component: string,
  additionalContext?: Partial<LogContext>
): MonitoringLogger => {
  return new MonitoringLogger({ component, ...additionalContext });
};

/**
 * Default monitoring logger instance
 */
export const monitoringLogger = new MonitoringLogger();

/**
 * Convenience functions for common monitoring scenarios
 */
export const monitoring = {
  /**
   * Track user action
   */
  userAction: (
    action: string,
    userId: string,
    properties?: Record<string, any>
  ) => {
    monitoringLogger.businessEvent(`user.${action}`, {
      userId,
      component: 'user',
      action,
    }, properties);
  },

  /**
   * Track booking events
   */
  booking: (
    event: string,
    bookingId: string,
    userId?: string,
    properties?: Record<string, any>
  ) => {
    monitoringLogger.businessEvent(`booking.${event}`, {
      userId,
      component: 'booking',
      action: event,
      metadata: { bookingId, ...properties },
    }, properties);
  },

  /**
   * Track class events
   */
  class: (
    event: string,
    classId: string,
    properties?: Record<string, any>
  ) => {
    monitoringLogger.businessEvent(`class.${event}`, {
      component: 'class',
      action: event,
      metadata: { classId, ...properties },
    }, properties);
  },

  /**
   * Track gym/studio events
   */
  studio: (
    event: string,
    studioId: string,
    properties?: Record<string, any>
  ) => {
    monitoringLogger.businessEvent(`studio.${event}`, {
      component: 'studio',
      action: event,
      metadata: { studioId, ...properties },
    }, properties);
  },

  /**
   * Track feature usage
   */
  feature: (
    feature: string,
    action: string,
    userId?: string,
    properties?: Record<string, any>
  ) => {
    monitoringLogger.businessEvent(`feature.${feature}.${action}`, {
      userId,
      component: 'feature',
      action,
      metadata: { feature, ...properties },
    }, properties);
  },
};

export default MonitoringLogger;