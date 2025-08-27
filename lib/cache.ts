import { redis, REDIS_KEYS, CACHE_TTL, generateCacheTags } from './redis'
import { createComponentLogger } from './logger'

const logger = createComponentLogger('cache')

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  compress?: boolean
}

export interface CacheMetadata {
  cached_at: number
  ttl: number
  tags?: string[]
}

export interface CachedData<T> {
  data: T
  metadata: CacheMetadata
}

/**
 * Generic cache wrapper for any data
 */
export class CacheManager {
  /**
   * Get cached data with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now()
      const result = await redis.get(key)
      const duration = Date.now() - startTime
      
      if (result === null) {
        logger.info('Cache miss', {
          action: 'cache-get',
          resource: 'redis',
          metadata: { key, duration, result: 'miss' }
        })
        return null
      }
      
      logger.info('Cache hit', {
        action: 'cache-get',
        resource: 'redis',
        metadata: { key, duration, result: 'hit' }
      })
      
      // Handle both raw data and wrapped data formats
      if (typeof result === 'object' && result !== null && 'data' in result) {
        return (result as CachedData<T>).data
      }
      
      return result as T
    } catch (error) {
      logger.error('Cache get error', {
        action: 'cache-get',
        resource: 'redis',
        errorCode: 'CACHE_GET_FAILED',
        metadata: { key }
      }, error instanceof Error ? error : new Error('Cache get failed'))
      return null
    }
  }

  /**
   * Set cached data with optional TTL and tags
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const startTime = Date.now()
      const { ttl = CACHE_TTL.MEDIUM, tags = [] } = options
      
      const cachedData: CachedData<T> = {
        data,
        metadata: {
          cached_at: Date.now(),
          ttl,
          tags
        }
      }
      
      const result = await redis.set(key, cachedData, { ex: ttl })
      const duration = Date.now() - startTime
      
      logger.info('Cache set', {
        action: 'cache-set',
        resource: 'redis',
        metadata: { key, ttl, duration, tags }
      })
      
      return result === 'OK'
    } catch (error) {
      logger.error('Cache set error', {
        action: 'cache-set',
        resource: 'redis',
        errorCode: 'CACHE_SET_FAILED',
        metadata: { key }
      }, error instanceof Error ? error : new Error('Cache set failed'))
      return false
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key)
      
      logger.info('Cache delete', {
        action: 'cache-delete',
        resource: 'redis',
        metadata: { key, deleted: result > 0 }
      })
      
      return result > 0
    } catch (error) {
      logger.error('Cache delete error', {
        action: 'cache-delete',
        resource: 'redis',
        errorCode: 'CACHE_DELETE_FAILED',
        metadata: { key }
      }, error instanceof Error ? error : new Error('Cache delete failed'))
      return false
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }
    
    // Execute the function and cache the result
    const data = await fetchFn()
    await this.set(key, data, options)
    
    return data
  }

  /**
   * Invalidate cache by pattern or tags
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length === 0) {
        return 0
      }
      
      const result = await redis.del(...keys)
      
      logger.info('Cache invalidation by pattern', {
        action: 'cache-invalidate',
        resource: 'redis',
        metadata: { pattern, keysDeleted: result, totalKeys: keys.length }
      })
      
      return result
    } catch (error) {
      logger.error('Cache invalidation error', {
        action: 'cache-invalidate',
        resource: 'redis',
        errorCode: 'CACHE_INVALIDATION_FAILED',
        metadata: { pattern }
      }, error instanceof Error ? error : new Error('Cache invalidation failed'))
      return 0
    }
  }

  /**
   * Invalidate specific entity caches
   */
  async invalidateEntity(entity: string, ids: string[] = []): Promise<number> {
    const patterns = [`*entity:${entity}*`]
    
    if (ids.length > 0) {
      ids.forEach(id => {
        patterns.push(`*${entity}:${id}*`)
      })
    }
    
    let totalDeleted = 0
    for (const pattern of patterns) {
      totalDeleted += await this.invalidateByPattern(pattern)
    }
    
    return totalDeleted
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    info: any
    memory: { used: string; peak: string }
  }> {
    try {
      const info = await redis.info()
      const memory = {
        used: 'N/A',
        peak: 'N/A'
      }
      
      // Parse memory info from Redis INFO command
      if (typeof info === 'string') {
        const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
        const peakMatch = info.match(/used_memory_peak_human:([^\r\n]+)/)
        
        if (memoryMatch) memory.used = memoryMatch[1].trim()
        if (peakMatch) memory.peak = peakMatch[1].trim()
      }
      
      return { info, memory }
    } catch (error) {
      logger.error('Cache stats error', {
        action: 'cache-stats',
        resource: 'redis',
        errorCode: 'CACHE_STATS_FAILED'
      }, error instanceof Error ? error : new Error('Cache stats failed'))
      
      return {
        info: 'Unable to fetch Redis info',
        memory: { used: 'N/A', peak: 'N/A' }
      }
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager()

// Convenience functions for common cache patterns
export const cache = {
  // User-related caching
  user: {
    profile: (userId: string) => ({
      get: () => cacheManager.get(REDIS_KEYS.USER_PROFILE(userId)),
      set: (data: any, ttl = CACHE_TTL.LONG) => 
        cacheManager.set(REDIS_KEYS.USER_PROFILE(userId), data, { 
          ttl, 
          tags: generateCacheTags('user', [userId]) 
        }),
      invalidate: () => cacheManager.del(REDIS_KEYS.USER_PROFILE(userId))
    }),
    credits: (userId: string) => ({
      get: () => cacheManager.get(REDIS_KEYS.USER_CREDITS(userId)),
      set: (data: any, ttl = CACHE_TTL.MEDIUM) => 
        cacheManager.set(REDIS_KEYS.USER_CREDITS(userId), data, { 
          ttl, 
          tags: generateCacheTags('credits', [userId]) 
        }),
      invalidate: () => cacheManager.del(REDIS_KEYS.USER_CREDITS(userId))
    })
  },

  // Classes-related caching
  classes: {
    list: () => ({
      get: () => cacheManager.get(REDIS_KEYS.CLASSES_LIST),
      set: (data: any, ttl = CACHE_TTL.MEDIUM) => 
        cacheManager.set(REDIS_KEYS.CLASSES_LIST, data, { 
          ttl, 
          tags: generateCacheTags('classes') 
        }),
      invalidate: () => cacheManager.del(REDIS_KEYS.CLASSES_LIST)
    }),
    detail: (classId: string) => ({
      get: () => cacheManager.get(REDIS_KEYS.CLASS_DETAIL(classId)),
      set: (data: any, ttl = CACHE_TTL.MEDIUM) => 
        cacheManager.set(REDIS_KEYS.CLASS_DETAIL(classId), data, { 
          ttl, 
          tags: generateCacheTags('class', [classId]) 
        }),
      invalidate: () => cacheManager.del(REDIS_KEYS.CLASS_DETAIL(classId))
    })
  },

  // Studios-related caching
  studios: {
    list: () => ({
      get: () => cacheManager.get(REDIS_KEYS.STUDIOS_LIST),
      set: (data: any, ttl = CACHE_TTL.LONG) => 
        cacheManager.set(REDIS_KEYS.STUDIOS_LIST, data, { 
          ttl, 
          tags: generateCacheTags('studios') 
        }),
      invalidate: () => cacheManager.del(REDIS_KEYS.STUDIOS_LIST)
    })
  }
}

// Cache invalidation helpers
export const invalidateCache = {
  user: (userId: string) => cacheManager.invalidateEntity('user', [userId]),
  classes: () => cacheManager.invalidateEntity('classes'),
  class: (classId: string) => cacheManager.invalidateEntity('class', [classId]),
  studios: () => cacheManager.invalidateEntity('studios'),
  studio: (studioId: string) => cacheManager.invalidateEntity('studio', [studioId]),
  all: () => cacheManager.invalidateByPattern('*')
}

// Cache warming functions
export const warmCache = {
  async classes() {
    logger.info('Starting cache warming for classes', {
      action: 'cache-warm',
      resource: 'classes'
    })
    // This would be called during app startup or scheduled intervals
    // Implementation depends on specific business needs
  }
}