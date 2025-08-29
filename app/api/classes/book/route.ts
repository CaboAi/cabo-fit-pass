import { NextRequest, NextResponse } from 'next/server'
import { createClient, validateDatabaseConnection, createClientWithRetry, validateRequiredTables } from '@/lib/supabase'
import { withErrorHandling, DatabaseError } from '@/lib/error-handlers'

interface BookingRequest {
  user_id: string
  class_id: string
  credits_used: number
}

interface BookingResponse {
  success: boolean
  booking_id?: string
  remaining_credits?: number
  error?: string
  performance_metrics?: {
    query_time: number
    cache_hit: boolean
    processing_time: number
  }
}

// Simulate rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now()
  const current = rateLimitMap.get(identifier)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (current.count >= RATE_LIMIT) {
    return false
  }
  
  current.count++
  return true
}

// Simulate cache operations
const bookingCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCachedData = (key: string) => {
  const cached = bookingCache.get(key)
  if (cached && Date.now() < cached.expires) {
    return cached.data
  }
  bookingCache.delete(key)
  return null
}

const setCachedData = (key: string, data: any) => {
  bookingCache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let queryStartTime = 0
  let queryEndTime = 0
  let supabase: any
  
  const isStressTest = request.headers.get('X-Stress-Test') === 'true'
  
  try {
    // Parse request first
    const body: BookingRequest = await request.json()
    const { user_id, class_id, credits_used } = body
    
    if (!user_id || !class_id || !credits_used) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: user_id, class_id, credits_used'
      }, { status: 400 })
    }
    
    try {
      // Step 1: Validate database connection first
      console.log('Validating database connection...')
      const dbValidation = await validateDatabaseConnection()
      if (!dbValidation.success) {
        console.error('Database validation failed:', dbValidation.error)
        return NextResponse.json({
          success: false,
          error: 'Database temporarily unavailable',
          details: dbValidation.error
        }, { status: 503 }) // Service Unavailable
      }
      
      // Step 2: Create client with retry logic
      console.log('Creating database client with retry...')
      supabase = await createClientWithRetry()
      
      // Step 3: Validate required tables exist
      console.log('Validating required tables...')
      const tablesExist = await validateRequiredTables(supabase)
      if (!tablesExist.success) {
        console.error('Missing required tables:', tablesExist.missingTables)
        return NextResponse.json({
          success: false,
          error: 'System configuration error',
          details: 'Required database tables missing',
          missingTables: tablesExist.missingTables
        }, { status: 503 })
      }
      
    } catch (error) {
      console.error('Critical booking endpoint error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
    
    // Rate limiting (skip for stress tests)
    if (!isStressTest) {
      const clientId = request.headers.get('x-forwarded-for') || user_id
      if (!checkRateLimit(clientId)) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT'
        }, { 
          status: 429,
          headers: { 'Retry-After': '60' }
        })
      }
    }
    
    // Check cache first
    const cacheKey = `booking:${user_id}:${class_id}`
    let cacheHit = false
    let cachedResult = getCachedData(cacheKey)
    
    if (cachedResult && !isStressTest) {
      cacheHit = true
      return NextResponse.json({
        ...cachedResult,
        performance_metrics: {
          query_time: 0,
          cache_hit: true,
          processing_time: Date.now() - startTime
        }
      })
    }
    
    try {
      // Start transaction simulation
      queryStartTime = Date.now()
      
      // 1. Check class availability and user credits
      const [classResult, userResult] = await Promise.all([
        supabase
          .from('classes')
          .select('id, capacity, credit_cost')
          .eq('id', class_id)
          .single(),
        supabase
          .from('profiles')  
          .select('id, credits, tier')
          .eq('id', user_id)
          .single()
      ])
      
      if (classResult.error) {
        throw new DatabaseError(`Class not found: ${classResult.error.message}`)
      }
      
      if (userResult.error) {
        throw new DatabaseError(`User not found: ${userResult.error.message}`)
      }
      
      const classData = classResult.data
      const userData = userResult.data
      
      // Get current bookings count for the class
      const { count: currentBookings, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', class_id)
        .eq('payment_status', 'paid')
      
      if (countError) {
        throw new DatabaseError(`Failed to check class capacity: ${countError.message}`)
      }
      
      // Business logic validations
      if (userData.credits < credits_used) {
        queryEndTime = Date.now()
        const result = {
          success: false,
          error: 'Insufficient credits'
        }
        setCachedData(cacheKey, result)
        return NextResponse.json(result, { status: 400 })
      }
      
      if ((currentBookings || 0) >= classData.capacity) {
        queryEndTime = Date.now()
        const result = {
          success: false,
          error: 'Class is full'
        }
        setCachedData(cacheKey, result)
        return NextResponse.json(result, { status: 400 })
      }
      
      if (userData.credits < classData.credit_cost) {
        queryEndTime = Date.now()
        const result = {
          success: false,
          error: `Insufficient credits. Required: ${classData.credit_cost}, Available: ${userData.credits}`
        }
        setCachedData(cacheKey, result)
        return NextResponse.json(result, { status: 400 })
      }
      
      // 2. Create booking record
      const bookingResult = await supabase
        .from('bookings')
        .insert({
          user_id,
          class_id, 
          payment_status: 'paid',
          type: 'drop-in'
        })
        .select('id')
        .single()
      
      if (bookingResult.error) {
        // Handle race condition - class might have filled up
        if (bookingResult.error.message.includes('capacity')) {
          throw new DatabaseError('Class became full during booking process')
        }
        throw new DatabaseError(`Booking creation failed: ${bookingResult.error.message}`)
      }
      
      // 3. Update user credits
      const creditResult = await supabase
        .from('profiles')
        .update({ 
          credits: userData.credits - classData.credit_cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
      
      if (creditResult.error) {
        // Attempt to rollback booking
        await supabase.from('bookings').delete().eq('id', bookingResult.data.id)
        throw new DatabaseError(`Credit update failed: ${creditResult.error.message}`)
      }
      
      queryEndTime = Date.now()
      const processingTime = Date.now() - startTime
      
      const result: BookingResponse = {
        success: true,
        booking_id: bookingResult.data.id,
        remaining_credits: userData.credits - classData.credit_cost,
        performance_metrics: {
          query_time: queryEndTime - queryStartTime,
          cache_hit: cacheHit,
          processing_time: processingTime
        }
      }
      
      // Cache successful result briefly
      setCachedData(`booking_success:${user_id}`, result)
      
      return NextResponse.json(result)
      
    } catch (error) {
      queryEndTime = Date.now()
      console.error('Booking error:', error)
      
      if (error instanceof DatabaseError) {
        return NextResponse.json({
          success: false,
          error: error.message,
          performance_metrics: {
            query_time: queryEndTime - queryStartTime,
            cache_hit: cacheHit,
            processing_time: Date.now() - startTime
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error during booking process',
        performance_metrics: {
          query_time: queryEndTime - queryStartTime,
          cache_hit: cacheHit,  
          processing_time: Date.now() - startTime
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Critical booking endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Booking endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Health check endpoint for monitoring
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Quick health check query
    const { data, error } = await supabase
      .from('classes')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      response_time: responseTime,
      database_status: error ? 'error' : 'connected',
      cache_entries: bookingCache.size,
      rate_limit_entries: rateLimitMap.size
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time: Date.now() - startTime
    }, { status: 503 })
  }
}