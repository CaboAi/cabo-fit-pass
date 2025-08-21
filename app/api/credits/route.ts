import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types'

interface CreditUpdateRequest {
  user_email: string
  credits_to_add: number
  payment_intent_id?: string
}

interface CreditUpdateResponse {
  success: boolean
  new_credits: number
  added_credits: number
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreditUpdateResponse>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { user_email, credits_to_add, payment_intent_id }: CreditUpdateRequest = await request.json()

    if (!credits_to_add || credits_to_add <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credit amount' 
      }, { status: 400 })
    }

    // Verify the requesting user matches the session
    if (user_email !== session.user.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Cannot update credits for different user' 
      }, { status: 403 })
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user_email)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    // In production, verify payment with Stripe/payment processor here
    if (payment_intent_id) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Payment verified for ${credits_to_add} credits with intent ${payment_intent_id}`)
      }
      // TODO: Verify payment_intent_id with Stripe
    }

    // Add credits to user account
    const newCreditAmount = profile.credits + credits_to_add
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: newCreditAmount,
        updated_at: new Date().toISOString()
      })
      .eq('email', user_email)
      .select()
      .single()
    
    if (updateError || !updatedProfile) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update credits' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        new_credits: newCreditAmount,
        added_credits: credits_to_add
      }
    })

  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<{ credits: number }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('email', session.user.email)
      .single()
    
    if (error || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { credits: profile.credits }
    })

  } catch (error) {
    console.error('Credits GET API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}