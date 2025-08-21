import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { FREEZE_PLAN } from '@/lib/billing'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, frozen, stripe_customer_id, stripe_subscription_id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if already frozen
    if (profile.frozen) {
      return NextResponse.json(
        { success: false, error: 'Account is already frozen' },
        { status: 400 }
      )
    }

    // Update Stripe subscription to freeze plan if user has a subscription
    if (profile.stripe_subscription_id) {
      try {
        // Get current subscription
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
        
        // Update to freeze plan
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price: FREEZE_PLAN.stripePriceId
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            ...subscription.metadata,
            frozen_at: new Date().toISOString(),
            previous_price_id: subscription.items.data[0].price.id
          }
        })

        console.log(`Updated Stripe subscription ${profile.stripe_subscription_id} to freeze plan`)
      } catch (stripeError) {
        console.error('Failed to update Stripe subscription:', stripeError)
        // Continue with freezing even if Stripe update fails
        // Manual intervention may be needed
      }
    }

    // Freeze account in database
    const { error: freezeError } = await supabase
      .from('profiles')
      .update({ 
        frozen: true,
        frozen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (freezeError) {
      console.error('Failed to freeze account:', freezeError)
      return NextResponse.json(
        { success: false, error: 'Failed to freeze account' },
        { status: 500 }
      )
    }

    // Log to audit table
    const { error: auditError } = await supabase
      .from('credit_audit_log')
      .insert({
        user_id: profile.id,
        action: 'account_frozen',
        credits_before: 0, // Credits don't change
        credits_after: 0,
        credits_changed: 0,
        metadata: {
          frozen_at: new Date().toISOString(),
          stripe_subscription_id: profile.stripe_subscription_id
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Account has been frozen. You will not be able to book classes but your credits are preserved.',
      data: {
        frozen: true,
        frozen_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Freeze account error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check freeze status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('frozen, frozen_at')
      .eq('email', session.user.email)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        frozen: profile.frozen || false,
        frozen_at: profile.frozen_at || null
      }
    })

  } catch (error) {
    console.error('Get freeze status error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}