# Monitoring System Documentation

## Overview

The Cabo Fit Pass monitoring system provides comprehensive observability across the entire application, including error tracking, performance monitoring, business metrics collection, and real-time alerting.

## Features

✅ **Sentry Integration** - Error tracking and performance monitoring  
✅ **Performance Monitoring** - API response times, memory usage, and throughput  
✅ **Business Metrics** - User actions, bookings, payments, and feature usage  
✅ **Real-time Alerting** - Webhook notifications for critical issues  
✅ **Enhanced Error Boundaries** - Client-side error reporting with context  
✅ **Monitoring Dashboard** - Real-time system health and metrics visualization  
✅ **Structured Logging** - Integration with existing Winston-based logging  

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side    │    │   External      │
│                 │    │                  │    │                 │
│ • Error Boundary│    │ • API Middleware │    │ • Sentry        │
│ • User Actions  │    │ • Business Logic │    │ • Webhooks      │
│ • Performance   │────┼─ • Database Ops  │────┼─ • Slack        │
│ • Metrics       │    │ • Health Checks  │    │ • Email         │
│                 │    │ • Alert System   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Installation & Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Monitoring & Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@your-org.ingest.sentry.io/your-project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=cabo-fit-pass
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Logging
LOG_LEVEL=info

# Alerting & Notifications
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_EMAIL=alerts@cabo-fit-pass.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 2. Dependencies

The monitoring system uses the following packages (already installed):

```json
{
  "@sentry/nextjs": "^10.6.0",
  "@sentry/profiling-node": "^10.6.0",
  "winston": "^3.17.0"
}
```

### 3. Configuration Files

The system includes these configuration files:
- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration  
- `sentry.edge.config.ts` - Edge runtime configuration
- `next.config.mjs` - Updated with Sentry webpack plugin

### 4. Initialization

The monitoring system auto-initializes in production. For development:

```typescript
import { initializeMonitoringSystem } from '@/lib/monitoring'

// In your app startup
initializeMonitoringSystem()
```

## Usage Guide

### API Route Monitoring

Wrap your API handlers with comprehensive monitoring:

```typescript
import { monitorApi } from '@/lib/monitoring'

export const GET = monitorApi(
  async (request: NextRequest) => {
    // Your handler logic
    const users = await getUsers()
    return NextResponse.json({ users })
  },
  { 
    component: 'users-api', 
    operation: 'get-users',
    trackMetrics: true 
  }
)
```

### Business Operations Monitoring

Track business-critical operations:

```typescript
import { monitorBusiness } from '@/lib/monitoring'

async function createBooking(userId: string, classId: string) {
  return monitorBusiness(
    async () => {
      // Booking creation logic
      const booking = await supabase
        .from('bookings')
        .insert({ user_id: userId, class_id: classId })
      
      return booking
    },
    {
      component: 'booking-service',
      action: 'create-booking',
      userId,
      metadata: { classId }
    }
  )
}
```

### Database Operations Monitoring

Track database performance and errors:

```typescript
import { monitorDatabase } from '@/lib/monitoring'

async function getUsers() {
  return monitorDatabase(
    () => supabase.from('users').select('*'),
    {
      component: 'user-service',
      operation: 'SELECT',
      table: 'users'
    }
  )
}
```

### Payment Operations Monitoring

Monitor payment processing with enhanced security:

```typescript
import { monitorPayment } from '@/lib/monitoring'

async function processPayment(amount: number, currency: string) {
  return monitorPayment(
    async () => {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
      })
      return paymentIntent
    },
    {
      component: 'payment-service',
      operation: 'create-payment-intent',
      amount,
      currency
    }
  )
}
```

### Error Boundary Usage

Wrap components with enhanced error boundaries:

```typescript
import { FeatureErrorBoundary } from '@/lib/monitoring'

export default function BookingPage() {
  return (
    <FeatureErrorBoundary feature="booking">
      <BookingComponent />
    </FeatureErrorBoundary>
  )
}
```

### Business Metrics Tracking

Track key business events:

```typescript
import { businessMetrics } from '@/lib/monitoring'

// User registration
businessMetrics.trackUser('registration', {
  userId: 'user_123',
  email: 'user@example.com',
  tier: 'premium'
})

// Booking creation
businessMetrics.trackBooking('created', {
  bookingId: 'booking_456',
  userId: 'user_123',
  classId: 'class_789',
  studioId: 'studio_101',
  creditsCost: 1
})

// Payment completion
businessMetrics.trackPayment('completed', {
  paymentId: 'payment_789',
  userId: 'user_123',
  amount: 5000, // cents
  currency: 'usd',
  paymentMethod: 'stripe',
  type: 'topup',
  creditsGranted: 25,
  status: 'successful'
})
```

## Monitoring Dashboard

Access the monitoring dashboard at `/admin/monitoring` (admin users only).

The dashboard provides:
- System health overview
- Real-time metrics
- Active alerts
- Performance charts
- Business metrics summary

### Dashboard Features

- **System Health**: Overall status and component health
- **Key Metrics**: Response times, memory usage, active users
- **Active Alerts**: Real-time alert notifications
- **Performance Data**: API endpoint performance statistics  
- **Business Metrics**: User registrations, bookings, payments
- **Auto-refresh**: Updates every 30 seconds

## Alert System

### Default Alert Rules

The system includes pre-configured alerts for:

