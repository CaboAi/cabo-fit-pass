import { Redis } from '@upstash/redis'
import { createComponentLogger } from './logger'

const logger = createComponentLogger('redis')

// Redis client configuration
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Health check function for Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping()
    logger.info('Redis connection check', {
      action: 'health-check',
      resource: 'redis',
      metadata: { result }
    })
    return result === 'PONG'
  } catch (error) {
    logger.error('Redis connection failed', {
      action: 'health-check',
      resource: 'redis',
      errorCode: 'REDIS_CONNECTION_FAILED'
    }, error instanceof Error ? error : new Error('Unknown Redis error'))
    return false
  }
}

// Test Redis functionality
export async function testRedis(): Promise<{ success: boolean; error?: string }> {
  try {
    const testKey = 'test:connection'
    const testValue = 'redis-working'
    
    // Set a test value
    await redis.set(testKey, testValue, { ex: 10 })
    
    // Get the test value
    const retrievedValue = await redis.get(testKey)
    
    if (retrievedValue === testValue) {
      logger.info('Redis test successful', {
        action: 'test-redis',
        resource: 'redis',
        metadata: { status: 'success' }
      })
      return { success: true }
    } else {
      logger.warn('Redis test value mismatch', {
        action: 'test-redis',
        resource: 'redis',
        metadata: { expected: testValue, received: retrievedValue }
      })
      return { success: false, error: 'Value mismatch' }
    }
  } catch (error) {
    logger.error('Redis test failed', {
      action: 'test-redis',
      resource: 'redis',
      errorCode: 'REDIS_TEST_FAILED'
    }, error instanceof Error ? error : new Error('Unknown Redis error'))
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Redis key patterns for consistent naming
export const REDIS_KEYS = {
  // User data
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_CREDITS: (userId: string) => `user:credits:${userId}`,
  
  // Classes data
  CLASSES_LIST: 'classes:list',
  CLASS_DETAIL: (classId: string) => `class:detail:${classId}`,
  
  // Bookings
  USER_BOOKINGS: (userId: string) => `user:bookings:${userId}`,
  CLASS_BOOKINGS: (classId: string) => `class:bookings:${classId}`,
  
  // Performance-critical booking cache keys
  BOOKING_COUNT: (classId: string) => `booking:count:${classId}`,
  CLASS_CAPACITY: (classId: string) => `class:capacity:${classId}`,
  USER_BOOKING_CHECK: (userId: string, classId: string) => `booking:check:${userId}:${classId}`,
  
  // Studios
  STUDIOS_LIST: 'studios:list',
  STUDIO_DETAIL: (studioId: string) => `studio:detail:${studioId}`,
  STUDIO_CLASSES: (studioId: string) => `studio:classes:${studioId}`,
  
  // Analytics and metrics
  METRICS_DAILY: (date: string) => `metrics:daily:${date}`,
  METRICS_HOURLY: (dateHour: string) => `metrics:hourly:${dateHour}`,
} as const

// Default TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 900,     // 15 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  
  // Performance-optimized TTLs for booking operations
  BOOKING_COUNT: 30,    // 30 seconds - booking counts change frequently
  CLASS_DATA: 300,      // 5 minutes - class info changes infrequently  
  USER_PROFILE: 600,    // 10 minutes - user profiles change rarely
  CAPACITY_CHECK: 15,   // 15 seconds - class capacity is critical
} as const

// Utility function to generate cache tags for invalidation
export function generateCacheTags(entity: string, ids: string[] = []): string[] {
  const tags = [`entity:${entity}`]
  ids.forEach(id => {
    tags.push(`${entity}:${id}`)
  })
  return tags
}

// High-performance caching utilities for booking operations
export const bookingCache = {
  // Cache booking count with automatic database fallback
  async getBookingCount(classId: string, fetchFn: () => Promise<number>): Promise<{ count: number; cached: boolean }> {
    const key = REDIS_KEYS.BOOKING_COUNT(classId)
    
    try {
      // Try cache first
      const cachedCount = await redis.get(key)
      if (cachedCount !== null) {
        logger.info('Booking count cache hit', {
          action: 'cache-hit',
          resource: 'booking-count',
          metadata: { classId, count: cachedCount }
        })
        return { count: Number(cachedCount), cached: true }
      }
      
      // Cache miss - fetch from database
      const count = await fetchFn()
      
      // Cache the result with short TTL
      await redis.set(key, count.toString(), { ex: CACHE_TTL.BOOKING_COUNT })
      
      logger.info('Booking count cached', {
        action: 'cache-set',
        resource: 'booking-count',
        metadata: { classId, count, ttl: CACHE_TTL.BOOKING_COUNT }
      })
      
      return { count, cached: false }
      
    } catch (error) {
      logger.warn('Booking count cache error, falling back to database', {
        action: 'cache-error',
        resource: 'booking-count',
        metadata: { classId }
      }, error instanceof Error ? error : new Error('Unknown cache error'))
      
      // Fallback to direct database call
      const count = await fetchFn()
      return { count, cached: false }
    }
  },
  
  // Cache class data for booking operations
  async getClassData<T>(classId: string, fetchFn: () => Promise<T>): Promise<{ data: T; cached: boolean }> {
    const key = REDIS_KEYS.CLASS_DETAIL(classId)
    
    try {
      // Try cache first
      const cachedData = await redis.get(key)
      if (cachedData !== null) {
        logger.info('Class data cache hit', {
          action: 'cache-hit',
          resource: 'class-data',
          metadata: { classId }
        })
        return { data: JSON.parse(cachedData), cached: true }
      }
      
      // Cache miss - fetch from database
      const data = await fetchFn()
      
      // Cache the result
      await redis.set(key, JSON.stringify(data), { ex: CACHE_TTL.CLASS_DATA })
      
      logger.info('Class data cached', {
        action: 'cache-set',
        resource: 'class-data',
        metadata: { classId, ttl: CACHE_TTL.CLASS_DATA }
      })
      
      return { data, cached: false }
      
    } catch (error) {
      logger.warn('Class data cache error, falling back to database', {
        action: 'cache-error',
        resource: 'class-data',
        metadata: { classId }
      }, error instanceof Error ? error : new Error('Unknown cache error'))
      
      // Fallback to direct database call
      const data = await fetchFn()
      return { data, cached: false }
    }
  },
  
  // Cache user profile for booking operations
  async getUserProfile<T>(userId: string, fetchFn: () => Promise<T>): Promise<{ profile: T; cached: boolean }> {
    const key = REDIS_KEYS.USER_PROFILE(userId)
    
    try {
      // Try cache first
      const cachedProfile = await redis.get(key)
      if (cachedProfile !== null) {
        logger.info('User profile cache hit', {
          action: 'cache-hit',
          resource: 'user-profile',
          metadata: { userId }
        })
        return { profile: JSON.parse(cachedProfile), cached: true }
      }
      
      // Cache miss - fetch from database
      const profile = await fetchFn()
      
      // Cache the result
      await redis.set(key, JSON.stringify(profile), { ex: CACHE_TTL.USER_PROFILE })
      
      logger.info('User profile cached', {
        action: 'cache-set',
        resource: 'user-profile',
        metadata: { userId, ttl: CACHE_TTL.USER_PROFILE }
      })
      
      return { profile, cached: false }
      
    } catch (error) {
      logger.warn('User profile cache error, falling back to database', {
        action: 'cache-error',
        resource: 'user-profile',
        metadata: { userId }
      }, error instanceof Error ? error : new Error('Unknown cache error'))
      
      // Fallback to direct database call
      const profile = await fetchFn()
      return { profile, cached: false }
    }
  },
  
  // Invalidate cache when bookings are created/updated
  async invalidateBookingCache(classId: string, userId?: string): Promise<void> {
    try {
      const keysToInvalidate = [
        REDIS_KEYS.BOOKING_COUNT(classId),
        REDIS_KEYS.CLASS_CAPACITY(classId),
        REDIS_KEYS.CLASS_BOOKINGS(classId)
      ]
      
      if (userId) {
        keysToInvalidate.push(
          REDIS_KEYS.USER_PROFILE(userId),
          REDIS_KEYS.USER_BOOKINGS(userId),
          REDIS_KEYS.USER_BOOKING_CHECK(userId, classId)
        )
      }
      
      // Delete all related cache keys
      await Promise.all(keysToInvalidate.map(key => redis.del(key)))
      
      logger.info('Booking cache invalidated', {
        action: 'cache-invalidate',
        resource: 'booking-cache',
        metadata: { classId, userId, keysInvalidated: keysToInvalidate.length }
      })
      
    } catch (error) {
      logger.error('Failed to invalidate booking cache', {
        action: 'cache-invalidate-error',
        resource: 'booking-cache',
        metadata: { classId, userId }
      }, error instanceof Error ? error : new Error('Unknown cache error'))
    }
  }
}

// Environment validation
export function validateRedisEnv(): { valid: boolean; missingVars: string[] } {
  const requiredVars = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  return {
    valid: missingVars.length === 0,
    missingVars
  }
}