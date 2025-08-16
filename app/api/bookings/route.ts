import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ClassBooking, ApiResponse } from '@/types'

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

    // Check if user has enough credits
    if (profile.credits < classInfo.credit_cost) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient credits. Need ${classInfo.credit_cost} but have ${profile.credits}` 
      }, { status: 400 })
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

    if ((currentBookings || 0) >= classInfo.max_capacity) {
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

    // Create booking and update credits in a transaction
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        user_id: profile.id,
        class_id: sanitizedClassId,
        credits_used: classInfo.credit_cost,
        booking_status: 'confirmed' as const
      }])
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create booking' 
      }, { status: 500 })
    }

    // Update user credits
    const newCredits = profile.credits - classInfo.credit_cost
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (creditError) {
      console.error('Critical: Booking created but credit deduction failed', {
        userId: profile.id,
        bookingId: booking.id,
        error: creditError
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'Booking created but credit deduction failed. Please contact support.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking,
      remainingCredits: newCredits
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
          name,
          class_type,
          start_time,
          duration,
          difficulty_level,
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