import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createComponentLogger } from './logger'

const logger = createComponentLogger('rate-limit')

// Rate limit configurations for different user types and endpoints
const RATE_LIMITS = {
  // Anonymous users - more restrictive
  ANONYMOUS: {
    API_GENERAL: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1m'), // 20 requests per minute
      analytics: true,
      prefix: 'ratelimit:anonymous:api'
    }),
    API_SENSITIVE: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1m'), // 5 requests per minute for sensitive endpoints
      analytics: true,
      prefix: 'ratelimit:anonymous:sensitive'
    }),
    AUTH: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15m'), // 10 auth attempts per 15 minutes
      analytics: true,
      prefix: 'ratelimit:anonymous:auth'
    })
  },

  // Authenticated users - more generous
  AUTHENTICATED: {
    API_GENERAL: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1m'), // 100 requests per minute
      analytics: true,
      prefix: 'ratelimit:auth:api'
    }),
    API_SENSITIVE: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1m'), // 30 requests per minute for sensitive endpoints
      analytics: true,
      prefix: 'ratelimit:auth:sensitive'
    }),
    BOOKING: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '5m'), // 10 booking attempts per 5 minutes
      analytics: true,
      prefix: 'ratelimit:auth:booking'
    })
  },

  // Premium users - most generous
  PREMIUM: {
    API_GENERAL: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1m'), // 200 requests per minute
      analytics: true,
      prefix: 'ratelimit:premium:api'
    }),
    API_SENSITIVE: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1m'), // 60 requests per minute for sensitive endpoints
      analytics: true,
      prefix: 'ratelimit:premium:sensitive'
    }),
    BOOKING: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '5m'), // 20 booking attempts per 5 minutes
      analytics: true,
      prefix: 'ratelimit:premium:booking'
    })
  },

  // Admin users - highest limits
  ADMIN: {
    API_GENERAL: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, '1m'), // 500 requests per minute
      analytics: true,
      prefix: 'ratelimit:admin:api'
    }),
    API_SENSITIVE: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1m'), // 100 requests per minute
      analytics: true,
      prefix: 'ratelimit:admin:sensitive'
    })
  }
}

// Endpoint categories for different rate limiting
export const ENDPOINT_CATEGORIES = {
  PUBLIC: 'public',
  API_GENERAL: 'api_general',
  API_SENSITIVE: 'api_sensitive', 
  AUTH: 'auth',
  BOOKING: 'booking',
  ADMIN: 'admin'
} as const

export type EndpointCategory = typeof ENDPOINT_CATEGORIES[keyof typeof ENDPOINT_CATEGORIES]

// Map endpoints to categories
export function categorizeEndpoint(pathname: string): EndpointCategory {
  // Admin endpoints
  if (pathname.startsWith('/api/admin')) {
    return ENDPOINT_CATEGORIES.ADMIN
  }
  
  // Authentication endpoints
  if (pathname.includes('/auth/') || pathname.includes('/signin') || pathname.includes('/signup')) {
    return ENDPOINT_CATEGORIES.AUTH
  }
  
  // Sensitive API endpoints
  const sensitiveEndpoints = [
    '/api/checkout',
    '/api/stripe/webhooks',
    '/api/credits/topup',
    '/api/profile',
    '/api/tourist-pass',
    '/api/corporate'
  ]
  
  if (sensitiveEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    return ENDPOINT_CATEGORIES.API_SENSITIVE
  }
  
  // Booking endpoints
  if (pathname.startsWith('/api/bookings')) {
    return ENDPOINT_CATEGORIES.BOOKING
  }
  
  // General API endpoints
  if (pathname.startsWith('/api/')) {
    return ENDPOINT_CATEGORIES.API_GENERAL
  }
  
  // Default to public
  return ENDPOINT_CATEGORIES.PUBLIC
}

// Get user tier from token
function getUserTier(userType?: string, subscriptionTier?: string): keyof typeof RATE_LIMITS {
  if (userType === 'admin') return 'ADMIN'
  if (subscriptionTier === 'premium' || subscriptionTier === 'tier3') return 'PREMIUM'
  return 'AUTHENTICATED'
}

