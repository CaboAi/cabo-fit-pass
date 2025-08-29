import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CreditManager } from '@/lib/credits/credit-rules'
import { bookingSchema } from '@/lib/validation/schemas'
import { invalidateCache } from '@/lib/cache'
import { createComponentLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const logger = createComponentLogger('bookings')
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    
    logger.info('Booking creation requested', {
      action: 'create-booking',
      metadata: { userId: session?.user?.email }
    })
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // 🛡️ INPUT VALIDATION - Prevents injection attacks
    const validationResult = bookingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }
    
    const { gymId, classId, classDate, classTime } = validationResult.data

    const supabase = createClient()
    const creditManager = new CreditManager(supabase)
    
    // Get user profile (using email as ID in real schema)
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.email) // Real schema uses email as primary key
      .single()
    
    if (profileError || !profile) {
      // Try to create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.email,
          email: session.user.email,
          full_name: session.user.name || '',
          credits: 5 // Default credits
        })
        .select()
        .single()
      
      if (createError || !newProfile) {
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      
      // Use newly created profile
      profile = newProfile
    }

    // Get class details and pricing
    const { data: classDetails, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
    
    if (classError || !classDetails) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const requiredCredits = 1 // Fixed cost - no credit_cost column in real schema

    // Check if user can book the class
    const canBook = await creditManager.canBookClass(profile.id, requiredCredits)
    if (!canBook) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        requiredCredits,
        availableCredits: await creditManager.getUserWallet(profile.id).then(w => w?.totalCredits || 0)
      }, { status: 400 })
    }

    // ⚡ ATOMIC TRANSACTION - Prevents race conditions
    const { data: transactionResult, error: transactionError } = await supabase.rpc(
      'book_class_atomically',
      {
        p_user_id: session.user.email, // Use email as user ID (matches schema)
        p_class_id: classId,
        p_credits_required: requiredCredits
      }
    )

    if (transactionError || !transactionResult) {
      // Handle specific error cases
      if (transactionError?.message?.includes('class_full')) {
        return NextResponse.json({ error: 'Class is full' }, { status: 400 })
      }
      if (transactionError?.message?.includes('insufficient_credits')) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
      }
      if (transactionError?.message?.includes('duplicate_booking')) {
        return NextResponse.json({ error: 'You already have a booking for this class' }, { status: 400 })
      }
      
      console.error('Atomic booking error:', transactionError)
      return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
    }

    const { booking_id, remaining_credits, credits_used } = transactionResult

    // Get the created booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (fetchError || !booking) {
      logger.error('Error fetching booking details after creation', {
        action: 'create-booking',
        errorCode: 'BOOKING_FETCH_FAILED',
        metadata: { bookingId: booking_id, userId: session.user.email }
      }, new Error(fetchError?.message || 'Fetch failed'))
      return NextResponse.json({ error: 'Booking created but details unavailable' }, { status: 500 })
    }

    // Invalidate relevant caches after successful booking
    await Promise.all([
      // Invalidate user-related caches
      invalidateCache.user(session.user.email),
      // Invalidate class-related caches (class availability changed)
      invalidateCache.class(classId),
      // Invalidate classes list cache (booking count changed)
      invalidateCache.classes()
    ])

    const duration = Date.now() - startTime
    logger.info('Booking created successfully and caches invalidated', {
      action: 'create-booking',
      duration,
      statusCode: 200,
      metadata: {
        bookingId: booking_id,
        userId: session.user.email,
        classId,
        creditsUsed: credits_used,
        remainingCredits: remaining_credits
      }
    })

    return NextResponse.json({ 
      success: true, 
      booking,
      creditsConsumed: credits_used,
      remainingCredits: remaining_credits
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Booking creation error', {
      action: 'create-booking',
      duration,
      statusCode: 500,
      errorCode: 'BOOKING_CREATION_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
