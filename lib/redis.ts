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
} as const

// Utility function to generate cache tags for invalidation
export function generateCacheTags(entity: string, ids: string[] = []): string[] {
  const tags = [`entity:${entity}`]
  ids.forEach(id => {
    tags.push(`${entity}:${id}`)
  })
  return tags
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