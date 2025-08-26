import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CreditManager } from '@/lib/credits/credit-rules'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gymId, classId, classDate, classTime } = await request.json()
    
    if (!gymId || !classId || !classDate || !classTime) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createClient()
    const creditManager = new CreditManager(supabase)
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get class details and pricing
    const { data: classDetails, error: classError } = await supabase
      .from('gym_classes')
      .select('*')
      .eq('id', classId)
      .single()
    
    if (classError || !classDetails) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const requiredCredits = classDetails.credit_cost || 1

    // Check if user can book the class
    const canBook = await creditManager.canBookClass(profile.id, requiredCredits)
    if (!canBook) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        requiredCredits,
        availableCredits: await creditManager.getUserWallet(profile.id).then(w => w?.totalCredits || 0)
      }, { status: 400 })
    }

    // Check if class is available (not full)
    const { data: existingBookings, error: bookingCountError } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('class_date', classDate)
      .eq('status', 'confirmed')
    
    if (bookingCountError) {
      return NextResponse.json({ error: 'Error checking class availability' }, { status: 500 })
    }

    const currentBookings = existingBookings?.length || 0
    if (currentBookings >= classDetails.capacity) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 })
    }

    // Process the booking
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        user_id: profile.id,
        gym_id: gymId,
        class_id: classId,
        credits_consumed: requiredCredits,
        booking_date: classDate,
        class_time: classTime,
        status: 'confirmed'
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Deduct credits from wallet
    const success = await creditManager.processClassBooking(
      profile.id,
      gymId,
      classId,
      requiredCredits,
      classDetails.price || 0
    )

    if (!success) {
      // Rollback booking if credit deduction failed
      await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id)
      
      return NextResponse.json({ error: 'Failed to process credits' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      creditsConsumed: requiredCredits
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
