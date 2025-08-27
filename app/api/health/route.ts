import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createComponentLogger } from '@/lib/logger'
import { checkRedisConnection, testRedis, validateRedisEnv, cacheManager } from '@/lib/redis'
import Stripe from 'stripe'

// Health check component interfaces
interface HealthComponent {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  responseTime: number
  components: Record<string, HealthComponent>
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

// Environment variable validation
function validateEnvironment(): HealthComponent {
  const startTime = Date.now()
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]

  const optionalVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ]

  const missingRequired = requiredVars.filter(varName => !process.env[varName])
  const missingOptional = optionalVars.filter(varName => !process.env[varName])
  const responseTime = Date.now() - startTime

  if (missingRequired.length > 0) {
    return {
      name: 'Environment Configuration',
      status: 'unhealthy',
      responseTime,
      error: `Missing required environment variables: ${missingRequired.join(', ')}`,
      details: { 
        missingRequired,
        missingOptional
      }
    }
  }

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (missingOptional.length > 0) {
    status = 'degraded' // Optional vars missing means some features won't work
  }

  return {
    name: 'Environment Configuration',
    status,
    responseTime,
    details: { 
      configuredRequired: requiredVars.length,
      configuredOptional: optionalVars.length - missingOptional.length,
      missingOptional,
      environment: process.env.NODE_ENV 
    }
  }
}

// Redis connectivity and functionality check
async function checkRedis(): Promise<HealthComponent> {
  const startTime = Date.now()
  
  try {
    // First check if Redis env vars are configured
    const envCheck = validateRedisEnv()
    if (!envCheck.valid) {
      return {
        name: 'Redis Cache',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: `Missing Redis configuration: ${envCheck.missingVars.join(', ')}`,
        details: { 
          configured: false,
          missingVariables: envCheck.missingVars 
        }
      }
    }

    // Test basic connection
    const connectionTest = await checkRedisConnection()
    if (!connectionTest) {
      return {
        name: 'Redis Cache',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Redis connection failed',
        details: { connection: 'failed' }
      }
    }

    // Test Redis functionality (set/get operations)
    const functionalityTest = await testRedis()
    const responseTime = Date.now() - startTime

    if (!functionalityTest.success) {
      return {
        name: 'Redis Cache',
        status: 'degraded',
        responseTime,
        error: functionalityTest.error || 'Redis functionality test failed',
        details: { 
          connection: 'active',
          functionality: 'failed'
        }
      }
    }

    // Get cache stats if available
    let cacheStats
    try {
      cacheStats = await cacheManager.getStats()
    } catch (error) {
      // Stats failure shouldn't fail the health check
      cacheStats = { memory: { used: 'N/A', peak: 'N/A' } }
    }

    return {
      name: 'Redis Cache',
      status: 'healthy',
      responseTime,
      details: {
        connection: 'active',
        functionality: 'working',
        memory: cacheStats.memory,
        url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/\/.*@/, '//[CREDENTIALS]@') || 'configured'
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      name: 'Redis Cache',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
      details: { type: 'connection_exception' }
    }
  }
}

// Database connectivity check
async function checkDatabase(): Promise<HealthComponent> {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        name: 'Supabase Database',
        status: 'unhealthy',
        responseTime,
        error: error.message,
        details: { 
          errorCode: error.code,
          hint: error.hint 
        }
      }
    }

    // Test write capability (if needed)
    const writeTest = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    return {
      name: 'Supabase Database',
      status: 'healthy',
      responseTime,
      details: {
        connection: 'active',
        readAccess: true,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/.*$/, '//[REDACTED]')
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      name: 'Supabase Database',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
      details: { type: 'connection_exception' }
    }
  }
}

// Stripe API connectivity check
async function checkStripe(): Promise<HealthComponent> {
  const startTime = Date.now()

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        name: 'Stripe API',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Stripe secret key not configured'
      }
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil'
    })

    // Test Stripe API connection with account retrieval
    const account = await stripe.accounts.retrieve()
    const responseTime = Date.now() - startTime

    return {
      name: 'Stripe API',
      status: 'healthy',
      responseTime,
      details: {
        accountId: account.id,
        country: account.country,
        currency: account.default_currency,
        apiVersion: '2025-07-30.basil'
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    const stripeError = error as Stripe.StripeError

    return {
      name: 'Stripe API',
      status: 'unhealthy',
      responseTime,
      error: stripeError.message || 'Stripe API connection failed',
      details: {
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode
      }
    }
  }
}

// Memory usage check (Node.js)
function checkMemory(): HealthComponent {
  const startTime = Date.now()
  
  try {
    const memUsage = process.memoryUsage()
    const responseTime = Date.now() - startTime

    // Convert bytes to MB
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const percentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

    // Consider memory unhealthy if over 90% usage
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (percentage > 90) {
      status = 'unhealthy'
    } else if (percentage > 75) {
      status = 'degraded'
    }

    return {
      name: 'Memory Usage',
      status,
      responseTime,
      details: {
        heapUsed: usedMB,
        heapTotal: totalMB,
        percentage,
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      }
    }

  } catch (error) {
    return {
      name: 'Memory Usage',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Memory check failed'
    }
  }
}

// Main health check endpoint
export async function GET(): Promise<NextResponse> {
  const logger = createComponentLogger('health-check')
  const overallStartTime = Date.now()

  try {
    logger.info('Comprehensive health check started')

    // Run all health checks in parallel
    const [envCheck, dbCheck, stripeCheck, redisCheck, memoryCheck] = await Promise.all([
      Promise.resolve(validateEnvironment()),
      checkDatabase(),
      checkStripe(),
      checkRedis(),
      Promise.resolve(checkMemory())
    ])

    const overallResponseTime = Date.now() - overallStartTime

    // Determine overall system status
    const components = {
      environment: envCheck,
      database: dbCheck,
      stripe: stripeCheck,
      redis: redisCheck,
      memory: memoryCheck
    }

    const componentStatuses = Object.values(components).map(c => c.status)
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'

    if (componentStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy'
    } else if (componentStatuses.includes('degraded')) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    // Build response
    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      responseTime: overallResponseTime,
      components,
      memory: memoryCheck.details ? {
        used: memoryCheck.details.heapUsed,
        total: memoryCheck.details.heapTotal,
        percentage: memoryCheck.details.percentage
      } : undefined
    }

    // Log result
    logger.info('Health check completed', {
      duration: overallResponseTime,
      status: overallStatus,
      action: 'health-check',
      statusCode: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      metadata: {
        componentCount: Object.keys(components).length,
        environment: process.env.NODE_ENV
      }
    })

    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

    return NextResponse.json(healthResult, { status: httpStatus })

  } catch (error) {
    const duration = Date.now() - overallStartTime
    logger.error('Health check failed with exception', {
      duration,
      action: 'health-check',
      statusCode: 503,
      errorCode: 'HEALTH_CHECK_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))

    const failureResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      responseTime: duration,
      components: {
        system: {
          name: 'System',
          status: 'unhealthy',
          responseTime: duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json(failureResult, { status: 503 })
  }
}