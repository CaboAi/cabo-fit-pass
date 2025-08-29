import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check for demo mode via referrer or special header
    const isDemoMode = request.headers.get('referer')?.includes('?demo=true') || 
                      request.headers.get('x-demo-mode') === 'true'
    
    if (!isDemoMode) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    }

    // For demo mode, return mock data
    if (isDemoMode) {
      // Check if demo onboarding has been "completed"
      const demoOnboardingComplete = request.headers.get('x-demo-complete') === 'true'
      
      if (demoOnboardingComplete) {
        return NextResponse.json({
          success: true,
          data: {
            hasConnectAccount: true,
            status: 'complete',
            requirements: null,
            accountId: 'acct_demo_123456789',
            chargesEnabled: true,
            payoutsEnabled: true,
            detailsSubmitted: true
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        data: {
          hasConnectAccount: false,
          status: 'not_setup',
          requirements: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false
        }
      })
    }

    // Get gym details
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', params.gymId)
      .single()
    
    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    if (!gym.stripe_connect_id) {
      return NextResponse.json({
        success: true,
        data: {
          hasConnectAccount: false,
          status: 'not_setup',
          requirements: null
        }
      })
    }

    // Get Connect account details
    const account = await stripe.accounts.retrieve(gym.stripe_connect_id)
    
    const requirements = account.requirements
    const isComplete = requirements?.disabled_reason === null
    const isPending = requirements?.currently_due && requirements.currently_due.length > 0

    let status = 'not_setup'
    if (isComplete) {
      status = 'complete'
    } else if (isPending) {
      status = 'pending'
    } else if (account.charges_enabled === false) {
      status = 'incomplete'
    }

    return NextResponse.json({
      success: true,
      data: {
        hasConnectAccount: true,
        status,
        requirements,
        accountId: gym.stripe_connect_id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
      }
    })

  } catch (error) {
    console.error('Error fetching Connect status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
