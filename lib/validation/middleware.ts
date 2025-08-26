import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CreditManager } from '@/lib/credits/credit-rules'
import { validateWebhookSignature } from '@/lib/stripe/security'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const event = validateWebhookSignature(body, signature)
    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createClient()
    const creditManager = new CreditManager(supabase)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, creditManager, supabase)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, creditManager, supabase)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, creditManager, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, creditManager: CreditManager, supabase: any) {
  const { mode, itemType, plan, userId } = session.metadata || {}
  
  if (!userId) {
    console.error('No userId in session metadata')
    return
  }

  if (mode === 'subscription') {
    // Update billing cycle anchor to 28th
    if (session.subscription) {
      const now = new Date()
      const billingAnchor = new Date(now.getFullYear(), now.getMonth(), 28)
      if (billingAnchor < now) {
        billingAnchor.setMonth(billingAnchor.getMonth() + 1)
      }

      await stripe.subscriptions.update(session.subscription as string, {
        billing_cycle_anchor: 'now',  // Use 'now' instead of timestamp
        proration_behavior: 'none'
      })

      // Grant monthly credits and persist subscription
      await creditManager.activateSubscription(userId, plan, session.subscription as string)
    }
  } else if (mode === 'payment') {
    if (itemType === 'topup') {
      await creditManager.addTopupCredits(userId, plan, session.amount_total || 0)
    } else if (itemType === 'tourist_pass') {
      await creditManager.addTouristPassCredits(userId, plan)
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, creditManager: CreditManager, supabase: any) {
  // Use type assertion to access the subscription property
  const subscriptionId = (invoice as any).subscription_id || (invoice as any).subscription
  
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const { userId, plan } = subscription.metadata || {}
    
    if (userId && plan) {
      await creditManager.processMonthlyReset(userId)
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, creditManager: CreditManager, supabase: any) {
  // Redundant handling for payment success
  const { userId, itemType, plan } = paymentIntent.metadata || {}
  
  if (userId && itemType === 'topup') {
    await creditManager.addTopupCredits(userId, plan, paymentIntent.amount)
  }
}
