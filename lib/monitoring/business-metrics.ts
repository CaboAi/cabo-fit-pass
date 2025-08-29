import { recordMetric, trackBusinessEvent } from './sentry-integration';
import { createMonitoringLogger } from './enhanced-logger';

/**
 * Business metrics collection system for Cabo Fit Pass
 */

const logger = createMonitoringLogger('business-metrics');

export interface UserMetrics {
  userId: string;
  email?: string;
  tier?: string;
  creditsRemaining?: number;
  joinDate?: string;
}

export interface BookingMetrics {
  bookingId: string;
  userId: string;
  classId: string;
  studioId: string;
  creditsCost: number;
  bookingTime: Date;
  classTime: Date;
  status: 'confirmed' | 'cancelled' | 'attended' | 'no-show';
}

export interface PaymentMetrics {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'manual';
  type: 'subscription' | 'topup' | 'tourist-pass';
  creditsGranted: number;
  status: 'successful' | 'failed' | 'pending';
}

export interface ClassMetrics {
  classId: string;
  studioId: string;
  className: string;
  instructorId?: string;
  capacity: number;
  bookingCount: number;
  attendanceCount: number;
  noShowCount: number;
  avgRating?: number;
  date: Date;
  duration: number;
}

export interface StudioMetrics {
  studioId: string;
  studioName: string;
  totalClasses: number;
  totalBookings: number;
  totalRevenue: number;
  avgClassUtilization: number;
  activeInstructors: number;
  avgRating?: number;
}

/**
 * Business Metrics Collector
 */
export class BusinessMetricsCollector {
  private static instance: BusinessMetricsCollector;
  private metricsBuffer: Array<{
    type: string;
    data: any;
    timestamp: Date;
  }> = [];

  public static getInstance(): BusinessMetricsCollector {
    if (!BusinessMetricsCollector.instance) {
      BusinessMetricsCollector.instance = new BusinessMetricsCollector();
    }
    return BusinessMetricsCollector.instance;
  }

  /**
   * Track user-related metrics
   */
  trackUser(event: string, metrics: UserMetrics, additionalData?: Record<string, any>) {
    const eventData = {
      event,
      userId: metrics.userId,
      tier: metrics.tier,
      creditsRemaining: metrics.creditsRemaining,
      ...additionalData,
    };

    // Track in Sentry
    trackBusinessEvent(`user.${event}`, eventData, {
      userId: metrics.userId,
      component: 'user-management',
      metadata: metrics,
    });

    // Record specific metrics
    switch (event) {
      case 'registration':
        recordMetric('user.registrations', 1, 'count', {
          tier: metrics.tier || 'unknown',
        });
        break;

      case 'tier_change':
        recordMetric('user.tier_changes', 1, 'count', {
          from_tier: additionalData?.fromTier || 'unknown',
          to_tier: metrics.tier || 'unknown',
        });
        break;

      case 'credits_low':
        recordMetric('user.low_credits', 1, 'count', {
          tier: metrics.tier || 'unknown',
          credits_remaining: (metrics.creditsRemaining || 0).toString(),
        });
        break;
    }

    this.bufferMetric('user', { event, ...eventData });
    logger.businessEvent(`user.${event}`, { userId: metrics.userId }, eventData);
  }

  /**
   * Track booking-related metrics
   */
  trackBooking(event: string, metrics: BookingMetrics, additionalData?: Record<string, any>) {
    const eventData = {
      event,
      bookingId: metrics.bookingId,
      userId: metrics.userId,
      classId: metrics.classId,
      studioId: metrics.studioId,
      creditsCost: metrics.creditsCost,
      status: metrics.status,
      ...additionalData,
    };

    // Track in Sentry
    trackBusinessEvent(`booking.${event}`, eventData, {
      userId: metrics.userId,
      component: 'booking-system',
      metadata: metrics,
    });

    // Record specific metrics
    switch (event) {
      case 'created':
        recordMetric('booking.created', 1, 'count', {
          studio_id: metrics.studioId,
          credits_cost: metrics.creditsCost.toString(),
        });
        recordMetric('booking.credits_used', metrics.creditsCost, 'count', {
          studio_id: metrics.studioId,
        });
        break;

      case 'cancelled':
        recordMetric('booking.cancellations', 1, 'count', {
          studio_id: metrics.studioId,
          reason: additionalData?.reason || 'user_request',
        });
        break;

      case 'attended':
        recordMetric('booking.attendance', 1, 'count', {
          studio_id: metrics.studioId,
        });
        break;

      case 'no_show':
        recordMetric('booking.no_shows', 1, 'count', {
          studio_id: metrics.studioId,
        });
        break;
    }

    this.bufferMetric('booking', { event, ...eventData });
    logger.businessEvent(`booking.${event}`, { userId: metrics.userId }, eventData);
  }

