import { createMonitoringLogger } from './enhanced-logger';
import { recordMetric } from './sentry-integration';

/**
 * Comprehensive alerting system for Cabo Fit Pass
 */

const logger = createMonitoringLogger('alerting-system');

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  component: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  level: Alert['level'];
  component: string;
  description: string;
  cooldownMinutes: number;
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'webhook' | 'email' | 'slack';
  config: {
    url?: string;
    email?: string;
    headers?: Record<string, string>;
  };
  enabled: boolean;
  levels: Alert['level'][];
}

/**
 * Alert Manager
 */
export class AlertManager {
  private static instance: AlertManager;
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private lastAlerted: Map<string, Date> = new Map();
  private metrics: Map<string, any> = new Map();

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
      AlertManager.instance.setupDefaultRules();
      AlertManager.instance.setupDefaultChannels();
    }
    return AlertManager.instance;
  }

  /**
   * Create a new alert
   */
  async createAlert(
    level: Alert['level'],
    title: string,
    message: string,
    component: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      level,
      title,
      message,
      component,
      timestamp: new Date(),
      metadata,
    };

    this.alerts.set(alertId, alert);

    // Log the alert
    logger.warn('Alert created', {
      component: 'alerting',
      action: 'alert-created',
      metadata: {
        alertId,
        level,
        title,
        component,
      },
    });

    // Record alert metric
    recordMetric('alerts.created', 1, 'count', {
      level,
      component,
    });

    // Send notifications
    await this.sendNotifications(alert);

    return alertId;
  }

  /**
   * Update metric values for rule evaluation
   */
  updateMetric(key: string, value: any) {
    this.metrics.set(key, {
      value,
      timestamp: new Date(),
    });
  }

  /**
   * Evaluate all alert rules
   */
  async evaluateRules(): Promise<void> {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.lastAlerted.get(ruleId);
      if (lastAlert) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue;
        }
      }

      try {
        if (rule.condition(Object.fromEntries(this.metrics))) {
          await this.createAlert(
            rule.level,
            rule.name,
            rule.description,
            rule.component,
            {
              ruleId,
              triggeredBy: 'rule-evaluation',
              metrics: Object.fromEntries(this.metrics),
            }
          );

          this.lastAlerted.set(ruleId, new Date());
        }
      } catch (error) {
        logger.error('Rule evaluation failed', {
          component: 'alerting',
          action: 'rule-evaluation',
          metadata: { ruleId, ruleName: rule.name },
        }, error as Error);
      }
    }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const applicableChannels = Array.from(this.channels.values()).filter(
      channel => channel.enabled && channel.levels.includes(alert.level)
    );

    for (const channel of applicableChannels) {
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        logger.error('Notification failed', {
          component: 'alerting',
          action: 'notification-failed',
          metadata: {
            channelId: channel.id,
            alertId: alert.id,
          },
        }, error as Error);
      }
    }
  }

  /**
   * Send notification to a specific channel
   */
  private async sendNotification(
    channel: NotificationChannel,
    alert: Alert
  ): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, alert);
        break;
      case 'email':
        await this.sendEmailNotification(channel, alert);
        break;
    }

    recordMetric('alerts.notifications_sent', 1, 'count', {
      channel_type: channel.type,
      alert_level: alert.level,
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    channel: NotificationChannel,
    alert: Alert
  ): Promise<void> {
    if (!channel.config.url) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      alert: {
        id: alert.id,
        level: alert.level,
        title: alert.title,
        message: alert.message,
        component: alert.component,
        timestamp: alert.timestamp.toISOString(),
        metadata: alert.metadata,
      },
      service: 'cabo-fit-pass',
      environment: process.env.NODE_ENV || 'development',
    };

    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...channel.config.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    logger.info('Webhook notification sent', {
      component: 'alerting',
      action: 'webhook-sent',
      metadata: {
        channelId: channel.id,
        alertId: alert.id,
        responseStatus: response.status,
      },
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    channel: NotificationChannel,
    alert: Alert
  ): Promise<void> {
    if (!channel.config.url) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = {
      info: '#36a3d9',
      warning: '#ffb01e',
      error: '#f03e3e',
      critical: '#e03131',
    }[alert.level];

    const payload = {
      text: `Alert: ${alert.title}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Level',
              value: alert.level.toUpperCase(),
              short: true,
            },
            {
              title: 'Component',
              value: alert.component,
              short: true,
            },
            {
              title: 'Message',
              value: alert.message,
              short: false,
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed with status ${response.status}`);
    }

    logger.info('Slack notification sent', {
      component: 'alerting',
      action: 'slack-sent',
      metadata: {
        channelId: channel.id,
        alertId: alert.id,
      },
    });
  }

  /**
   * Send email notification (placeholder - would need email service)
   */
  private async sendEmailNotification(
    channel: NotificationChannel,
    alert: Alert
  ): Promise<void> {
    // This would integrate with an email service like SendGrid, Mailgun, etc.
    logger.info('Email notification triggered (not implemented)', {
      component: 'alerting',
      action: 'email-triggered',
      metadata: {
        channelId: channel.id,
        alertId: alert.id,
        email: channel.config.email,
      },
    });
  }

  /**
   * Set up default alert rules
   */
  private setupDefaultRules(): void {
    // High error rate rule
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => {
        const errors = metrics.error_rate?.value || 0;
        return errors > 5; // More than 5% error rate
      },
      level: 'warning',
      component: 'api',
      description: 'API error rate is above 5%',
      cooldownMinutes: 10,
      enabled: true,
    });

    // Critical error rate rule
    this.addRule({
      id: 'critical_error_rate',
      name: 'Critical Error Rate',
      condition: (metrics) => {
        const errors = metrics.error_rate?.value || 0;
        return errors > 15; // More than 15% error rate
      },
      level: 'critical',
      component: 'api',
      description: 'API error rate is above 15% - immediate attention required',
      cooldownMinutes: 5,
      enabled: true,
    });

    // Slow response time rule
    this.addRule({
      id: 'slow_responses',
      name: 'Slow API Responses',
      condition: (metrics) => {
        const avgResponseTime = metrics.avg_response_time?.value || 0;
        return avgResponseTime > 2000; // More than 2 seconds
      },
      level: 'warning',
      component: 'api',
      description: 'Average API response time is above 2 seconds',
      cooldownMinutes: 15,
      enabled: true,
    });

    // High memory usage rule
    this.addRule({
      id: 'high_memory',
      name: 'High Memory Usage',
      condition: (metrics) => {
        const memoryUsage = metrics.memory_usage?.value || 0;
        return memoryUsage > 85; // More than 85% memory usage
      },
      level: 'warning',
      component: 'system',
      description: 'System memory usage is above 85%',
      cooldownMinutes: 10,
      enabled: true,
    });

    // Payment failure rate rule
    this.addRule({
      id: 'payment_failures',
      name: 'High Payment Failure Rate',
      condition: (metrics) => {
        const failureRate = metrics.payment_failure_rate?.value || 0;
        return failureRate > 10; // More than 10% payment failures
      },
      level: 'error',
      component: 'payments',
      description: 'Payment failure rate is above 10%',
      cooldownMinutes: 10,
      enabled: true,
    });

    // Database connection failures
    this.addRule({
      id: 'db_connection_failures',
      name: 'Database Connection Failures',
      condition: (metrics) => {
        const dbFailures = metrics.db_connection_failures?.value || 0;
        return dbFailures > 0;
      },
      level: 'critical',
      component: 'database',
      description: 'Database connection failures detected',
      cooldownMinutes: 5,
      enabled: true,
    });
  }

  /**
   * Set up default notification channels
   */
  private setupDefaultChannels(): void {
    // Webhook channel for general monitoring
    if (process.env.MONITORING_WEBHOOK_URL) {
      this.addChannel({
        id: 'monitoring_webhook',
        name: 'Monitoring Webhook',
        type: 'webhook',
        config: {
          url: process.env.MONITORING_WEBHOOK_URL,
          headers: {
            'User-Agent': 'CaboFitPass-Monitoring/1.0',
          },
        },
        enabled: true,
        levels: ['warning', 'error', 'critical'],
      });
    }

    // Slack channel for critical alerts
    if (process.env.SLACK_WEBHOOK_URL) {
      this.addChannel({
        id: 'slack_critical',
        name: 'Slack Critical Alerts',
        type: 'slack',
        config: {
          url: process.env.SLACK_WEBHOOK_URL,
        },
        enabled: true,
        levels: ['error', 'critical'],
      });
    }

    // Email channel for critical alerts
    if (process.env.ALERT_EMAIL) {
      this.addChannel({
        id: 'email_critical',
        name: 'Email Critical Alerts',
        type: 'email',
        config: {
          email: process.env.ALERT_EMAIL,
        },
        enabled: true,
        levels: ['critical'],
      });
    }
  }

  /**
   * Add a new alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Add a new notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolvedAt);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date();
      this.alerts.set(alertId, alert);

      logger.info('Alert resolved', {
        component: 'alerting',
        action: 'alert-resolved',
        metadata: { alertId },
      });

      recordMetric('alerts.resolved', 1, 'count', {
        level: alert.level,
        component: alert.component,
      });

      return true;
    }
    return false;
  }

  /**
   * Get alerting statistics
   */
  getStats() {
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(a => !a.resolvedAt);
    
    return {
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: alerts.length - activeAlerts.length,
      alertsByLevel: alerts.reduce((acc, alert) => {
        acc[alert.level] = (acc[alert.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      rulesCount: this.rules.size,
      channelsCount: this.channels.size,
      enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      enabledChannels: Array.from(this.channels.values()).filter(c => c.enabled).length,
    };
  }
}

// Singleton instance
export const alertManager = AlertManager.getInstance();

/**
 * Convenience functions
 */
export const createAlert = (
  level: Alert['level'],
  title: string,
  message: string,
  component: string,
  metadata?: Record<string, any>
) => alertManager.createAlert(level, title, message, component, metadata);

export const updateMetric = (key: string, value: any) => alertManager.updateMetric(key, value);

export const evaluateAlerts = () => alertManager.evaluateRules();

export default alertManager;