- **High Error Rate**: >5% API error rate (Warning), >15% (Critical)
- **Slow Responses**: >2 second average response time
- **High Memory**: >85% memory usage
- **Payment Failures**: >10% payment failure rate
- **Database Errors**: Connection failures or query timeouts

### Creating Custom Alerts

```typescript
import { alertManager } from '@/lib/monitoring'

alertManager.addRule({
  id: 'custom_metric_alert',
  name: 'Custom Metric Alert',
  condition: (metrics) => metrics.custom_metric?.value > 100,
  level: 'warning',
  component: 'custom-service',
  description: 'Custom metric exceeded threshold',
  cooldownMinutes: 15,
  enabled: true
})
```

### Notification Channels

Alerts are sent to configured channels:
- **Webhook**: General monitoring notifications
- **Slack**: Critical alerts with rich formatting
- **Email**: Critical alerts only

## API Endpoints

### Monitoring APIs

- `GET /api/monitoring/alerts` - Get active alerts
- `POST /api/monitoring/alerts` - Create alert
- `PATCH /api/monitoring/alerts?alertId=X` - Resolve alert
- `GET /api/monitoring/metrics` - Get performance metrics
- `POST /api/monitoring/metrics` - Update metrics

### Health Check APIs

- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Kubernetes readiness probe  
- `GET /api/health/live` - Kubernetes liveness probe

## Performance Impact

The monitoring system is designed for minimal performance impact:

- **Client-side**: ~1-2ms overhead per monitored operation
- **Server-side**: ~0.5-1ms overhead per API request  
- **Memory**: <10MB additional memory usage
- **Network**: Minimal - async batch reporting to Sentry

## Security Considerations

- **Data Sanitization**: Automatically removes sensitive data (passwords, tokens, PII)
- **Rate Limiting**: Built-in rate limits for monitoring endpoints
- **Authentication**: Admin-only access to monitoring dashboard
- **IP Filtering**: Configurable IP allowlists for monitoring endpoints

## Configuration

### Environment-Specific Settings

```typescript
// Production
{
  sentry: { tracesSampleRate: 0.1 },
  logging: { level: 'info' },
  alerts: { evaluationIntervalMs: 30000 }
}

// Development  
{
  sentry: { tracesSampleRate: 1.0 },
  logging: { level: 'debug' },
  dashboard: { refreshIntervalMs: 10000 }
}

// Testing
{
  enabled: false, // Disable monitoring in tests
  sentry: { enabled: false }
}
```

### Feature Flags

```typescript
export const featureFlags = {
  sentryIntegration: true,
  performanceMonitoring: true,
  businessMetrics: true,
  alerting: true,
  dashboard: true,
  healthChecks: true,
  errorBoundaries: true,
  clientSideTracking: true,
}
```

## Troubleshooting

### Common Issues

1. **Sentry Not Working**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   - Check Sentry project configuration
   - Ensure source maps are uploaded in production

2. **Alerts Not Firing**
   - Check alert rules are enabled
   - Verify webhook URLs are accessible
   - Check cooldown periods

3. **Dashboard Not Loading**
   - Verify admin authentication
   - Check monitoring API endpoints are accessible
   - Check browser console for JavaScript errors

4. **High Memory Usage**
   - Check metrics buffer size (`maxBufferSize`)
   - Verify metrics are being flushed regularly
   - Monitor for memory leaks in custom code

### Debug Mode

Enable debug logging in development:

```bash
LOG_LEVEL=debug npm run dev
```

### Development Utilities

```typescript
import { devUtils } from '@/lib/monitoring'

// Trigger test alert
await devUtils.triggerTestAlert()

// Get monitoring statistics  
const stats = devUtils.getStats()

// Reset metrics
devUtils.resetMetrics()
```

## Best Practices

### DO ✅

- Use monitoring wrappers for all API routes
- Track business-critical operations
- Set up alerts for key metrics
- Monitor database performance
- Use error boundaries in React components
- Regularly review monitoring dashboard
- Set up proper notification channels

### DON'T ❌

- Log sensitive user data (passwords, tokens)
- Set up too many alerts (alert fatigue)  
- Ignore alert cooldown periods
- Skip monitoring for critical operations
- Disable monitoring in production
- Forget to test alert notifications

## Migration from Existing Logging

The monitoring system integrates seamlessly with the existing Winston logging:

```typescript
// Before
import { createComponentLogger } from '@/lib/logger'
const logger = createComponentLogger('api')
logger.info('Operation completed')

// After  
import { createMonitoringLogger } from '@/lib/monitoring'
const logger = createMonitoringLogger('api')
logger.info('Operation completed') // Now includes Sentry integration
```

## Future Enhancements

- [ ] Real-time dashboard updates via WebSocket
- [ ] Custom metrics export (Prometheus format)
- [ ] Log aggregation and search
- [ ] Distributed tracing
- [ ] Machine learning-based anomaly detection
- [ ] Integration with AWS CloudWatch/DataDog
- [ ] Mobile app performance monitoring
- [ ] Advanced business intelligence dashboards

## Support

For monitoring system issues:
1. Check the troubleshooting section above
2. Review logs in `/logs/` directory
3. Check Sentry dashboard for errors
4. Review monitoring dashboard for system health
5. Contact development team with specific error details

---

**Note**: The monitoring system is production-ready and actively monitors all critical application components. Regular review of alerts and metrics is recommended to maintain optimal system health.