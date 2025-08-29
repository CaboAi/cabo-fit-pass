/**
 * Monitoring configuration for Cabo Fit Pass
 */

export interface MonitoringConfig {
  enabled: boolean;
  environment: string;
  sentry: {
    enabled: boolean;
    dsn?: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    structured: boolean;
    fileOutput: boolean;
    console: boolean;
  };
  metrics: {
    enabled: boolean;
    flushIntervalMs: number;
    maxBufferSize: number;
    trackPerformance: boolean;
    trackBusiness: boolean;
  };
  alerts: {
    enabled: boolean;
    evaluationIntervalMs: number;
    defaultCooldownMinutes: number;
    webhookTimeout: number;
  };
  healthCheck: {
    enabled: boolean;
    intervalMs: number;
    timeout: number;
    retries: number;
  };
  dashboard: {
    enabled: boolean;
    refreshIntervalMs: number;
    maxAlertsDisplay: number;
    maxMetricsDisplay: number;
  };
}

/**
 * Default monitoring configuration
 */
const defaultConfig: MonitoringConfig = {
  enabled: true,
  environment: process.env.NODE_ENV || 'development',
  
  sentry: {
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },
  
  logging: {
    level: (process.env.LOG_LEVEL as any) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    structured: process.env.NODE_ENV === 'production',
    fileOutput: process.env.NODE_ENV === 'production',
    console: true,
  },
  
  metrics: {
    enabled: true,
    flushIntervalMs: 60000, // 1 minute
    maxBufferSize: 1000,
    trackPerformance: true,
    trackBusiness: true,
  },
  
  alerts: {
    enabled: true,
    evaluationIntervalMs: 60000, // 1 minute
    defaultCooldownMinutes: 10,
    webhookTimeout: 5000, // 5 seconds
  },
  
  healthCheck: {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    timeout: 10000, // 10 seconds
    retries: 3,
  },
  
  dashboard: {
    enabled: true,
    refreshIntervalMs: 30000, // 30 seconds
    maxAlertsDisplay: 20,
    maxMetricsDisplay: 50,
  },
};

/**
 * Performance thresholds for alerting
 */
export const performanceThresholds = {
  api: {
    responseTimeWarning: 1000, // ms
    responseTimeError: 3000, // ms
    errorRateWarning: 5, // %
    errorRateError: 15, // %
    throughputMin: 10, // requests per minute
  },
  
  system: {
    memoryWarning: 75, // %
    memoryError: 90, // %
    cpuWarning: 70, // %
    cpuError: 90, // %
    diskWarning: 80, // %
    diskError: 95, // %
  },
  
  business: {
    paymentFailureRateWarning: 5, // %
    paymentFailureRateError: 15, // %
    bookingCancellationRateWarning: 20, // %
    bookingCancellationRateError: 40, // %
    userChurnRateWarning: 10, // %
    userChurnRateError: 25, // %
  },
  
  database: {
    connectionTimeoutWarning: 5000, // ms
    connectionTimeoutError: 10000, // ms
    queryTimeWarning: 1000, // ms
    queryTimeError: 5000, // ms
    connectionPoolWarning: 80, // % utilization
    connectionPoolError: 95, // % utilization
  },
};

/**
 * Notification channel configurations
 */
export const notificationChannels = {
  webhook: {
    critical: process.env.MONITORING_WEBHOOK_URL,
    error: process.env.MONITORING_WEBHOOK_URL,
    warning: process.env.MONITORING_WEBHOOK_URL,
  },
  
  slack: {
    critical: process.env.SLACK_WEBHOOK_URL,
    error: process.env.SLACK_WEBHOOK_URL,
  },
  
  email: {
    critical: process.env.ALERT_EMAIL,
  },
};

/**
 * Metric collection configuration
 */
