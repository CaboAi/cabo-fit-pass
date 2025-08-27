import { NextResponse } from 'next/server'
import { createComponentLogger } from '@/lib/logger'

// Liveness probe - checks if the application process is alive and responsive
// This should be lightweight and focus on internal application health
// If this fails, the application should be restarted

interface LivenessComponent {
  name: string
  status: 'alive' | 'dead'
  responseTime: number
  error?: string
  details?: Record<string, any>
}

interface LivenessResult {
  status: 'alive' | 'dead'
  timestamp: string
  checks: Record<string, LivenessComponent>
  responseTime: number
  uptime: number
  pid: number
}

// Check if the Node.js process is healthy
function checkProcessHealth(): LivenessComponent {
  const startTime = Date.now()
  
  try {
    const memUsage = process.memoryUsage()
    const responseTime = Date.now() - startTime
    
    // Check for memory leaks (very high memory usage)
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const maxReasonableMemory = 1024 // 1GB in MB
    
    if (heapUsedMB > maxReasonableMemory) {
      return {
        name: 'Process Health',
        status: 'dead',
        responseTime,
        error: `Memory usage too high: ${heapUsedMB}MB (max: ${maxReasonableMemory}MB)`,
        details: {
          heapUsedMB,
          maxAllowed: maxReasonableMemory,
          rss: Math.round(memUsage.rss / 1024 / 1024)
        }
      }
    }
    
    return {
      name: 'Process Health',
      status: 'alive',
      responseTime,
      details: {
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        memoryUsageMB: heapUsedMB,
        nodeVersion: process.version
      }
    }
  } catch (error) {
    return {
      name: 'Process Health',
      status: 'dead',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Process health check failed'
    }
  }
}

// Check if the application can respond to HTTP requests
function checkHTTPResponsiveness(): LivenessComponent {
  const startTime = Date.now()
  
  try {
    // If we got here, HTTP stack is working
    const responseTime = Date.now() - startTime
    
    return {
      name: 'HTTP Responsiveness',
      status: 'alive',
      responseTime,
      details: {
        httpStackWorking: true,
        canProcessRequests: true
      }
    }
  } catch (error) {
    return {
      name: 'HTTP Responsiveness',
      status: 'dead',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'HTTP responsiveness check failed'
    }
  }
}

// Check if critical application components are functioning
function checkApplicationCore(): LivenessComponent {
  const startTime = Date.now()
  
  try {
    // Test basic JavaScript operations
    const testObj = { test: 'value' }
    const testArray = [1, 2, 3]
    const testJson = JSON.stringify(testObj)
    JSON.parse(testJson)
    
    // Test Date operations
    new Date().toISOString()
    
    // Test basic string operations
    'test'.toUpperCase()
    
    // Test math operations
    Math.random()
    
    const responseTime = Date.now() - startTime
    
    return {
      name: 'Application Core',
      status: 'alive',
      responseTime,
      details: {
        jsEngine: 'functional',
        dateOperations: 'functional',
        jsonOperations: 'functional',
        mathOperations: 'functional'
      }
    }
  } catch (error) {
    return {
      name: 'Application Core',
      status: 'dead',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Application core check failed'
    }
  }
}

// Check logger functionality (critical for debugging)
function checkLogger(): LivenessComponent {
  const startTime = Date.now()
  
  try {
    const testLogger = createComponentLogger('liveness-test')
    
    // Test if logger can be created and basic operations work
    if (!testLogger || typeof testLogger.info !== 'function') {
      return {
        name: 'Logger System',
        status: 'dead',
        responseTime: Date.now() - startTime,
        error: 'Logger system not functional'
      }
    }
    
    const responseTime = Date.now() - startTime
    
    return {
      name: 'Logger System',
      status: 'alive',
      responseTime,
      details: {
        loggerCreated: true,
        functionsAvailable: ['info', 'error', 'warn', 'debug'].every(
          fn => typeof testLogger[fn as keyof typeof testLogger] === 'function'
        )
      }
    }
  } catch (error) {
    return {
      name: 'Logger System',
      status: 'dead',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Logger check failed'
    }
  }
}

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Create logger without try/catch to test if logger itself is working
    const logger = createComponentLogger('liveness-check')
    logger.info('Liveness check started')

    // Run lightweight liveness checks
    const processCheck = checkProcessHealth()
    const httpCheck = checkHTTPResponsiveness()
    const coreCheck = checkApplicationCore()
    const loggerCheck = checkLogger()

    const responseTime = Date.now() - startTime

    const checks = {
      process: processCheck,
      http: httpCheck,
      core: coreCheck,
      logger: loggerCheck
    }

    // Application is alive only if ALL liveness checks pass
    const allAlive = Object.values(checks).every(check => check.status === 'alive')
    const overallStatus = allAlive ? 'alive' : 'dead'

    const result: LivenessResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      responseTime,
      uptime: Math.round(process.uptime()),
      pid: process.pid
    }

    logger.info('Liveness check completed', {
      duration: responseTime,
      status: overallStatus,
      action: 'liveness-check',
      statusCode: overallStatus === 'alive' ? 200 : 503,
      metadata: {
        checkCount: Object.keys(checks).length,
        aliveChecks: Object.values(checks).filter(c => c.status === 'alive').length,
        pid: process.pid,
        uptime: Math.round(process.uptime())
      }
    })

    // Return 503 if dead (Kubernetes will restart the pod)
    const httpStatus = overallStatus === 'alive' ? 200 : 503
    return NextResponse.json(result, { status: httpStatus })

  } catch (error) {
    // If we can't even create a logger or basic operations fail,
    // the application is definitely not alive
    const duration = Date.now() - startTime
    
    const failureResult: LivenessResult = {
      status: 'dead',
      timestamp: new Date().toISOString(),
      checks: {
        system: {
          name: 'System',
          status: 'dead',
          responseTime: duration,
          error: error instanceof Error ? error.message : 'Critical system failure'
        }
      },
      responseTime: duration,
      uptime: Math.round(process.uptime()),
      pid: process.pid
    }

    // Try to log the error, but don't fail if logging fails
    try {
      const fallbackLogger = createComponentLogger('liveness-check')
      fallbackLogger.error('Liveness check failed with critical exception', {
        duration,
        action: 'liveness-check',
        statusCode: 503,
        errorCode: 'LIVENESS_CHECK_CRITICAL_FAILURE'
      }, error instanceof Error ? error : new Error('Unknown error'))
    } catch {
      // If logging also fails, just continue with the response
    }

    return NextResponse.json(failureResult, { status: 503 })
  }
}