  /**
   * Track payment-related metrics
   */
  trackPayment(event: string, metrics: PaymentMetrics, additionalData?: Record<string, any>) {
    const eventData = {
      event,
      paymentId: metrics.paymentId,
      userId: metrics.userId,
      amount: metrics.amount,
      currency: metrics.currency,
      type: metrics.type,
      creditsGranted: metrics.creditsGranted,
      status: metrics.status,
      ...additionalData,
    };

    // Track in Sentry (be careful with financial data)
    trackBusinessEvent(`payment.${event}`, {
      ...eventData,
      amount: metrics.amount, // Consider masking in production
    }, {
      userId: metrics.userId,
      component: 'payment-system',
    });

    // Record specific metrics
    switch (event) {
      case 'initiated':
        recordMetric('payment.initiated', 1, 'count', {
          type: metrics.type,
          payment_method: metrics.paymentMethod,
        });
        recordMetric('payment.amount', metrics.amount, metrics.currency, {
          type: metrics.type,
        });
        break;

      case 'completed':
        recordMetric('payment.completed', 1, 'count', {
          type: metrics.type,
          payment_method: metrics.paymentMethod,
        });
        recordMetric('payment.revenue', metrics.amount, metrics.currency, {
          type: metrics.type,
        });
        recordMetric('payment.credits_granted', metrics.creditsGranted, 'count', {
          type: metrics.type,
        });
        break;

      case 'failed':
        recordMetric('payment.failures', 1, 'count', {
          type: metrics.type,
          payment_method: metrics.paymentMethod,
          reason: additionalData?.reason || 'unknown',
        });
        break;
    }

    this.bufferMetric('payment', { event, ...eventData });
    logger.paymentEvent(event, metrics.amount, metrics.currency, 
      { userId: metrics.userId, component: 'payment-system' });
  }

  /**
   * Track class-related metrics
   */
  trackClass(event: string, metrics: ClassMetrics, additionalData?: Record<string, any>) {
    const utilizationRate = metrics.capacity > 0 ? 
      (metrics.bookingCount / metrics.capacity) * 100 : 0;
    const attendanceRate = metrics.bookingCount > 0 ? 
      (metrics.attendanceCount / metrics.bookingCount) * 100 : 0;

    const eventData = {
      event,
      classId: metrics.classId,
      studioId: metrics.studioId,
      className: metrics.className,
      capacity: metrics.capacity,
      bookingCount: metrics.bookingCount,
      attendanceCount: metrics.attendanceCount,
      utilizationRate: Math.round(utilizationRate),
      attendanceRate: Math.round(attendanceRate),
      ...additionalData,
    };

    // Track in Sentry
    trackBusinessEvent(`class.${event}`, eventData, {
      component: 'class-management',
      metadata: metrics,
    });

    // Record specific metrics
    switch (event) {
      case 'completed':
        recordMetric('class.utilization_rate', utilizationRate, 'percentage', {
          studio_id: metrics.studioId,
          class_name: metrics.className,
        });
        recordMetric('class.attendance_rate', attendanceRate, 'percentage', {
          studio_id: metrics.studioId,
          class_name: metrics.className,
        });
        recordMetric('class.no_shows', metrics.noShowCount, 'count', {
          studio_id: metrics.studioId,
        });
        break;

      case 'cancelled':
        recordMetric('class.cancellations', 1, 'count', {
          studio_id: metrics.studioId,
          reason: additionalData?.reason || 'unknown',
        });
        break;
    }

    this.bufferMetric('class', { event, ...eventData });
    logger.businessEvent(`class.${event}`, { component: 'class-management' }, eventData);
  }

