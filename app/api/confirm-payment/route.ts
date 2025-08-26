import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPaymentProvider } from '@/lib/payments/provider'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const paymentProvider = await getPaymentProvider()
    const checkoutSession = await paymentProvider.getCheckoutSession(sessionId)
    
    if (!checkoutSession) {
      return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
    }

    if (checkoutSession.status !== 'completed') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
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

    // Verify the session belongs to this user
    if (checkoutSession.metadata.user_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get credits from metadata
    const creditsToAdd = parseInt(checkoutSession.metadata.credits || '0')
    
    if (creditsToAdd <= 0) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 })
    }

    // Add credits to user account
    const newCreditAmount = profile.credits + creditsToAdd
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: newCreditAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
    
    if (updateError) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json({ 
        error: 'Payment successful but failed to update credits. Please contact support.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      newTotal: newCreditAmount
    })

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}