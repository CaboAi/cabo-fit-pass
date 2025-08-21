import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ClassBooking, ApiResponse } from '@/types'
import { 
  isAccountFrozen, 
  hasActiveTouristPass, 
  consumeTouristPass, 
  spendCreditsFIFO,
  getActiveCredits 
} from '@/utils/credits'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { class_id, user_email } = body

    // Input validation
    if (!class_id || typeof class_id !== 'string' || class_id.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid class_id provided' }, { status: 400 })
    }

    if (!user_email || typeof user_email !== 'string' || !user_email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedClassId = class_id.trim()
    const sanitizedEmail = user_email.trim().toLowerCase()

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    // Check if account is frozen
    const isFrozen = await isAccountFrozen(profile.id)
    if (isFrozen) {
      return NextResponse.json({ 
        success: false, 
        error: 'Account is frozen. Please unfreeze your account to book classes.' 
      }, { status: 403 })
    }

    // Get class information
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', sanitizedClassId)
      .single()

    if (classError || !classInfo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Class not found' 
      }, { status: 404 })
    }

    // Determine credit cost (default to 1 if not specified)
    const creditCost = classInfo.credit_cost || 1
    
    // Check for active tourist pass first
    const touristPass = await hasActiveTouristPass(profile.id)
    let usedTouristPass = false
    let creditsSpent = 0
    
    if (touristPass) {
      // Use tourist pass instead of credits
      usedTouristPass = true
      console.log(`Using tourist pass ${touristPass.id} for booking`)
    } else {
      // Check if user has enough credits using FIFO system
      const activeCredits = await getActiveCredits(profile.id)
      if (activeCredits < creditCost) {
        return NextResponse.json({ 
          success: false, 
          error: `Insufficient credits. Need ${creditCost} but have ${activeCredits} active credits` 
        }, { status: 400 })
      }
      creditsSpent = creditCost
    }

    // Check if class is full
    const { count: currentBookings, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', sanitizedClassId)
      .eq('booking_status', 'confirmed')

    if (countError) {
      console.error('Error checking class capacity:', countError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check class availability' 
      }, { status: 500 })
    }

    // Use capacity field (updated schema) instead of max_capacity
    const classCapacity = classInfo.capacity || classInfo.max_capacity || 20
    
    if ((currentBookings || 0) >= classCapacity) {
      return NextResponse.json({ 
        success: false, 
        error: 'Class is full' 
      }, { status: 400 })
    }

    // Check if user has already booked this class
    const { data: existingBooking, error: existingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', profile.id)
      .eq('class_id', sanitizedClassId)
      .eq('booking_status', 'confirmed')
      .single()

    if (!existingError && existingBooking) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already booked this class' 
      }, { status: 400 })
    }

    // Process payment (tourist pass or credits)
    if (usedTouristPass && touristPass) {
      try {
        await consumeTouristPass(touristPass.id)
      } catch (error) {
        console.error('Failed to consume tourist pass:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to use tourist pass' 
        }, { status: 500 })
      }
    } else if (creditsSpent > 0) {
      const creditSpent = await spendCreditsFIFO(profile.id, creditsSpent)
      if (!creditSpent) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to deduct credits. Please try again.' 
        }, { status: 500 })
      }
    }

    // Create booking (using database schema fields)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        user_id: profile.id,
        class_id: sanitizedClassId,
        credits_used: creditsSpent,
        booking_status: 'confirmed' as const,
        type: usedTouristPass ? 'tourist_pass' : 'credits',
        payment_status: 'paid'
      }])
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      // TODO: Rollback credit/pass consumption if booking fails
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create booking' 
      }, { status: 500 })
    }

    // Get updated credit balance
    const remainingCredits = await getActiveCredits(profile.id)

    // Log to audit table
    const { error: auditError } = await supabase
      .from('credit_audit_log')
      .insert({
        user_id: profile.id,
        action: 'booking',
        credits_before: remainingCredits + creditsSpent,
        credits_after: remainingCredits,
        credits_changed: -creditsSpent,
        metadata: {
          booking_id: booking.id,
          class_id: sanitizedClassId,
          used_tourist_pass: usedTouristPass,
          tourist_pass_id: touristPass?.id
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      booking,
      remainingCredits,
      usedTouristPass,
      touristPassRemaining: touristPass ? touristPass.remaining - 1 : null
    })

  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<{ bookings: ClassBooking[] }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const supabase = createClient()

    // Get user's bookings with class information
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          id,
          title,
          start_time,
          end_time,
          instructor,
          difficulty,
          studios (
            name,
            location
          )
        )
      `)
      .eq('user_id', session.user.email)
      .eq('booking_status', 'confirmed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch bookings'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { bookings: bookings || [] }
    })

  } catch (error) {
    console.error('Bookings GET API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}