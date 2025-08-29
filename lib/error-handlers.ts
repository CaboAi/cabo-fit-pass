import { NextResponse } from 'next/server'

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class RedisError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'RedisError'
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public service: string, public code?: string) {
    super(message)
    this.name = 'ExternalServiceError'
  }
}

export interface ErrorResponse {
  success: false
  error: string
  code?: string
  fallbackData?: any
  retry?: boolean
}

export interface SuccessResponse<T> {
  success: true
  data: T
  fromCache?: boolean
  fallback?: boolean
}

export type ApiResponse<T> = ErrorResponse | SuccessResponse<T>

/**
 * Handles Redis connection/operation errors gracefully
 */
export function handleRedisError(error: unknown, fallbackData?: any): ErrorResponse {
  console.error('Redis error:', error)
  
  const errorMessage = error instanceof Error ? error.message : 'Redis connection failed'
  
  return {
    success: false,
    error: 'Cache temporarily unavailable',
    code: 'REDIS_ERROR',
    fallbackData,
    retry: true
  }
}

/**
 * Handles database connection/query errors
 */
export function handleDatabaseError(error: unknown, operation: string): ErrorResponse {
  console.error(`Database error during ${operation}:`, error)
  
  if (error instanceof Error) {
    // Supabase specific errors
    if (error.message.includes('JWT')) {
      return {
        success: false,
        error: 'Authentication expired. Please refresh the page.',
        code: 'AUTH_ERROR'
      }
    }
    
    if (error.message.includes('rate limit')) {
      return {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMIT',
        retry: true
      }
    }
    
    if (error.message.includes('connection')) {
      return {
        success: false,
        error: 'Database connection issue. Please try again.',
        code: 'CONNECTION_ERROR',
        retry: true
      }
    }
  }
  
  return {
    success: false,
    error: `Failed to ${operation}. Please try again.`,
    code: 'DATABASE_ERROR',
    retry: true
  }
}

/**
 * Handles external service errors (Stripe, SendGrid, etc.)
 */
export function handleExternalServiceError(
  error: unknown, 
  service: string, 
  operation: string
): ErrorResponse {
  console.error(`${service} error during ${operation}:`, error)
  
  if (error instanceof Error) {
    // Stripe specific errors
    if (service === 'Stripe' && error.message.includes('rate_limit')) {
      return {
        success: false,
        error: 'Payment service is busy. Please try again in a moment.',
        code: 'RATE_LIMIT',
        retry: true
      }
    }
    
    // SendGrid specific errors
    if (service === 'SendGrid' && error.message.includes('rate limit')) {
      return {
        success: false,
        error: 'Email service is temporarily limited. Your request will be processed shortly.',
        code: 'EMAIL_RATE_LIMIT',
        retry: false // Don't retry email immediately
      }
    }
  }
  
  return {
    success: false,
    error: `${service} service unavailable. Please try again later.`,
    code: 'EXTERNAL_SERVICE_ERROR',
    retry: true
  }
}

/**
 * Creates appropriate HTTP response based on error type
 */
export function createErrorResponse(error: ErrorResponse, statusCode = 500): NextResponse {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store' // Don't cache error responses
  }
  
  // Add retry headers for retryable errors
  if (error.retry) {
    headers['Retry-After'] = '5' // Suggest 5 second retry
  }
  
  return NextResponse.json(error, { 
    status: statusCode,
    headers
  })
}

/**
 * Wraps async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackData?: any
): Promise<ApiResponse<T>> {
  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof RedisError) {
      return handleRedisError(error, fallbackData)
    }
    
    if (error instanceof DatabaseError) {
      return handleDatabaseError(error, context)
    }
    
    if (error instanceof ExternalServiceError) {
      return handleExternalServiceError(error, error.service, context)
    }
    
    // Generic error
    console.error(`Error in ${context}:`, error)
    return {
      success: false,
      error: `Failed to ${context}. Please try again.`,
      code: 'UNKNOWN_ERROR',
      retry: true
    }
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Circuit breaker pattern for external services
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.resetTimeout) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }
}

export const redisCircuitBreaker = new CircuitBreaker(3, 30000) // 30 seconds
export const databaseCircuitBreaker = new CircuitBreaker(5, 60000) // 1 minute