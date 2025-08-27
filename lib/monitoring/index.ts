/**
 * Monitoring System Entry Point
 * 
 * This file exports all monitoring functionality and provides a single
 * point of initialization for the entire monitoring infrastructure.
 */

// Core monitoring components
export { 
  MonitoringLogger, 
  createMonitoringLogger, 
  monitoringLogger, 
  monitoring 
} from './enhanced-logger';

export {
  withPerformanceMonitoring,
  getPerformanceMetrics,
  resetPerformanceMetrics,
  createRequestLogger,
  withDatabaseMonitoring,
} from './performance-middleware';

export {
  reportError,
  trackBusinessEvent,
  trackApiPerformance,
  trackDatabaseOperation,
  trackPaymentEvent,
  setUserContext,
  addBreadcrumb,
  withPerformanceMonitoring as withSentryPerformanceMonitoring,
  logContextToMonitoringContext,
  recordMetric,
} from './sentry-integration';

export {
  BusinessMetricsCollector,
  businessMetrics,
  trackUserRegistration,
  trackBookingCreated,
  trackPaymentCompleted,
  trackFeatureUsed,
} from './business-metrics';

export {
  AlertManager,
  alertManager,
  createAlert,
  updateMetric,
  evaluateAlerts,
} from './alerting-system';

// Error boundary components
export {
  SimpleErrorFallback,
  CardErrorFallback,
  useErrorReporting,
  useErrorBoundary,
  withErrorBoundary,
  FeatureErrorBoundary,
  ApiErrorBoundary,
  PageErrorBoundary,
  setupGlobalErrorHandling,
} from '../components/error-boundary-enhanced';

// Integration and configuration
export {
  withComprehensiveMonitoring,
  initializeMonitoring,
  monitoringMiddleware,
  createMonitoredApiHandler,
  createHealthCheckWithMonitoring,
} from './integration';

export {
  getMonitoringConfig,
  performanceThresholds,
  notificationChannels,
  metricsConfig,
  dashboardConfig,
  featureFlags,
  securityConfig,
} from './config';

// Types
export type { 
  Alert, 
  AlertRule, 
  NotificationChannel 
} from './alerting-system';

export type {
  UserMetrics,
  BookingMetrics,
  PaymentMetrics,
  ClassMetrics,
  StudioMetrics,
} from './business-metrics';

export type { MonitoringContext } from './sentry-integration';

export type { LogContext } from '../logger';

/**
 * Initialize the complete monitoring system
 * 
 * Call this once during application startup to set up:
 * - Sentry error tracking and performance monitoring
 * - Business metrics collection
 * - Alert evaluation and notification
 * - Performance monitoring middleware
 * - Global error handlers
 */
import { initializeMonitoring } from './integration';
import { setupGlobalErrorHandling } from '../components/error-boundary-enhanced';
import monitoringConfig from './config';

export function initializeMonitoringSystem() {
  // Initialize core monitoring
  initializeMonitoring();
  
  // Set up client-side error handling if in browser
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandling();
  }
  
  console.log('🔍 Monitoring system initialized', {
    environment: monitoringConfig.environment,
    sentry: monitoringConfig.sentry.enabled,
    metrics: monitoringConfig.metrics.enabled,
    alerts: monitoringConfig.alerts.enabled,
    dashboard: monitoringConfig.dashboard.enabled,
  });
}

/**
 * Quick start monitoring wrapper for API routes
 * 
 * Example usage:
 * ```typescript
 * export const GET = monitorApi(
 *   async (request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { component: 'users-api', operation: 'get-users' }
 * );
 * ```
 */
export function monitorApi<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response>,
  config: {
    component: string;
    operation: string;
    trackMetrics?: boolean;
  }
) {
  const { createMonitoredApiHandler } = require('./integration');
  
  return createMonitoredApiHandler(handler, {
    component: config.component,
    operationName: config.operation,
    trackBusinessMetrics: config.trackMetrics,
  });
}

/**
 * Quick start monitoring wrapper for business operations
 * 
 * Example usage:
 * ```typescript
 * const result = await monitorBusiness(
 *   () => createBooking(userId, classId),
 *   {
 *     component: 'booking-service',
 *     action: 'create-booking',
 *     userId,
 *     metadata: { classId }
 *   }
 * );
 * ```
 */
export async function monitorBusiness<T>(
  operation: () => Promise<T>,
  context: {
    component: string;
    action: string;
    userId?: string;
    metadata?: any;
  }
): Promise<T> {
  const { monitoringMiddleware } = require('./integration');
  
  return monitoringMiddleware.business(context.component)(
    operation,
    {
      action: context.action,
      userId: context.userId,
      metadata: context.metadata,
    }
  );
}

/**
 * Quick start monitoring wrapper for database operations
 * 
 * Example usage:
 * ```typescript
 * const users = await monitorDatabase(
 *   () => supabase.from('users').select('*'),
 *   {
 *     component: 'user-service',
 *     operation: 'SELECT',
 *     table: 'users'
 *   }
 * );
 * ```
 */
export async function monitorDatabase<T>(
  operation: () => Promise<T>,
  context: {
    component: string;
    operation: string;
    table: string;
  }
): Promise<T> {
  const { monitoringMiddleware } = require('./integration');
  
  return monitoringMiddleware.database(context.component)(
    operation,
    {
      operation: context.operation,
      table: context.table,
    }
  );
}

/**
 * Quick start monitoring wrapper for payment operations
 * 
 * Example usage:
 * ```typescript
 * const payment = await monitorPayment(
 *   () => stripe.paymentIntents.create(...),
 *   {
 *     component: 'payment-service',
 *     operation: 'create-payment-intent',
 *     amount: 1000,
 *     currency: 'usd'
 *   }
 * );
 * ```
 */
export async function monitorPayment<T>(
  operation: () => Promise<T>,
  context: {
    component: string;
    operation: string;
    amount?: number;
    currency?: string;
  }
): Promise<T> {
  const { monitoringMiddleware } = require('./integration');
  
  return monitoringMiddleware.payment(context.component)(
    operation,
    {
      operation: context.operation,
      amount: context.amount,
      currency: context.currency,
    }
  );
}

/**
 * Development utilities
 */
export const devUtils = {
  /**
   * Trigger a test alert (development only)
   */
  triggerTestAlert: async () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Test alerts can only be triggered in development');
      return;
    }
    
    await createAlert(
      'info',
      'Test Alert',
      'This is a test alert triggered from the development utilities',
      'dev-utils',
      { timestamp: new Date().toISOString() }
    );
  },

  /**
   * Get current monitoring statistics
   */
  getStats: () => {
    return {
      alerts: alertManager.getStats(),
      business: businessMetrics.getMetricsSummary(),
      performance: getPerformanceMetrics(),
      config: monitoringConfig,
    };
  },

  /**
   * Reset all metrics (development only)
   */
  resetMetrics: () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Metrics can only be reset in development');
      return;
    }
    
    resetPerformanceMetrics();
    businessMetrics.flushMetrics();
    console.log('✅ Metrics reset');
  },
};

// Default export for convenience
export default {
  initialize: initializeMonitoringSystem,
  monitorApi,
  monitorBusiness,
  monitorDatabase,
  monitorPayment,
  config: monitoringConfig,
  devUtils,
};

/**
 * Auto-initialize monitoring in production
 * In development, you may want to call initialize() manually for better control
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize on client-side in production
  initializeMonitoringSystem();
}