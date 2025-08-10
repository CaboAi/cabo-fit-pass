import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, updateUserCredits } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credits, paymentIntentId } = await request.json()

    if (!credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 })
    }

    // Get user profile
    const profileResult = await getUserProfile(session.user.email)
    
    if (!profileResult.success || !profileResult.data) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const profile = profileResult.data

    // In production, verify payment with Stripe/payment processor here
    // For now, we'll simulate successful payment
    if (paymentIntentId) {
      // Mock payment verification
      console.log(`Payment verified for ${credits} credits with intent ${paymentIntentId}`)
    }

    // Add credits to user account
    const newCreditAmount = profile.credits + credits
    const creditResult = await updateUserCredits(profile.id, newCreditAmount)
    
    if (!creditResult.success) {
      return NextResponse.json({ 
        error: 'Failed to update credits' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newCredits: newCreditAmount,
      addedCredits: credits
    })

  } catch (error) {
    console.error('Error adding credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const profileResult = await getUserProfile(session.user.email)
    
    if (!profileResult.success || !profileResult.data) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      credits: profileResult.data.credits
    })

  } catch (error) {
    console.error('Error getting credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}