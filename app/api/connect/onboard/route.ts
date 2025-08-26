import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import stripe, { STRIPE_CONNECT_CONFIG } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gymId } = await request.json()
    
    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get gym details
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single()
    
    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    let connectAccountId = gym.stripe_connect_id

    // Create new Connect account if one doesn't exist
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Update based on your gym locations
        email: gym.email || 'admin@cabofitpass.com',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: gym.name,
        },
        metadata: {
          gym_id: gym.id,
          gym_name: gym.name,
        },
      })

      connectAccountId = account.id

      // Update gym with Connect account ID
      await supabase
        .from('gyms')
        .update({ 
          stripe_connect_id: connectAccountId,
          updated_at: new Date().toISOString()
        })
        .eq('id', gymId)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: STRIPE_CONNECT_CONFIG.refreshUrl,
      return_url: STRIPE_CONNECT_CONFIG.returnUrl,
      type: 'account_onboarding',
      collect: 'eventually_due',
    })

    return NextResponse.json({
      success: true,
      accountLinkUrl: accountLink.url,
      connectAccountId,
      isNewAccount: !gym.stripe_connect_id
    })

  } catch (error) {
    console.error('Error creating Connect onboarding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
