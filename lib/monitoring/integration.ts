import { Logger, LogContext, createComponentLogger } from '@/lib/logger';
import { MonitoringLogger, createMonitoringLogger } from './enhanced-logger';
import { withPerformanceMonitoring } from './performance-middleware';
import { businessMetrics } from './business-metrics';
import { alertManager, createAlert } from './alerting-system';
import { reportError, trackApiPerformance } from './sentry-integration';
import monitoringConfig from './config';

/**
 * Integration layer that connects all monitoring components with the existing logging system
 */

/**
 * Enhanced API route wrapper that includes comprehensive monitoring
 */
export function withComprehensiveMonitoring<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response>,
  options: {
    component: string;
    operationName: string;
    businessMetrics?: {
      track: boolean;
      type?: 'user' | 'booking' | 'payment' | 'class' | 'studio';
      extractMetrics?: (request: Request, response: Response) => any;
    };
    alertRules?: {
      slowResponseMs?: number;
      errorRateThreshold?: number;
      memoryThreshold?: number;
    };
    logging?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
      includeHeaders?: boolean;
      includeBody?: boolean;
    };
  }
) {
  const { component, operationName, businessMetrics: bmConfig, alertRules, logging } = options;
  
  return withPerformanceMonitoring(
    async (request: Request, ...args: T) => {
      const logger = createMonitoringLogger(component);
      const startTime = Date.now();
      
      // Extract request context
      const requestId = crypto.randomUUID();
      const logContext: LogContext = {
        requestId,
        component,
        action: operationName,
        path: new URL(request.url).pathname,
        method: request.method,
      };

      try {
        // Log request start
        logger.info('Request started', {
          ...logContext,
          metadata: {
            operationName,
            headers: logging?.includeHeaders ? Object.fromEntries(request.headers) : undefined,
          },
        });

        // Execute the handler
        const response = await handler(request, ...args);
        const duration = Date.now() - startTime;
        
        // Log successful completion
        logger.info('Request completed successfully', {
          ...logContext,
          duration,
          statusCode: response.status,
          metadata: { operationName },
        });

        // Track business metrics if configured
        if (bmConfig?.track && bmConfig.extractMetrics) {
          try {
            const metrics = bmConfig.extractMetrics(request, response);
            if (metrics) {
              // Track based on type
              switch (bmConfig.type) {
                case 'booking':
                  businessMetrics.trackBooking('api_interaction', metrics);
                  break;
                case 'payment':
                  businessMetrics.trackPayment('api_interaction', metrics);
                  break;
                case 'user':
                  businessMetrics.trackUser('api_interaction', metrics);
                  break;
                // Add other types as needed
              }
            }
          } catch (metricsError) {
            logger.warn('Failed to track business metrics', logContext, metricsError as Error);
          }
        }

        // Check alert conditions
        if (alertRules) {
          await checkAlertConditions(
            {
              duration,
              statusCode: response.status,
              component,
              operationName,
            },
            alertRules,
            logger
          );
        }

        return response;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Log error
        logger.error('Request failed', {
          ...logContext,
          duration,
          statusCode: 500,
          errorCode: 'API_ERROR',
        }, error as Error);

        // Create alert for API errors
        await createAlert(
          'error',
          `API Error in ${component}`,
          `Operation ${operationName} failed: ${(error as Error).message}`,
          component,
          {
            operationName,
            duration,
            requestId,
            errorType: (error as Error).name,
          }
        );

        throw error;
      }
    },
    {
      component,
      operationName,
      thresholds: {
        slowResponseMs: alertRules?.slowResponseMs,
        memoryLeakMb: alertRules?.memoryThreshold,
      },
    }
  );
}

/**
 * Check alert conditions and create alerts if thresholds are exceeded
 */
