import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBooking, getUserProfile, updateUserCredits } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Get user profile to check credits
    const profileResult = await getUserProfile(session.user.email)
    
    if (!profileResult.success || !profileResult.data) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const profile = profileResult.data

    // Check if user has enough credits
    if (profile.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Create booking
    const bookingResult = await createBooking({
      user_id: profile.id,
      class_id: classId,
      type: 'drop-in',
      payment_status: 'paid',
      booking_date: new Date().toISOString()
    })

    if (!bookingResult.success) {
      const errorMessage = bookingResult.error && typeof bookingResult.error === 'object' && 'message' in bookingResult.error 
        ? bookingResult.error.message 
        : 'Failed to create booking'
      return NextResponse.json({ 
        error: errorMessage
      }, { status: 400 })
    }

    // Deduct credit
    const creditResult = await updateUserCredits(profile.id, profile.credits - 1)
    
    if (!creditResult.success) {
      // Booking was created but credit deduction failed - this is a critical issue
      // In production, you'd want to handle this with a transaction or compensation
      console.error('Critical: Booking created but credit deduction failed', {
        userId: profile.id,
        bookingId: bookingResult.data?.id
      })
      
      return NextResponse.json({ 
        error: 'Booking created but credit deduction failed. Please contact support.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking: bookingResult.data,
      remainingCredits: profile.credits - 1
    })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}