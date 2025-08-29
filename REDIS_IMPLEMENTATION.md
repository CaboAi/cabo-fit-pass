# Redis Caching & Rate Limiting Implementation

## Overview
Complete implementation of Redis caching layer and rate limiting for Cabo Fit Pass using Upstash Redis (serverless Redis perfect for Vercel).

## 🚀 Features Implemented

### 1. Redis Client Configuration
- **File**: `lib/redis.ts`
- Upstash Redis client setup
- Connection health checks
- Environment validation
- Key naming patterns for consistency
- TTL constants for different data types

### 2. Cache Management System
- **File**: `lib/cache.ts`
- Comprehensive caching utilities
- Cache-aside pattern implementation
- Automatic JSON serialization/deserialization
- Cache invalidation strategies
- Performance metrics and logging
- Convenience functions for common operations

### 3. Rate Limiting Middleware
- **File**: `lib/rate-limit.ts`
- Multi-tier rate limiting (Anonymous, Authenticated, Premium, Admin)
- Endpoint categorization (Public, API General, API Sensitive, Auth, Booking)
- IP and user-based identification
- Sliding window algorithm
- Configurable limits per user type and endpoint
- Comprehensive logging and analytics

### 4. Updated Middleware
- **File**: `middleware.ts`
- Composite middleware combining i18n and rate limiting
- Route-specific application
- Preserves existing internationalization functionality

### 5. API Route Enhancements
Enhanced the following API routes with caching:

#### Classes API (`/api/classes`)
- Cache class listings with 15-minute TTL
- Automatic cache-aside pattern
- Demo data caching with shorter TTL
- Cache hit/miss logging

#### Profile API (`/api/profile`)
- User profile caching with 1-hour TTL
- Cache invalidation on profile updates
- Separate caching for GET and PUT operations
- User-specific cache keys

#### Credits API (`/api/credits`)
- Credit balance caching with 15-minute TTL
- Cache invalidation on credit updates
- Both GET and POST operations enhanced
- User-specific credit tracking

#### Booking Creation (`/api/bookings/create`)
- Cache invalidation after successful bookings
- Multi-entity invalidation (user, class, classes list)
- Ensures data consistency across related entities

#### Booking Cancellation (`/api/bookings/[id]/cancel`)
- Cache invalidation after cancellations
- Credit and class availability updates
- Comprehensive error handling and logging

### 6. Health Check Integration
- **File**: `app/api/health/route.ts`
- Redis connectivity testing
- Functionality verification (set/get operations)
- Cache statistics monitoring
- Environment validation
- Graceful degradation when Redis unavailable

### 7. Development Testing Tools
- **File**: `app/api/dev/cache-test/route.ts`
- Comprehensive cache testing endpoint
- Multiple test scenarios (set, get, delete, invalidate)
- Test sequence validation
- Performance metrics
- Development and debugging support

## 📋 Environment Variables

Add these to your `.env` file:

```bash
# Redis Cache & Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## 🎯 Rate Limiting Configuration

### User Tiers & Limits

| User Type | General API | Sensitive API | Booking API | Auth API |
|-----------|-------------|---------------|-------------|----------|
| Anonymous | 20/min      | 5/min         | N/A         | 10/15min |
| Authenticated | 100/min | 30/min        | 10/5min     | N/A      |
| Premium   | 200/min     | 60/min        | 20/5min     | N/A      |
| Admin     | 500/min     | 100/min       | N/A         | N/A      |

### Endpoint Categories
- **Public**: No rate limiting (static content)
- **API General**: Standard API endpoints
- **API Sensitive**: Payment, profile, critical operations
- **Auth**: Authentication endpoints
- **Booking**: Booking creation/management
- **Admin**: Administrative operations

## 🗄️ Caching Strategies

### Cache Keys Pattern
```typescript
USER_PROFILE: (userId: string) => `user:profile:${userId}`
USER_CREDITS: (userId: string) => `user:credits:${userId}`
CLASSES_LIST: 'classes:list'
CLASS_DETAIL: (classId: string) => `class:detail:${classId}`
```

### TTL Configuration
- **SHORT**: 5 minutes (demo data, temporary data)
- **MEDIUM**: 15 minutes (frequently changing data)
- **LONG**: 1 hour (relatively stable data)
- **VERY_LONG**: 24 hours (very stable data)

### Cache Invalidation
Automatic cache invalidation on:
- User profile updates
- Credit balance changes
- Booking creation/cancellation
- Class availability changes

## 🚦 Usage Examples

### Basic Caching
```typescript
import { cache, CACHE_TTL } from '@/lib/cache'

