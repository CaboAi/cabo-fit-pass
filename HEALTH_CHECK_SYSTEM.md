# Health Check System Documentation

## Overview

The Cabo Fit Pass application now includes a comprehensive health monitoring system with three dedicated endpoints designed for different monitoring scenarios, particularly useful for container orchestration platforms like Kubernetes.

## Endpoints

### 1. Main Health Check - `/api/health`
**Purpose**: Comprehensive system health assessment with detailed component monitoring.

**HTTP Status Codes**:
- `200` - System is healthy or degraded but operational
- `503` - System is unhealthy and may need attention

**Response Format**:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-08-26T22:37:53.207Z",
  "version": "0.1.0",
  "environment": "development",
  "uptime": 175,
  "responseTime": 558,
  "components": {
    "environment": { /* Environment config check */ },
    "database": { /* Supabase connectivity */ },
    "stripe": { /* Stripe API connectivity */ },
    "memory": { /* Memory usage monitoring */ }
  },
  "memory": {
    "used": 134,
    "total": 140,
    "percentage": 96
  }
}
```

**Components Monitored**:
- **Environment Configuration**: Validates required environment variables
- **Supabase Database**: Tests database connectivity and table access
- **Stripe API**: Verifies Stripe integration and account access
- **Memory Usage**: Monitors heap memory consumption with thresholds

### 2. Readiness Probe - `/api/health/ready`
**Purpose**: Kubernetes readiness probe to determine if the application can serve traffic.

**HTTP Status Codes**:
- `200` - Application is ready to serve traffic
- `503` - Application is not ready (Kubernetes will not route traffic)

**Response Format**:
```json
{
  "status": "ready" | "not_ready",
  "timestamp": "2025-08-26T22:37:41.812Z",
  "checks": {
    "environment": { /* Essential env vars */ },
    "database": { /* DB connectivity */ },
    "stripe": { /* Stripe availability */ }
  },
  "responseTime": 565
}
```

**Readiness Criteria**:
- All essential environment variables are present
- Database connection is active and critical tables are accessible
- Stripe API is reachable and functional

### 3. Liveness Probe - `/api/health/live`
**Purpose**: Kubernetes liveness probe to determine if the application process should be restarted.

**HTTP Status Codes**:
- `200` - Application process is alive and functional
- `503` - Application is dead and should be restarted

**Response Format**:
```json
{
  "status": "alive" | "dead",
  "timestamp": "2025-08-26T22:37:33.672Z",
  "checks": {
    "process": { /* Node.js process health */ },
    "http": { /* HTTP stack responsiveness */ },
    "core": { /* JavaScript engine functionality */ },
    "logger": { /* Logging system status */ }
  },
  "responseTime": 0,
  "uptime": 155,
  "pid": 58912
}
```

**Liveness Criteria**:
- Node.js process is healthy (memory not exceeded)
- HTTP stack can process requests
- Core JavaScript operations are functional
- Logging system is operational

## Health Status Definitions

### Main Health Check Statuses
- **healthy**: All components are functioning normally
- **degraded**: Some components have issues but system is operational
- **unhealthy**: Critical components are failing, system needs attention

### Memory Usage Thresholds
- **healthy**: < 75% heap usage
- **degraded**: 75-90% heap usage  
- **unhealthy**: > 90% heap usage (triggers restart recommendation)

### Readiness vs Liveness
- **Readiness**: Focuses on external dependencies (database, APIs)
- **Liveness**: Focuses on internal application health (process, memory, core functions)

## Implementation Details

### Environment Variables Monitored
**Essential (Readiness)**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`

**Required (Health Check)**:
- All essential variables plus:
- `STRIPE_WEBHOOK_SECRET`

### Database Health Checks
- Basic connection test via profiles table query
- Critical table accessibility verification (classes table)
- Connection pooling and timeout handling

### Stripe Integration Monitoring
- API key validation
- Account retrieval test
- API version compatibility check
- Error categorization and reporting

### Response Time Monitoring
All endpoints include response time measurements for:
- Individual component checks
- Overall endpoint response time
- Performance trend analysis

## Usage Examples

### Kubernetes Configuration

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: cabo-fit-pass
    image: cabo-fit-pass:latest
    livenessProbe:
      httpGet:
        path: /api/health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /api/health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 2
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1
```

### Monitoring Integration

```bash
# Check overall system health
curl -f http://localhost:3000/api/health

# Monitor readiness for load balancer
curl -f http://localhost:3000/api/health/ready

# Basic liveness check
curl -f http://localhost:3000/api/health/live
```

## Logging Integration

All health checks integrate with the application's structured logging system:

- Successful checks log at INFO level
- Failed checks log at ERROR level
- Performance metrics included in log context
- Error categorization for debugging
- Request correlation for distributed tracing

## Security Considerations

- Sensitive data is redacted in responses (URLs, keys)
- Health endpoints don't require authentication (by design)
- Error messages provide debugging info without exposing internals
- Response times help identify potential DDoS or performance issues

## Troubleshooting

### Common Issues

1. **Database Not Ready**: Check Supabase credentials and network connectivity
2. **Stripe Unhealthy**: Verify API keys and account status
3. **High Memory Usage**: Monitor for memory leaks, consider scaling
4. **Environment Issues**: Verify all required environment variables are set

### Response Analysis

- Check `components` object for specific failure details
- Use `responseTime` to identify performance bottlenecks  
- Monitor `memory.percentage` for resource planning
- Review `error` messages for specific failure causes

## Performance Impact

- **Liveness**: < 5ms typical response time (lightweight checks)
- **Readiness**: 200-600ms typical (includes external API calls)
- **Health**: 500-1000ms typical (comprehensive checks)
- **Memory**: Minimal heap impact, short-lived objects only

## Future Enhancements

- Add Redis connectivity monitoring (when implemented)
- Include business metrics (active users, bookings)
- Add alerting thresholds configuration
- Implement health check result caching
- Add custom metrics export (Prometheus format)