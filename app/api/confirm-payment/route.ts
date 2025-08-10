import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getUserProfile, updateUserCredits } from '@/lib/supabase'

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

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    if (paymentIntent.metadata.userId !== session.user.email) {
      return NextResponse.json({ error: 'Payment user mismatch' }, { status: 400 })
    }

    // Get user profile
    const profileResult = await getUserProfile(session.user.email)
    
    if (!profileResult.success || !profileResult.data) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const profile = profileResult.data
    const creditsToAdd = parseInt(paymentIntent.metadata.credits || '0')

    if (creditsToAdd <= 0) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 })
    }

    // Add credits to user account
    const newCreditAmount = profile.credits + creditsToAdd
    const creditResult = await updateUserCredits(profile.id, newCreditAmount)
    
    if (!creditResult.success) {
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