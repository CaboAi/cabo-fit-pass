import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createComponentLogger } from '@/lib/logger'
import Stripe from 'stripe'

// Readiness probe - checks if the application is ready to serve traffic
// This includes database connectivity and external service availability

interface ReadinessComponent {
  name: string
  status: 'ready' | 'not_ready'
  responseTime: number
  error?: string
  details?: Record<string, any>
}

interface ReadinessResult {
  status: 'ready' | 'not_ready'
  timestamp: string
  checks: Record<string, ReadinessComponent>
  responseTime: number
}

// Check if database is ready for queries
async function checkDatabaseReadiness(): Promise<ReadinessComponent> {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Test basic read operation
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        name: 'Database Connection',
        status: 'not_ready',
        responseTime,
        error: `Database query failed: ${error.message}`,
        details: { 
          errorCode: error.code,
          hint: error.hint 
        }
      }
    }

    // Test if we can access critical tables
    const { error: classError } = await supabase
      .from('classes')
      .select('id')
      .limit(1)

    if (classError) {
      return {
        name: 'Database Connection',
        status: 'not_ready',
        responseTime: Date.now() - startTime,
        error: `Critical table access failed: ${classError.message}`,
        details: { table: 'classes' }
      }
    }

    return {
      name: 'Database Connection',
      status: 'ready',
      responseTime,
      details: {
        connection: 'active',
        criticalTablesAccessible: true
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      name: 'Database Connection',
      status: 'not_ready',
      responseTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

// Check if Stripe integration is ready
async function checkStripeReadiness(): Promise<ReadinessComponent> {
  const startTime = Date.now()

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        name: 'Stripe Integration',
        status: 'not_ready',
        responseTime: Date.now() - startTime,
        error: 'Stripe secret key not configured'
      }
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil'
    })

    // Minimal Stripe API test - just verify API key works
    await stripe.accounts.retrieve()
    const responseTime = Date.now() - startTime

    return {
      name: 'Stripe Integration',
      status: 'ready',
      responseTime,
      details: {
        apiConnection: 'active',
        apiVersion: '2025-07-30.basil'
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    const stripeError = error as Stripe.StripeError

    return {
      name: 'Stripe Integration',
      status: 'not_ready',
      responseTime,
      error: stripeError.message || 'Stripe API not accessible',
      details: {
        type: stripeError.type,
        code: stripeError.code
      }
    }
  }
}

// Check essential environment configuration for readiness
function checkEnvironmentReadiness(): ReadinessComponent {
  const startTime = Date.now()
  
  // Essential variables required for the app to serve traffic
  const essentialVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY'
  ]

  const missingVars = essentialVars.filter(varName => !process.env[varName])
  const responseTime = Date.now() - startTime

  if (missingVars.length > 0) {
    return {
      name: 'Environment Configuration',
      status: 'not_ready',
      responseTime,
      error: `Missing essential environment variables: ${missingVars.join(', ')}`,
      details: { missingVariables: missingVars }
    }
  }

  return {
    name: 'Environment Configuration',
    status: 'ready',
    responseTime,
    details: { 
      essentialVariables: essentialVars.length,
      configured: true
    }
  }
}

export async function GET(): Promise<NextResponse> {
  const logger = createComponentLogger('readiness-check')
  const startTime = Date.now()

  try {
    logger.info('Readiness check started')

    // Run readiness checks in parallel
    const [envCheck, dbCheck, stripeCheck] = await Promise.all([
      Promise.resolve(checkEnvironmentReadiness()),
      checkDatabaseReadiness(),
      checkStripeReadiness()
    ])

    const responseTime = Date.now() - startTime

    const checks = {
      environment: envCheck,
      database: dbCheck,
      stripe: stripeCheck
    }

    // Application is ready only if ALL checks pass
    const allReady = Object.values(checks).every(check => check.status === 'ready')
    const overallStatus = allReady ? 'ready' : 'not_ready'

    const result: ReadinessResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      responseTime
    }

    logger.info('Readiness check completed', {
      duration: responseTime,
      status: overallStatus,
      action: 'readiness-check',
      statusCode: overallStatus === 'ready' ? 200 : 503,
      metadata: {
        checkCount: Object.keys(checks).length,
        readyChecks: Object.values(checks).filter(c => c.status === 'ready').length
      }
    })

    // Return 503 if not ready (Kubernetes will not send traffic)
    const httpStatus = overallStatus === 'ready' ? 200 : 503
    return NextResponse.json(result, { status: httpStatus })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Readiness check failed with exception', {
      duration,
      action: 'readiness-check',
      statusCode: 503,
      errorCode: 'READINESS_CHECK_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))

    const failureResult: ReadinessResult = {
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        system: {
          name: 'System',
          status: 'not_ready',
          responseTime: duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      responseTime: duration
    }

    return NextResponse.json(failureResult, { status: 503 })
  }
}