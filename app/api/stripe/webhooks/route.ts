import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { addTopUp, addTouristPass } from '@/utils/credits'
import { PACKS, TOURIST_PASS_CONFIG } from '@/lib/billing'
import { isMockProvider } from '@/lib/payments/provider'

// Stripe webhook secret from environment
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    // If Stripe is disabled, return early
    if (process.env.FEATURE_STRIPE === 'false' || isMockProvider()) {
      console.log('[Webhook] Stripe webhooks disabled, returning 204')
      return new NextResponse(null, { status: 204 })
    }

    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured')
        return NextResponse.json(
          { error: 'Webhook secret not configured' },
          { status: 500 }
        )
      }
      
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`[Webhook] Received event: ${event.type}`)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Extract metadata
        const metadata = session.metadata || {}
        const userId = metadata.user_id
        const kind = metadata.kind // 'topup', 'tourist_pass', 'subscription'
        
        if (!userId) {
          console.error('No user_id in session metadata:', session.id)
          return NextResponse.json(
            { error: 'Missing user_id in metadata' },
            { status: 400 }
          )
        }

        const supabase = createClient()

        // Handle different purchase types
        if (kind === 'topup' && metadata.credits) {
          // Process credit top-up
          const credits = parseInt(metadata.credits)
          const packType = metadata.pack_type // 'starter', 'standard', 'premium'
          
          try {
            await addTopUp(userId, credits, session.id)
            
            // Log to audit table
            const { error: auditError } = await supabase
              .from('credit_audit_log')
              .insert({
                user_id: userId,
                action: 'topup',
                credits_before: parseInt(metadata.credits_before || '0'),
                credits_after: parseInt(metadata.credits_before || '0') + credits,
                credits_changed: credits,
                metadata: {
                  stripe_session_id: session.id,
                  pack_type: packType,
                  amount_paid: session.amount_total
                }
              })
            
            if (auditError) {
              console.error('Failed to create audit log:', auditError)
            }
            
            console.log(`Processed top-up: ${credits} credits for user ${userId}`)
          } catch (error) {
            console.error('Failed to process top-up:', error)
            return NextResponse.json(
              { error: 'Failed to process top-up' },
              { status: 500 }
            )
          }
        } else if (kind === 'tourist_pass') {
          // Process tourist pass purchase
          const passType = metadata.pass_type as keyof typeof TOURIST_PASS_CONFIG
          const passConfig = TOURIST_PASS_CONFIG[passType]
          
          if (!passConfig) {
            console.error('Invalid pass type:', passType)
            return NextResponse.json(
              { error: 'Invalid pass type' },
              { status: 400 }
            )
          }
          
          try {
            await addTouristPass(
              userId,
              passConfig.durationDays,
              passConfig.classes,
              session.id
            )
            
            // Log to audit table
            const { error: auditError } = await supabase
              .from('credit_audit_log')
              .insert({
                user_id: userId,
                action: 'tourist_pass_purchase',
                credits_before: 0,
                credits_after: 0,
                credits_changed: 0,
                metadata: {
                  stripe_session_id: session.id,
                  pass_type: passType,
                  duration_days: passConfig.durationDays,
                  classes_included: passConfig.classes,
                  amount_paid: session.amount_total
                }
              })
            
            if (auditError) {
              console.error('Failed to create audit log:', auditError)
            }
            
            console.log(`Processed tourist pass: ${passType} for user ${userId}`)
          } catch (error) {
            console.error('Failed to process tourist pass:', error)
            return NextResponse.json(
              { error: 'Failed to process tourist pass' },
              { status: 500 }
            )
          }
        } else if (kind === 'subscription') {
          // Handle new subscription or tier change
          const tier = metadata.tier as 't1' | 't2' | 't3'
          
          try {
            // Update user tier
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                tier,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
            
            if (updateError) {
              throw updateError
            }
            
            console.log(`Updated user ${userId} to tier ${tier}`)
          } catch (error) {
            console.error('Failed to update subscription:', error)
            return NextResponse.json(
              { error: 'Failed to update subscription' },
              { status: 500 }
            )
          }
        }
        
        break
      }

      case 'invoice.paid': {
        // Handle recurring subscription payments
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Get user by Stripe customer ID
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, tier')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (profileError || !profile) {
          console.error('Profile not found for customer:', customerId)
          break
        }
        
        // Check if this is a freeze plan payment
        const freezePlanPriceId = process.env.STRIPE_PRICE_FREEZE
        const invoiceItems = invoice.lines.data
        const isFreezePlan = invoiceItems.some(item => 
          item.price?.id === freezePlanPriceId
        )
        
        if (isFreezePlan) {
          // Ensure account is frozen
          const { error: freezeError } = await supabase
            .from('profiles')
            .update({ 
              frozen: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)
          
          if (freezeError) {
            console.error('Failed to freeze account:', freezeError)
          } else {
            console.log(`Account frozen for user ${profile.id}`)
          }
        }
        
        break
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (profileError || !profile) {
          console.error('Profile not found for customer:', customerId)
          break
        }
        
        // Downgrade to free tier
        const { error: downgradeError } = await supabase
          .from('profiles')
          .update({ 
            tier: 't1',
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
        
        if (downgradeError) {
          console.error('Failed to downgrade user:', downgradeError)
        } else {
          console.log(`User ${profile.id} downgraded to free tier`)
        }
        
        break
      }

      case 'customer.subscription.updated': {
        // Handle subscription changes (upgrades/downgrades)
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id
        
        // Determine tier from price ID
        let newTier: 't1' | 't2' | 't3' | null = null
        if (priceId === process.env.STRIPE_PRICE_TIER1) newTier = 't1'
        else if (priceId === process.env.STRIPE_PRICE_TIER2) newTier = 't2'
        else if (priceId === process.env.STRIPE_PRICE_TIER3) newTier = 't3'
        
        if (!newTier) {
          console.log('Unknown price ID, skipping tier update:', priceId)
          break
        }
        
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, tier')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (profileError || !profile) {
          console.error('Profile not found for customer:', customerId)
          break
        }
        
        if (profile.tier !== newTier) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              tier: newTier,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)
          
          if (updateError) {
            console.error('Failed to update tier:', updateError)
          } else {
            console.log(`User ${profile.id} tier changed from ${profile.tier} to ${newTier}`)
          }
        }
        
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
        // For unhandled events, still return success to acknowledge receipt
        break
    }

    console.log(`[Webhook] Successfully processed event: ${event.type}`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook testing/status
export async function GET(request: NextRequest): Promise<NextResponse> {
  const webhookStatus = {
    stripeEnabled: process.env.FEATURE_STRIPE === 'true',
    isMockProvider: isMockProvider(),
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    message: 'Stripe webhook endpoint status',
    data: webhookStatus
  })
}

// Stripe requires raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
}