  /**
   * Track studio performance metrics
   */
  trackStudio(event: string, metrics: StudioMetrics, additionalData?: Record<string, any>) {
    const eventData = {
      event,
      studioId: metrics.studioId,
      studioName: metrics.studioName,
      totalClasses: metrics.totalClasses,
      totalBookings: metrics.totalBookings,
      totalRevenue: metrics.totalRevenue,
      avgClassUtilization: metrics.avgClassUtilization,
      avgRating: metrics.avgRating,
      ...additionalData,
    };

    // Track in Sentry
    trackBusinessEvent(`studio.${event}`, eventData, {
      component: 'studio-management',
      metadata: metrics,
    });

    // Record specific metrics
    recordMetric('studio.revenue', metrics.totalRevenue, 'usd', {
      studio_id: metrics.studioId,
    });
    recordMetric('studio.utilization', metrics.avgClassUtilization, 'percentage', {
      studio_id: metrics.studioId,
    });

    if (metrics.avgRating) {
      recordMetric('studio.rating', metrics.avgRating, 'score', {
        studio_id: metrics.studioId,
      });
    }

    this.bufferMetric('studio', { event, ...eventData });
    logger.businessEvent(`studio.${event}`, { component: 'studio-management' }, eventData);
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, userId?: string, metadata?: Record<string, any>) {
    const eventData = {
      feature,
      action,
      userId,
      ...metadata,
    };

    trackBusinessEvent(`feature.${feature}.${action}`, eventData, {
      userId,
      component: 'feature-tracking',
    });

    recordMetric('feature.usage', 1, 'count', {
      feature,
      action,
    });

    this.bufferMetric('feature', eventData);
    logger.businessEvent(`feature.${feature}.${action}`, { userId }, metadata);
  }

  /**
   * Buffer metrics for batch processing
   */
  private bufferMetric(type: string, data: any) {
    this.metricsBuffer.push({
      type,
      data,
      timestamp: new Date(),
    });

    // Flush buffer if it gets too large
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics();
    }
  }

  /**
   * Flush metrics buffer
   */
  flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    logger.info('Flushing metrics buffer', {
      component: 'business-metrics',
      action: 'flush',
      metadata: {
        metricsCount: this.metricsBuffer.length,
      },
    });

    // In production, you might send these to a data warehouse
    // For now, they're already sent to Sentry
    this.metricsBuffer = [];
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary() {
    const summary = this.metricsBuffer.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMetrics: this.metricsBuffer.length,
      byType: summary,
      oldestMetric: this.metricsBuffer[0]?.timestamp,
      newestMetric: this.metricsBuffer[this.metricsBuffer.length - 1]?.timestamp,
    };
  }
}

// Singleton instance
export const businessMetrics = BusinessMetricsCollector.getInstance();

/**
 * Convenience functions for common tracking scenarios
 */
export const trackUserRegistration = (userId: string, email: string, tier: string) => {
  businessMetrics.trackUser('registration', {
    userId,
    email,
    tier,
    joinDate: new Date().toISOString(),
  });
};

export const trackBookingCreated = (
  bookingId: string,
  userId: string,
  classId: string,
  studioId: string,
  creditsCost: number
) => {
  businessMetrics.trackBooking('created', {
    bookingId,
    userId,
    classId,
    studioId,
    creditsCost,
    bookingTime: new Date(),
    classTime: new Date(), // This should be the actual class time
    status: 'confirmed',
  });
};

export const trackPaymentCompleted = (
  paymentId: string,
  userId: string,
  amount: number,
  currency: string,
  type: PaymentMetrics['type'],
  creditsGranted: number
) => {
  businessMetrics.trackPayment('completed', {
    paymentId,
    userId,
    amount,
    currency,
    paymentMethod: 'stripe',
    type,
    creditsGranted,
    status: 'successful',
  });
};

export const trackFeatureUsed = (feature: string, action: string, userId?: string) => {
  businessMetrics.trackFeatureUsage(feature, action, userId);
};

export default businessMetrics;