async function checkAlertConditions(
  metrics: {
    duration: number;
    statusCode: number;
    component: string;
    operationName: string;
  },
  rules: {
    slowResponseMs?: number;
    errorRateThreshold?: number;
    memoryThreshold?: number;
  },
  logger: MonitoringLogger
) {
  const { duration, statusCode, component, operationName } = metrics;
  const { slowResponseMs = 2000, errorRateThreshold = 10 } = rules;

  // Check slow response
  if (duration > slowResponseMs) {
    await createAlert(
      'warning',
      'Slow API Response',
      `${operationName} took ${duration}ms (threshold: ${slowResponseMs}ms)`,
      component,
      {
        duration,
        threshold: slowResponseMs,
        operationName,
      }
    );
  }

  // Check error status
  if (statusCode >= 500) {
    await createAlert(
      'error',
      'API Server Error',
      `${operationName} returned ${statusCode} status`,
      component,
      {
        statusCode,
        operationName,
      }
    );
  } else if (statusCode >= 400) {
    await createAlert(
      'warning',
      'API Client Error',
      `${operationName} returned ${statusCode} status`,
      component,
      {
        statusCode,
        operationName,
      }
    );
  }
}

/**
 * Initialize monitoring system integration
 */
export function initializeMonitoring() {
  if (!monitoringConfig.enabled) {
    console.log('Monitoring is disabled');
    return;
  }

  const logger = createMonitoringLogger('monitoring-init');
  
  logger.info('Initializing monitoring system', {
    component: 'monitoring-init',
    action: 'initialize',
    metadata: {
      environment: monitoringConfig.environment,
      sentryEnabled: monitoringConfig.sentry.enabled,
      metricsEnabled: monitoringConfig.metrics.enabled,
      alertsEnabled: monitoringConfig.alerts.enabled,
    },
  });

  // Set up periodic tasks
  if (monitoringConfig.alerts.enabled) {
    setInterval(
      () => alertManager.evaluateRules(),
      monitoringConfig.alerts.evaluationIntervalMs
    );
  }

  if (monitoringConfig.metrics.enabled) {
    setInterval(
      () => businessMetrics.flushMetrics(),
      monitoringConfig.metrics.flushIntervalMs
    );
  }

  // Set up global error handlers if in browser
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers(logger);
  }

  logger.info('Monitoring system initialized successfully');
}

/**
 * Set up global error handlers for unhandled errors
 */
function setupGlobalErrorHandlers(logger: MonitoringLogger) {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      component: 'global-error-handler',
      action: 'unhandled-rejection',
      metadata: {
        reason: event.reason?.toString(),
      },
    });

    createAlert(
      'error',
      'Unhandled Promise Rejection',
      `Unhandled promise rejection: ${event.reason?.toString()}`,
      'global'
    );
  });

  // Uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    logger.error('Uncaught JavaScript error', {
      component: 'global-error-handler',
      action: 'uncaught-error',
      metadata: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    }, event.error);

    createAlert(
      'error',
      'Uncaught JavaScript Error',
      `Uncaught error: ${event.message} at ${event.filename}:${event.lineno}`,
      'global'
    );
  });
}

/**
 * Middleware factory for different types of operations
 */