// Get appropriate rate limiter based on user and endpoint
function getRateLimiter(isAuthenticated: boolean, userTier: keyof typeof RATE_LIMITS, category: EndpointCategory): Ratelimit | null {
  if (!isAuthenticated) {
    switch (category) {
      case ENDPOINT_CATEGORIES.AUTH:
        return RATE_LIMITS.ANONYMOUS.AUTH
      case ENDPOINT_CATEGORIES.API_SENSITIVE:
        return RATE_LIMITS.ANONYMOUS.API_SENSITIVE
      case ENDPOINT_CATEGORIES.API_GENERAL:
      case ENDPOINT_CATEGORIES.BOOKING:
      case ENDPOINT_CATEGORIES.ADMIN:
        return RATE_LIMITS.ANONYMOUS.API_GENERAL
      default:
        return null // No rate limiting for public content
    }
  }
  
  const limits = RATE_LIMITS[userTier]
  switch (category) {
    case ENDPOINT_CATEGORIES.API_SENSITIVE:
      return limits.API_SENSITIVE
    case ENDPOINT_CATEGORIES.BOOKING:
      return limits.BOOKING
    case ENDPOINT_CATEGORIES.API_GENERAL:
    case ENDPOINT_CATEGORIES.AUTH:
    case ENDPOINT_CATEGORIES.ADMIN:
      return limits.API_GENERAL
    default:
      return null // No rate limiting for public content
  }
}

// Get client identifier (IP + User ID if available)
function getClientIdentifier(request: NextRequest, userId?: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'anonymous'
  
  return userId ? `${userId}:${ip}` : ip
}

// Rate limiting middleware function
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    const startTime = Date.now()
    const pathname = request.nextUrl.pathname
    const category = categorizeEndpoint(pathname)
    
    // Skip rate limiting for public content and health checks
    if (category === ENDPOINT_CATEGORIES.PUBLIC || pathname.startsWith('/api/health')) {
      return null
    }
    
    // Get user information from JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    const isAuthenticated = !!token?.email
    const userTier = isAuthenticated 
      ? getUserTier(token?.user_type as string, token?.subscription_tier as string)
      : 'AUTHENTICATED' // Won't be used for anonymous users
    
    const rateLimiter = getRateLimiter(isAuthenticated, userTier, category)
    
    // If no rate limiter is configured, allow the request
    if (!rateLimiter) {
      return null
    }
    
    // Get client identifier
    const clientId = getClientIdentifier(request, token?.email as string)
    
    // Apply rate limiting
    const result = await rateLimiter.limit(clientId)
    const duration = Date.now() - startTime
    
    // Log rate limiting attempt
    logger.info('Rate limit check', {
      action: 'rate-limit',
      resource: 'redis',
      metadata: {
        pathname,
        category,
        isAuthenticated,
        userTier: isAuthenticated ? userTier : 'ANONYMOUS',
        clientId: isAuthenticated ? clientId : 'anonymous',
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        duration
      }
    })
    
    if (!result.success) {
      // Rate limit exceeded
      logger.warn('Rate limit exceeded', {
        action: 'rate-limit-exceeded',
        resource: 'redis',
        metadata: {
          pathname,
          category,
          isAuthenticated,
          userTier: isAuthenticated ? userTier : 'ANONYMOUS',
          clientId: isAuthenticated ? clientId : 'anonymous',
          limit: result.limit,
          reset: result.reset
        }
      })
      
      return NextResponse.json({
        success: false,
        error: 'Too many requests',
        details: {
          limit: result.limit,
          reset: new Date(result.reset).toISOString(),
          retryAfter: Math.round((result.reset - Date.now()) / 1000)
        }
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.round((result.reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString()
        }
      })
    }
    
    // Rate limit passed, allow request to proceed
    return null
  } catch (error) {
    // If rate limiting fails, log error but allow request to proceed
    logger.error('Rate limiting error', {
      action: 'rate-limit',
      resource: 'redis',
      errorCode: 'RATE_LIMIT_CHECK_FAILED',
      metadata: { pathname: request.nextUrl.pathname }
    }, error instanceof Error ? error : new Error('Rate limit check failed'))
    
    return null
  }
}

// Export rate limiting analytics
export async function getRateLimitAnalytics(): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    // Get analytics from Upstash (if analytics is enabled)
    // This is a placeholder - actual implementation depends on Upstash analytics API
    logger.info('Rate limit analytics requested', {
      action: 'analytics',
      resource: 'rate-limit'
    })
    
    return {
      success: true,
      data: {
        message: 'Rate limit analytics feature available',
        note: 'Configure Upstash analytics dashboard for detailed metrics'
      }
    }
  } catch (error) {
    logger.error('Rate limit analytics error', {
      action: 'analytics',
      resource: 'rate-limit',
      errorCode: 'ANALYTICS_FETCH_FAILED'
    }, error instanceof Error ? error : new Error('Analytics fetch failed'))
    
    return {
      success: false,
      error: 'Failed to fetch rate limit analytics'
    }
  }
}

// Utility to manually check rate limit status
export async function checkRateLimit(userId: string, category: EndpointCategory): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  error?: string
}> {
  try {
    const rateLimiter = getRateLimiter(true, 'AUTHENTICATED', category)
    if (!rateLimiter) {
      return { success: true }
    }
    
    const result = await rateLimiter.limit(userId)
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}