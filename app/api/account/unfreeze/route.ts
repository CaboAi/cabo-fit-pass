import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { SUBSCRIPTION_TIERS } from '@/lib/billing'

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
      .select('id, tier, frozen, stripe_customer_id, stripe_subscription_id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if not frozen
    if (!profile.frozen) {
      return NextResponse.json(
        { success: false, error: 'Account is not frozen' },
        { status: 400 }
      )
    }

    // Update Stripe subscription back to original tier if user has a subscription
    if (profile.stripe_subscription_id) {
      try {
        // Get current subscription
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
        
        // Get the previous price ID from metadata or use current tier
        const previousPriceId = subscription.metadata.previous_price_id || 
          SUBSCRIPTION_TIERS[profile.tier as keyof typeof SUBSCRIPTION_TIERS].stripePriceId

        // Update back to original plan
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price: previousPriceId
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            ...subscription.metadata,
            unfrozen_at: new Date().toISOString(),
            previous_price_id: undefined // Clear the previous price ID
          }
        })

        console.log(`Updated Stripe subscription ${profile.stripe_subscription_id} back to original plan`)
      } catch (stripeError) {
        console.error('Failed to update Stripe subscription:', stripeError)
        // Continue with unfreezing even if Stripe update fails
        // Manual intervention may be needed
      }
    }

    // Unfreeze account in database
    const { error: unfreezeError } = await supabase
      .from('profiles')
      .update({ 
        frozen: false,
        frozen_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (unfreezeError) {
      console.error('Failed to unfreeze account:', unfreezeError)
      return NextResponse.json(
        { success: false, error: 'Failed to unfreeze account' },
        { status: 500 }
      )
    }

    // Get current credit balance for audit log
    const { data: creditData } = await supabase
      .rpc('get_active_credits', { p_user: profile.id })

    const currentCredits = creditData || 0

    // Log to audit table
    const { error: auditError } = await supabase
      .from('credit_audit_log')
      .insert({
        user_id: profile.id,
        action: 'account_unfrozen',
        credits_before: currentCredits,
        credits_after: currentCredits,
        credits_changed: 0,
        metadata: {
          unfrozen_at: new Date().toISOString(),
          stripe_subscription_id: profile.stripe_subscription_id,
          tier: profile.tier
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Account has been unfrozen. You can now book classes again.',
      data: {
        frozen: false,
        unfrozen_at: new Date().toISOString(),
        current_credits: currentCredits
      }
    })

  } catch (error) {
    console.error('Unfreeze account error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}