import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
    }

    // Mock payment verification for development
    if (!paymentIntentId.startsWith('pi_mock_')) {
      return NextResponse.json({ error: 'Invalid payment intent format' }, { status: 400 })
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

    // Mock credits - in production this would come from payment metadata
    const creditsToAdd = 10 // Mock value for development

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
      newCredits: newCreditAmount,
      addedCredits: creditsToAdd,
      paymentIntentId: paymentIntentId
    })

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}