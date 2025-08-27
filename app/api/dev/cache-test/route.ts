import { NextRequest, NextResponse } from 'next/server'
import { cacheManager, CACHE_TTL } from '@/lib/cache'
import { invalidateCache } from '@/lib/cache'
import { createComponentLogger } from '@/lib/logger'

const logger = createComponentLogger('cache-test')

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'test'
    const key = url.searchParams.get('key') || 'test:key'
    const value = url.searchParams.get('value') || 'test-value'
    const ttl = parseInt(url.searchParams.get('ttl') || '300')

    logger.info('Cache test requested', {
      action: 'cache-test',
      metadata: { action, key, value, ttl }
    })

    let result: any = {}

    switch (action) {
      case 'set':
        const setSuccess = await cacheManager.set(key, { data: value, timestamp: Date.now() }, { ttl })
        result = { 
          action: 'set',
          key, 
          value, 
          ttl,
          success: setSuccess 
        }
        break

      case 'get':
        const cachedValue = await cacheManager.get(key)
        result = { 
          action: 'get',
          key,
          found: cachedValue !== null,
          value: cachedValue 
        }
        break

      case 'delete':
        const deleteSuccess = await cacheManager.del(key)
        result = { 
          action: 'delete',
          key,
          success: deleteSuccess 
        }
        break

      case 'invalidate-pattern':
        const pattern = url.searchParams.get('pattern') || 'test:*'
        const deletedCount = await cacheManager.invalidateByPattern(pattern)
        result = { 
          action: 'invalidate-pattern',
          pattern,
          deletedCount 
        }
        break

      case 'invalidate-entity':
        const entity = url.searchParams.get('entity') || 'user'
        const ids = url.searchParams.get('ids')?.split(',') || []
        const deletedEntityCount = await cacheManager.invalidateEntity(entity, ids)
        result = { 
          action: 'invalidate-entity',
          entity,
          ids,
          deletedCount: deletedEntityCount 
        }
        break

      case 'stats':
        const stats = await cacheManager.getStats()
        result = { 
          action: 'stats',
          stats 
        }
        break

      case 'test-sequence':
        // Complete test sequence
        const testKey = 'test:sequence:' + Date.now()
        const testData = { message: 'Hello Redis!', timestamp: Date.now() }
        
        // 1. Set value
        await cacheManager.set(testKey, testData, { ttl: 60 })
        
        // 2. Get value
        const retrieved = await cacheManager.get(testKey)
        
        // 3. Check if it matches
        const matches = JSON.stringify(retrieved) === JSON.stringify(testData)
        
        // 4. Delete value
        const deleted = await cacheManager.del(testKey)
        
        // 5. Try to get deleted value
        const afterDelete = await cacheManager.get(testKey)
        
        result = {
          action: 'test-sequence',
          steps: {
            '1_set': 'success',
            '2_get': retrieved !== null ? 'success' : 'failed',
            '3_matches': matches ? 'success' : 'failed',
            '4_delete': deleted ? 'success' : 'failed',
            '5_after_delete': afterDelete === null ? 'success' : 'failed'
          },
          testData,
          retrieved,
          afterDelete,
          overallSuccess: matches && deleted && afterDelete === null
        }
        break

      default:
        // Default test - just set and get a simple value
        const defaultKey = 'cache-test:default'
        const defaultValue = { test: true, timestamp: Date.now() }
        
        await cacheManager.set(defaultKey, defaultValue, { ttl: CACHE_TTL.SHORT })
        const defaultRetrieved = await cacheManager.get(defaultKey)
        
        result = {
          action: 'default-test',
          set: defaultValue,
          retrieved: defaultRetrieved,
          success: defaultRetrieved !== null
        }
        break
    }

    const duration = Date.now() - startTime

    logger.info('Cache test completed', {
      action: 'cache-test',
      duration,
      statusCode: 200,
      metadata: { testAction: action, success: true }
    })

    return NextResponse.json({
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Cache test error', {
      action: 'cache-test',
      duration,
      statusCode: 500,
      errorCode: 'CACHE_TEST_FAILED'
    }, error instanceof Error ? error : new Error('Unknown error'))

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint for testing cache with request bodies
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { action = 'set', key = 'test:post:key', data, ttl = CACHE_TTL.MEDIUM } = body

    logger.info('Cache POST test requested', {
      action: 'cache-post-test',
      metadata: { action, key, dataType: typeof data }
    })

    let result: any = {}

    switch (action) {
      case 'set':
        const success = await cacheManager.set(key, data, { ttl })
        result = { action: 'set', key, success, ttl }
        break

      case 'get-or-set':
        const value = await cacheManager.getOrSet(
          key,
          async () => {
            // Simulate expensive operation
            await new Promise(resolve => setTimeout(resolve, 100))
            return { computed: true, timestamp: Date.now(), data }
          },
          { ttl }
        )
        result = { action: 'get-or-set', key, value, ttl }
        break

      default:
        throw new Error(`Unknown POST action: ${action}`)
    }

    const duration = Date.now() - startTime

    logger.info('Cache POST test completed', {
      action: 'cache-post-test',
      duration,
      statusCode: 200,
      metadata: { testAction: action }
    })

    return NextResponse.json({
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Cache POST test error', {
      action: 'cache-post-test',
      duration,
      statusCode: 500,
      errorCode: 'CACHE_POST_TEST_FAILED'
    }, error instanceof Error ? error : new Error('Unknown error'))

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}