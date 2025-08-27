/**
 * Structured Logging Examples for Cabo Fit Pass
 * 
 * This file demonstrates how to use the structured logging system
 * across different parts of the application.
 */

import { NextRequest } from 'next/server'
import { 
  logger, 
  createComponentLogger, 
  extractRequestContext, 
  extractUserContext 
} from './logger'

// ============================================================================
// EXAMPLE 1: Basic Logging in API Routes
// ============================================================================

export function exampleBasicApiRoute(request: NextRequest) {
  const routeLogger = createComponentLogger('api-example')
  const startTime = Date.now()
  
  try {
    // Log the start of the request
    routeLogger.info('API request started', {
      action: 'handle-request',
      ...extractRequestContext(request)
    })
    
    // Simulate some processing
    const result = processData()
    
    // Log success
    const duration = Date.now() - startTime
    routeLogger.info('API request completed successfully', {
      action: 'handle-request',
      duration,
      statusCode: 200,
      metadata: { recordsProcessed: result.count }
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    routeLogger.error('API request failed', {
      action: 'handle-request',
      duration,
      statusCode: 500,
      errorCode: 'PROCESSING_FAILED'
    }, error instanceof Error ? error : new Error('Unknown error'))
  }
}

// ============================================================================
// EXAMPLE 2: Database Operations Logging
// ============================================================================

export async function exampleDatabaseOperations(userId: string) {
  const dbLogger = createComponentLogger('database', { userId })
  
  try {
    // Log database query
    dbLogger.info('Starting database transaction', {
      action: 'start-transaction',
      resource: 'users'
    })
    
    const user = await findUserById(userId)
    dbLogger.dbOperation('SELECT', 'users', { recordId: userId })
    
    const updatedUser = await updateUser(userId, { last_login: new Date() })
    dbLogger.dbOperation('UPDATE', 'users', { recordId: userId })
    
    dbLogger.info('Database transaction completed', {
      action: 'commit-transaction',
      resource: 'users',
      metadata: { userId, operationsCount: 2 }
    })
    
  } catch (error) {
    dbLogger.dbOperation('ROLLBACK', 'users', { userId }, error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

// ============================================================================
// EXAMPLE 3: Authentication Events
// ============================================================================

export function exampleAuthenticationFlow(email: string, session: any) {
  const authLogger = createComponentLogger('auth')
  const userContext = extractUserContext(session)
  const requestLogger = authLogger.child(userContext)
  
  // Login attempt
  requestLogger.authEvent('login-attempt', session?.user?.id, {
    metadata: { email, provider: 'credentials' }
  })
  
  // Successful login
  requestLogger.authEvent('login-success', session.user.id, {
    metadata: { 
      email, 
      sessionId: session.sessionToken,
      lastLogin: new Date().toISOString() 
    }
  })
  
  // Failed login
  const loginError = new Error('Invalid credentials')
  requestLogger.authEvent('login-failed', undefined, {
    metadata: { email, reason: 'invalid_credentials' }
  }, loginError)
}

// ============================================================================
// EXAMPLE 4: Payment Processing
// ============================================================================

export function examplePaymentFlow(amount: number, currency: string, userId: string) {
  const paymentLogger = createComponentLogger('payments', { userId })
  
  // Payment initiated
  paymentLogger.paymentEvent('payment-initiated', amount, currency, {
    metadata: { 
      paymentMethod: 'stripe',
      customerId: userId 
    }
  })
  
  // Payment succeeded
  paymentLogger.paymentEvent('payment-succeeded', amount, currency, {
    metadata: { 
      transactionId: 'pi_1234567890',
      customerId: userId,
      processingTime: 2340 
    }
  })
  
  // Payment failed
  const paymentError = new Error('Card declined')
  paymentLogger.paymentEvent('payment-failed', amount, currency, {
    metadata: { 
      customerId: userId,
      declineReason: 'insufficient_funds' 
    }
  }, paymentError)
}

// ============================================================================
// EXAMPLE 5: Business Logic Logging
// ============================================================================

export function exampleBookingFlow(classId: string, userId: string) {
  const bookingLogger = createComponentLogger('bookings', { userId })
  
  // Start booking process
  bookingLogger.info('Booking process started', {
    action: 'start-booking',
    metadata: { classId, userId }
  })
  
  // Check class availability
  bookingLogger.info('Checking class availability', {
    action: 'check-availability',
    resource: 'classes',
    metadata: { classId }
  })
  
  // Check user credits
  bookingLogger.info('Checking user credits', {
    action: 'check-credits',
    resource: 'user_credits',
    metadata: { userId }
  })
  
  // Create booking
  bookingLogger.info('Creating booking record', {
    action: 'create-booking',
    resource: 'bookings',
    metadata: { classId, userId }
  })
  
  // Success
  bookingLogger.info('Booking completed successfully', {
    action: 'booking-complete',
    metadata: { 
      bookingId: 'booking_123',
      classId, 
      userId,
      creditsUsed: 1 
    }
  })
}

// ============================================================================
// EXAMPLE 6: Error Scenarios with Context
// ============================================================================

export function exampleErrorScenarios() {
  const logger = createComponentLogger('error-examples')
  
  // Validation error
  logger.warn('Invalid input data', {
    action: 'validate-input',
    errorCode: 'INVALID_EMAIL',
    metadata: { field: 'email', value: 'invalid-email' }
  })
  
  // Business logic error
  logger.error('Insufficient credits for booking', {
    action: 'validate-booking',
    errorCode: 'INSUFFICIENT_CREDITS',
    metadata: { 
      requiredCredits: 2, 
      availableCredits: 1,
      userId: 'user_123' 
    }
  }, new Error('User has insufficient credits'))
  
  // External service error
  logger.error('Stripe API call failed', {
    action: 'process-payment',
    errorCode: 'STRIPE_API_ERROR',
    metadata: { 
      stripeErrorCode: 'card_declined',
      amount: 5000,
      currency: 'usd' 
    }
  }, new Error('Your card was declined'))
  
  // System error
  logger.error('Database connection lost', {
    action: 'database-query',
    errorCode: 'DB_CONNECTION_LOST',
    resource: 'bookings',
    metadata: { 
      connectionPool: 'primary',
      activeConnections: 0 
    }
  }, new Error('Connection to database was lost'))
}

// ============================================================================
// EXAMPLE 7: Performance Monitoring
// ============================================================================

export function examplePerformanceMonitoring() {
  const perfLogger = createComponentLogger('performance')
  
  // Slow query detection
  const queryStart = Date.now()
  // ... execute query
  const queryDuration = Date.now() - queryStart
  
  if (queryDuration > 1000) {
    perfLogger.warn('Slow database query detected', {
      action: 'execute-query',
      duration: queryDuration,
      resource: 'complex_booking_query',
      metadata: { 
        threshold: 1000,
        queryType: 'SELECT',
        recordCount: 150 
      }
    })
  }
  
  // Memory usage tracking
  const memoryUsage = process.memoryUsage()
  perfLogger.info('Memory usage checkpoint', {
    action: 'memory-check',
    metadata: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    }
  })
}

// ============================================================================
// Helper functions (mock implementations)
// ============================================================================

function processData() {
  return { count: 42 }
}

async function findUserById(userId: string) {
  return { id: userId, email: 'user@example.com' }
}

async function updateUser(userId: string, data: any) {
  return { id: userId, ...data }
}

// ============================================================================
// LOGGING BEST PRACTICES SUMMARY
// ============================================================================

/**
 * BEST PRACTICES:
 * 
 * 1. **Use Component Loggers**: Create component-specific loggers for better organization
 *    const logger = createComponentLogger('auth')
 * 
 * 2. **Include Context**: Always add relevant context to log entries
 *    logger.info('User logged in', { userId, action: 'login', metadata: { provider: 'google' } })
 * 
 * 3. **Use Appropriate Log Levels**:
 *    - error: Errors that need immediate attention
 *    - warn: Warnings that should be monitored
 *    - info: General information about application flow
 *    - debug: Detailed information for debugging
 * 
 * 4. **Include Timing**: Track duration for performance monitoring
 *    const startTime = Date.now()
 *    // ... do work
 *    logger.info('Operation completed', { duration: Date.now() - startTime })
 * 
 * 5. **Use Error Codes**: Consistent error codes for better alerting
 *    logger.error('Payment failed', { errorCode: 'PAYMENT_DECLINED' }, error)
 * 
 * 6. **Sanitize Sensitive Data**: Never log passwords, tokens, or PII
 *    logger.info('User updated', { userId, action: 'update-profile' }) // Good
 *    logger.info('User updated', { password: '...' }) // Bad
 * 
 * 7. **Use Structured Fields**: Consistent field names across the application
 *    - action: what operation is being performed
 *    - resource: what entity is being operated on
 *    - duration: how long the operation took
 *    - errorCode: standardized error identifier
 *    - metadata: additional context-specific information
 * 
 * 8. **Child Loggers for Request Context**: Use child loggers to maintain context
 *    const requestLogger = logger.child({ requestId, userId })
 */