// Get cached data
const classes = await cache.classes.list().get()

// Set cached data
await cache.classes.list().set(classData, CACHE_TTL.MEDIUM)

// Invalidate cache
await cache.classes.list().invalidate()
```

### Advanced Caching
```typescript
import { cacheManager, invalidateCache } from '@/lib/cache'

// Get or set pattern
const data = await cacheManager.getOrSet(
  'expensive:operation',
  async () => await expensiveOperation(),
  { ttl: CACHE_TTL.LONG }
)

// Invalidate by entity
await invalidateCache.user(userId)
await invalidateCache.classes()
```

### Rate Limiting Check
```typescript
import { checkRateLimit, ENDPOINT_CATEGORIES } from '@/lib/rate-limit'

const status = await checkRateLimit(userId, ENDPOINT_CATEGORIES.API_SENSITIVE)
console.log(`Remaining requests: ${status.remaining}`)
```

## 🧪 Testing

### Health Check
```bash
GET /api/health
```
Returns comprehensive system health including Redis status.

### Cache Testing
```bash
# Test basic set/get
GET /api/dev/cache-test?action=set&key=test&value=hello

# Test cache retrieval
GET /api/dev/cache-test?action=get&key=test

# Test complete sequence
GET /api/dev/cache-test?action=test-sequence

# Test cache invalidation
GET /api/dev/cache-test?action=invalidate-pattern&pattern=user:*
```

### Rate Limiting Testing
Make rapid requests to any API endpoint to test rate limiting:
```bash
curl -H "Authorization: Bearer TOKEN" /api/classes
```

## 📊 Monitoring & Observability

### Structured Logging
All cache and rate limiting operations include structured logs:
- Performance metrics (duration, hit/miss rates)
- Error tracking and debugging information
- User context and operation metadata
- Cache statistics and memory usage

### Health Monitoring
- Redis connectivity monitoring
- Cache performance metrics
- Rate limiting analytics
- Memory usage tracking

## 🔧 Production Considerations

### Upstash Redis Setup
1. Create Upstash Redis database
2. Configure environment variables
3. Test connectivity with health endpoint
4. Monitor cache hit rates and performance

### Performance Optimization
- Cache warming strategies implemented
- Efficient key patterns for fast lookups
- Automatic cache invalidation to prevent stale data
- Performance logging for monitoring

### Error Handling
- Graceful degradation when Redis unavailable
- Fallback to database operations
- Comprehensive error logging
- User-friendly error responses

## 🔄 Cache Invalidation Strategy

### Automatic Invalidation
- **User Operations**: Profile updates, credit changes
- **Booking Operations**: Creation, cancellation, attendance
- **Class Operations**: Updates, capacity changes
- **System Operations**: Data imports, admin changes

### Manual Invalidation
```typescript
import { invalidateCache } from '@/lib/cache'

// Invalidate specific user data
await invalidateCache.user(userId)

// Invalidate all classes
await invalidateCache.classes()

// Invalidate everything (use sparingly)
await invalidateCache.all()
```

## 📈 Performance Impact

### Expected Improvements
- **API Response Time**: 60-80% reduction for cached data
- **Database Load**: 40-60% reduction in queries
- **User Experience**: Faster page loads and interactions
- **Scalability**: Better handling of traffic spikes

### Monitoring Metrics
- Cache hit/miss ratios
- API response times
- Rate limiting statistics
- Memory usage and optimization

## 🛡️ Security Features

### Rate Limiting Security
- Prevents API abuse and DDoS attacks
- User-specific and IP-based limiting
- Different limits for different user tiers
- Comprehensive request tracking

### Cache Security
- User-specific cache keys prevent data leakage
- Automatic cache expiration
- Secure Redis connection with authentication
- No sensitive data exposure in cache keys

---

## Next Steps

1. **Deploy to Vercel**: Configure Upstash Redis environment variables
2. **Monitor Performance**: Track cache hit rates and API response times
3. **Fine-tune TTL**: Adjust cache durations based on usage patterns
4. **Scale Rate Limits**: Adjust limits based on user feedback and load testing

The implementation is production-ready and follows best practices for serverless caching and rate limiting with Next.js 14 and Vercel deployment.