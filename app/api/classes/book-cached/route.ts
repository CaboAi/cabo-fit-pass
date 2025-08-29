import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { withErrorHandling, DatabaseError } from '@/lib/error-handlers'
import { bookingCache } from '@/lib/redis'

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
    cache_hit_rate: number
    processing_time: number
    cache_details: {
      class_data_cached: boolean
      user_profile_cached: boolean
      booking_count_cached: boolean
    }
  }
}

// Simulate rate limiting (skip for stress tests)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

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

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let queryStartTime = 0
  let queryEndTime = 0
  const cacheHits = { classData: false, userProfile: false, bookingCount: false }
  
  const isStressTest = request.headers.get('X-Stress-Test') === 'true'
  
  try {
    // Parse request
    const body: BookingRequest = await request.json()
    const { user_id, class_id, credits_used } = body
    
    if (!user_id || !class_id || !credits_used) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: user_id, class_id, credits_used'
      }, { status: 400 })
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
    
    const supabase = createClient()
    queryStartTime = Date.now()
    
    try {
      // 1. Get class and user data with Redis caching
      console.log('📊 Fetching class and user data with caching...')
      
      const [classResult, userResult] = await Promise.all([
        bookingCache.getClassData(class_id, async () => {
          const { data, error } = await supabase
            .from('classes')
            .select('id, capacity, credit_cost, title')
            .eq('id', class_id)
            .single()
          
          if (error) throw new DatabaseError(`Class not found: ${error.message}`)
          return data
        }),
        
        bookingCache.getUserProfile(user_id, async () => {
          const { data, error } = await supabase
            .from('profiles')  
            .select('id, credits, tier')
            .eq('id', user_id)
            .single()
          
          if (error) throw new DatabaseError(`User not found: ${error.message}`)
          return data
        })
      ])
      
      const classData = classResult.data
      const userData = userResult.profile
      cacheHits.classData = classResult.cached
      cacheHits.userProfile = userResult.cached
      
      console.log(`📊 Cache performance: Class ${classResult.cached ? 'HIT' : 'MISS'}, User ${userResult.cached ? 'HIT' : 'MISS'}`)
      
      // 2. Get current bookings count with Redis caching
      console.log('📊 Fetching booking count with caching...')
      
      const bookingCountResult = await bookingCache.getBookingCount(class_id, async () => {
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', class_id)
          .eq('payment_status', 'paid')
        
        if (error) throw new DatabaseError(`Failed to check class capacity: ${error.message}`)
        return count || 0
      })
      
      const currentBookings = bookingCountResult.count
      cacheHits.bookingCount = bookingCountResult.cached
      
      console.log(`📊 Booking count cache: ${bookingCountResult.cached ? 'HIT' : 'MISS'} - Current bookings: ${currentBookings}`)
      
      // 3. Business logic validations
      if (userData.credits < credits_used) {
        queryEndTime = Date.now()
        return NextResponse.json({
          success: false,
          error: 'Insufficient credits',
          performance_metrics: {
            query_time: queryEndTime - queryStartTime,
            cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
            processing_time: Date.now() - startTime,
            cache_details: cacheHits
          }
        }, { status: 400 })
      }
      
      if (currentBookings >= classData.capacity) {
        queryEndTime = Date.now()
        return NextResponse.json({
          success: false,
          error: 'Class is full',
          performance_metrics: {
            query_time: queryEndTime - queryStartTime,
            cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
            processing_time: Date.now() - startTime,
            cache_details: cacheHits
          }
        }, { status: 400 })
      }
      
      if (userData.credits < classData.credit_cost) {
        queryEndTime = Date.now()
        return NextResponse.json({
          success: false,
          error: `Insufficient credits. Required: ${classData.credit_cost}, Available: ${userData.credits}`,
          performance_metrics: {
            query_time: queryEndTime - queryStartTime,
            cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
            processing_time: Date.now() - startTime,
            cache_details: cacheHits
          }
        }, { status: 400 })
      }
      
      // 4. Check for existing booking first (to handle unique constraint)
      console.log('📊 Checking for existing booking...')
      
      const existingBooking = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user_id)
        .eq('class_id', class_id)
        .single()
      
      if (existingBooking.data) {
        queryEndTime = Date.now()
        return NextResponse.json({
          success: false,
          error: 'User already booked this class',
          performance_metrics: {
            query_time: queryEndTime - queryStartTime,
            cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
            processing_time: Date.now() - startTime,
            cache_details: cacheHits
          }
        }, { status: 400 })
      }
      
      // 5. Create booking record
      console.log('📊 Creating booking record...')
      
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
        if (bookingResult.error.message.includes('capacity')) {
          throw new DatabaseError('Class became full during booking process')
        }
        throw new DatabaseError(`Booking creation failed: ${bookingResult.error.message}`)
      }
      
      // 6. Update user credits
      console.log('📊 Updating user credits...')
      
      const creditResult = await supabase
        .from('profiles')
        .update({ 
          credits: userData.credits - classData.credit_cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
      
      if (creditResult.error) {
        // Rollback booking
        await supabase.from('bookings').delete().eq('id', bookingResult.data.id)
        throw new DatabaseError(`Credit update failed: ${creditResult.error.message}`)
      }
      
      // 7. Invalidate related cache entries
      console.log('📊 Invalidating cache entries...')
      await bookingCache.invalidateBookingCache(class_id, user_id)
      
      queryEndTime = Date.now()
      const processingTime = Date.now() - startTime
      const cacheHitRate = Object.values(cacheHits).filter(Boolean).length / 3
      
      console.log(`📊 Booking completed successfully with ${(cacheHitRate * 100).toFixed(1)}% cache hit rate`)
      
      const result: BookingResponse = {
        success: true,
        booking_id: bookingResult.data.id,
        remaining_credits: userData.credits - classData.credit_cost,
        performance_metrics: {
          query_time: queryEndTime - queryStartTime,
          cache_hit_rate: cacheHitRate,
          processing_time: processingTime,
          cache_details: cacheHits
        }
      }
      
      return NextResponse.json(result)
      
    } catch (error) {
      queryEndTime = Date.now()
      console.error('Cached booking error:', error)
      
      if (error instanceof DatabaseError) {
        return NextResponse.json({
          success: false,
          error: error.message,
          performance_metrics: {
            query_time: queryEndTime - queryStartTime,
            cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
            processing_time: Date.now() - startTime,
            cache_details: cacheHits
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error during booking process',
        performance_metrics: {
          query_time: queryEndTime - queryStartTime,
          cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
          processing_time: Date.now() - startTime,
          cache_details: cacheHits
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    queryEndTime = Date.now()
    console.error('Critical cached booking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cached booking endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error',
      performance_metrics: {
        query_time: queryEndTime - queryStartTime,
        cache_hit_rate: Object.values(cacheHits).filter(Boolean).length / 3,
        processing_time: Date.now() - startTime,
        cache_details: cacheHits
      }
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Test both database and cache
    const [dbHealth, cacheHealth] = await Promise.all([
      supabase.from('classes').select('count').limit(1),
      bookingCache.getBookingCount('test-class-id', async () => 0)
    ])
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      response_time: responseTime,
      database_status: dbHealth.error ? 'error' : 'connected',
      cache_status: 'active',
      cache_performance: {
        test_cached: cacheHealth.cached,
        cache_type: 'redis'
      }
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