export const monitoringMiddleware = {
  /**
   * API route monitoring
   */
  api: (component: string, operationName: string) =>
    withComprehensiveMonitoring,

  /**
   * Database operation monitoring
   */
  database: (component: string) => 
    <T>(operation: () => Promise<T>, context: { operation: string; table: string }) => {
      const logger = createMonitoringLogger(component);
      const startTime = Date.now();

      return operation()
        .then((result) => {
          const duration = Date.now() - startTime;
          
          logger.dbOperation(
            context.operation,
            context.table,
            { duration, component },
          );

          businessMetrics.trackFeatureUsage('database', context.operation, undefined, {
            table: context.table,
            duration,
          });

          return result;
        })
        .catch((error) => {
          const duration = Date.now() - startTime;
          
          logger.dbOperation(
            context.operation,
            context.table,
            { duration, component, errorCode: 'DB_ERROR' },
            error
          );

          createAlert(
            'error',
            'Database Operation Failed',
            `${context.operation} on ${context.table} failed: ${error.message}`,
            component,
            { operation: context.operation, table: context.table, duration }
          );

          throw error;
        });
    },

  /**
   * Payment operation monitoring
   */
  payment: (component: string) => 
    <T>(operation: () => Promise<T>, context: { operation: string; amount?: number; currency?: string }) => {
      const logger = createMonitoringLogger(component);
      
      return operation()
        .then((result) => {
          logger.paymentEvent(
            context.operation,
            context.amount,
            context.currency,
            { component, action: 'payment-success' }
          );

          if (context.amount && context.currency) {
            businessMetrics.trackPayment('completed', {
              paymentId: crypto.randomUUID(),
              userId: 'unknown', // Would be extracted from context
              amount: context.amount,
              currency: context.currency,
              paymentMethod: 'stripe',
              type: 'topup',
              creditsGranted: 0,
              status: 'successful',
            });
          }

          return result;
        })
        .catch((error) => {
          logger.paymentEvent(
            context.operation,
            context.amount,
            context.currency,
            { component, action: 'payment-error' },
            error
          );

          createAlert(
            'error',
            'Payment Operation Failed',
            `Payment ${context.operation} failed: ${error.message}`,
            component,
            { operation: context.operation, amount: context.amount }
          );

          throw error;
        });
    },

  /**
   * Business logic monitoring
   */
  business: (component: string) =>
    <T>(operation: () => Promise<T>, context: { action: string; userId?: string; metadata?: any }) => {
      const logger = createMonitoringLogger(component);
      
      return operation()
        .then((result) => {
          logger.businessEvent(context.action, {
            component,
            userId: context.userId,
          }, context.metadata);

          businessMetrics.trackFeatureUsage(component, context.action, context.userId, context.metadata);

          return result;
        })
        .catch((error) => {
          logger.error(`Business operation failed: ${context.action}`, {
            component,
            action: context.action,
            userId: context.userId,
            errorCode: 'BUSINESS_ERROR',
          }, error);

          createAlert(
            'warning',
            'Business Operation Failed',
            `${context.action} failed: ${error.message}`,
            component,
            { action: context.action, userId: context.userId }
          );

          throw error;
        });
    },
};

/**
 * Convenience function to create monitored API handlers
 */
export function createMonitoredApiHandler<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response>,
  config: {
    component: string;
    operationName: string;
    trackBusinessMetrics?: boolean;
  }
) {
  return withComprehensiveMonitoring(handler, {
    component: config.component,
    operationName: config.operationName,
    businessMetrics: {
      track: config.trackBusinessMetrics || false,
    },
  });
}

/**
 * Health check integration
 */
export function createHealthCheckWithMonitoring(
  baseHealthCheck: () => Promise<any>
) {
  return async () => {
    const logger = createMonitoringLogger('health-check');
    const startTime = Date.now();

    try {
      const result = await baseHealthCheck();
      const duration = Date.now() - startTime;

      logger.info('Health check completed', {
        component: 'health-check',
        action: 'health-check',
        duration,
        metadata: { status: result.status },
      });

      // Update alert manager with health status
      alertManager.updateMetric('health_check_duration', duration);
      alertManager.updateMetric('health_status', result.status === 'healthy' ? 1 : 0);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Health check failed', {
        component: 'health-check',
        action: 'health-check',
        duration,
      }, error as Error);

      await createAlert(
        'critical',
        'Health Check Failed',
        `System health check failed: ${(error as Error).message}`,
        'health-check',
        { duration }
      );

      throw error;
    }
  };
}

export default {
  withComprehensiveMonitoring,
  initializeMonitoring,
  monitoringMiddleware,
  createMonitoredApiHandler,
  createHealthCheckWithMonitoring,
};