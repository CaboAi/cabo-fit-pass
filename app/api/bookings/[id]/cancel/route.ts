import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { addRefund, addPenalty, getActiveCredits } from '@/utils/credits'
import { CANCELLATION_POLICY } from '@/lib/billing'

interface CancelResponse {
  success: boolean
  refunded: boolean
  refundCredits: number
  penaltyCredits: number
  message: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookingId = params.id
    
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get booking with class information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          id,
          title,
          start_time,
          price
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', profile.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if already cancelled
    if (booking.booking_status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    // Check if class has already started
    const classStartTime = new Date(booking.classes.start_time)
    const now = new Date()
    
    if (now >= classStartTime) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a class that has already started' },
        { status: 400 }
      )
    }

    // Calculate hours until class start
    const hoursUntilStart = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    let refundCredits = 0
    let penaltyCredits = 0
    let cancellationReason = ''

    // Determine refund/penalty based on cancellation policy
    if (hoursUntilStart > CANCELLATION_POLICY.freeWindowHours) {
      // Free cancellation - full refund
      refundCredits = booking.credits_used || 1
      cancellationReason = 'early_cancellation'
      
      // Only refund if credits were actually used (not tourist pass)
      if (booking.credits_used > 0) {
        // Get the original credit expiration (would need to track this properly)
        // For now, we'll inherit null expiration for refunds
        await addRefund(
          profile.id,
          refundCredits,
          null, // TODO: Track original expiration
          `booking_${bookingId}`
        )
      }
    } else {
      // Late cancellation - apply penalty
      penaltyCredits = CANCELLATION_POLICY.penaltyCredits
      cancellationReason = 'late_cancellation'
      
      await addPenalty(
        profile.id,
        penaltyCredits,
        `late_cancel_${bookingId}`
      )
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        cancelled_at: now.toISOString(),
        cancellation_reason: cancellationReason,
        refund_credits: refundCredits,
        penalty_credits: penaltyCredits
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update booking status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    // Get updated credit balance
    const newBalance = await getActiveCredits(profile.id)

    // Log to audit table
    const { error: auditError } = await supabase
      .from('credit_audit_log')
      .insert({
        user_id: profile.id,
        action: 'cancellation',
        credits_before: newBalance - refundCredits + penaltyCredits,
        credits_after: newBalance,
        credits_changed: refundCredits - penaltyCredits,
        metadata: {
          booking_id: bookingId,
          class_id: booking.class_id,
          hours_until_start: hoursUntilStart,
          cancellation_reason: cancellationReason,
          refunded: refundCredits,
          penalty: penaltyCredits
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Prepare response message
    let message = ''
    if (refundCredits > 0) {
      message = `Booking cancelled successfully. ${refundCredits} credit(s) have been refunded to your account.`
    } else if (penaltyCredits > 0) {
      message = `Booking cancelled. Due to late cancellation (less than ${CANCELLATION_POLICY.freeWindowHours} hours before class), a penalty of ${penaltyCredits} credit(s) has been applied.`
    } else {
      message = 'Booking cancelled successfully.'
    }

    const response: CancelResponse = {
      success: true,
      refunded: refundCredits > 0,
      refundCredits,
      penaltyCredits,
      message
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Cancellation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check cancellation eligibility
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookingId = params.id
    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get booking with class information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          id,
          title,
          start_time,
          price
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', profile.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check cancellation eligibility
    const classStartTime = new Date(booking.classes.start_time)
    const now = new Date()
    const hoursUntilStart = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    const canCancel = booking.booking_status !== 'cancelled' && now < classStartTime
    const freeCancel = hoursUntilStart > CANCELLATION_POLICY.freeWindowHours
    const creditValue = booking.credits_used || booking.classes.credit_cost || 1

    return NextResponse.json({
      success: true,
      data: {
        canCancel,
        freeCancel,
        hoursUntilStart: Math.max(0, hoursUntilStart),
        freeWindowHours: CANCELLATION_POLICY.freeWindowHours,
        refundAmount: freeCancel ? creditValue : 0,
        penaltyAmount: !freeCancel && canCancel ? CANCELLATION_POLICY.penaltyCredits : 0,
        bookingStatus: booking.booking_status,
        classStartTime: classStartTime.toISOString()
      }
    })

  } catch (error) {
    console.error('Cancellation eligibility check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}