export const metricsConfig = {
  // API metrics
  api: {
    trackResponseTime: true,
    trackErrorRate: true,
    trackThroughput: true,
    trackStatusCodes: true,
    trackUserAgents: false,
    trackIpAddresses: false,
  },
  
  // Business metrics
  business: {
    trackUserRegistrations: true,
    trackBookings: true,
    trackPayments: true,
    trackCancellations: true,
    trackRefunds: true,
    trackClassAttendance: true,
    trackStudioPerformance: true,
  },
  
  // System metrics
  system: {
    trackMemoryUsage: true,
    trackCpuUsage: true,
    trackDiskUsage: false, // Not available in serverless
    trackNetworkUsage: false,
    trackProcessUptime: true,
  },
  
  // Database metrics
  database: {
    trackQueryTime: true,
    trackConnectionTime: true,
    trackConnectionPool: false, // Not directly accessible in Supabase
    trackQueryErrors: true,
  },
};

/**
 * Dashboard configuration
 */
export const dashboardConfig = {
  // Chart configurations
  charts: {
    responseTime: {
      enabled: true,
      timeRange: '24h',
      refreshInterval: 30000,
    },
    errorRate: {
      enabled: true,
      timeRange: '24h',
      refreshInterval: 30000,
    },
    throughput: {
      enabled: true,
      timeRange: '24h',
      refreshInterval: 30000,
    },
    userActivity: {
      enabled: true,
      timeRange: '7d',
      refreshInterval: 60000,
    },
    businessMetrics: {
      enabled: true,
      timeRange: '7d',
      refreshInterval: 60000,
    },
  },
  
  // Widget configurations
  widgets: {
    systemHealth: { enabled: true, order: 1 },
    activeAlerts: { enabled: true, order: 2 },
    keyMetrics: { enabled: true, order: 3 },
    apiPerformance: { enabled: true, order: 4 },
    businessMetrics: { enabled: true, order: 5 },
    recentActivity: { enabled: true, order: 6 },
  },
  
  // Alert display settings
  alerts: {
    showResolved: false,
    maxDisplay: 20,
    groupByComponent: true,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  },
};

/**
 * Feature flags for monitoring components
 */
export const featureFlags = {
  sentryIntegration: true,
  performanceMonitoring: true,
  businessMetrics: true,
  alerting: true,
  dashboard: true,
  healthChecks: true,
  errorBoundaries: true,
  clientSideTracking: true,
  realTimeUpdates: false, // Future feature
  customMetrics: true,
  logAggregation: false, // Future feature
};

/**
 * Security settings
 */
export const securityConfig = {
  // Data sanitization
  sanitizeUserData: true,
  sanitizeApiKeys: true,
  sanitizePasswords: true,
  sanitizeCreditCards: true,
  
  // IP filtering
  allowedIps: [], // Empty = allow all
  blockedIps: [],
  
  // Rate limiting for monitoring endpoints
  rateLimiting: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  
  // Authentication for monitoring endpoints
  authentication: {
    required: process.env.NODE_ENV === 'production',
    adminOnly: true,
  },
};

/**
 * Get monitoring configuration with environment overrides
 */
export const getMonitoringConfig = (): MonitoringConfig => {
  const config = { ...defaultConfig };
  
  // Environment-specific overrides
  if (process.env.NODE_ENV === 'production') {
    config.logging.level = 'info';
    config.metrics.flushIntervalMs = 30000; // More frequent in production
    config.alerts.evaluationIntervalMs = 30000; // More frequent in production
    config.sentry.tracesSampleRate = 0.1; // Lower sampling in production
  }
  
  if (process.env.NODE_ENV === 'development') {
    config.logging.level = 'debug';
    config.sentry.tracesSampleRate = 1.0; // Full sampling in development
    config.dashboard.refreshIntervalMs = 10000; // Faster refresh in development
  }
  
  if (process.env.NODE_ENV === 'test') {
    config.enabled = false; // Disable monitoring in tests
    config.sentry.enabled = false;
    config.alerts.enabled = false;
  }
  
  return config;
};

export default getMonitoringConfig();