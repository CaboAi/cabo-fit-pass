import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attended } = await request.json()
    
    if (typeof attended !== 'boolean') {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, gym_classes(*)')
      .eq('id', params.id)
      .single()
    
    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has permission to mark attendance (gym owner/instructor)
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', booking.gym_id)
      .single()
    
    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Check if user is gym owner or has instructor role
    const hasPermission = gym.owner_id === profile.id || 
                         profile.user_type === 'instructor' ||
                         profile.role === 'admin'
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update booking attendance
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        attended,
        attended_at: attended ? new Date().toISOString() : null,
        marked_by: profile.id
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
    }

    // If marking as attended, update the ledger row with payable amount
    if (attended) {
      const { data: ledgerRow, error: ledgerError } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', booking.user_id)
        .eq('gym_id', booking.gym_id)
        .eq('class_id', booking.class_id)
        .eq('reason', 'booking')
        .single()

      if (ledgerRow && !ledgerRow.payable_to_gym_cents) {
        // Calculate payable amount (70% of credit value)
        const creditValue = 1.50 // $1.50 per credit
        const payableCents = Math.round(booking.credits_consumed * creditValue * 100 * 0.7)
        
        await supabase
          .from('credit_ledger')
          .update({
            payable_to_gym_cents: payableCents
          })
          .eq('id', ledgerRow.id)
      }
    }

    return NextResponse.json({ 
      success: true, 
      attended,
      message: attended ? 'Attendance marked successfully' : 'Attendance removed'
    })

  } catch (error) {
    console.error('Attendance marking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
