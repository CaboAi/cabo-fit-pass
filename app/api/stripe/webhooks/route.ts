import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CreditManager } from '@/lib/credits/credit-rules'
import { validateWebhookSignature } from '@/lib/stripe/security'
import { createComponentLogger, extractRequestContext } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  const logger = createComponentLogger('stripe-webhooks')
  const startTime = Date.now()
  const requestContext = extractRequestContext(request)
  
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    logger.info('Stripe webhook received', {
      ...requestContext,
      action: 'webhook-receive',
      metadata: { hasSignature: !!signature }
    })

    if (!signature) {
      logger.warn('Missing Stripe webhook signature', {
        ...requestContext,
        action: 'validate-signature',
        errorCode: 'MISSING_SIGNATURE'
      })
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const event = validateWebhookSignature(body, signature)
    if (!event) {
      logger.error('Invalid Stripe webhook signature', {
        ...requestContext,
        action: 'validate-signature',
        errorCode: 'INVALID_SIGNATURE'
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const eventLogger = logger.child({
      ...requestContext,
      metadata: {
        eventId: event.id,
        eventType: event.type,
        created: event.created
      }
    })

    eventLogger.info('Processing Stripe webhook event', {
      action: 'process-webhook',
      metadata: { eventType: event.type }
    })

    const supabase = createClient()
    const creditManager = new CreditManager(supabase)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, creditManager, supabase, eventLogger)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, creditManager, supabase, eventLogger)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, creditManager, supabase, eventLogger)
        break
      
      default:
        eventLogger.info('Unhandled Stripe event type', {
          action: 'skip-event',
          metadata: { eventType: event.type }
        })
    }

    const duration = Date.now() - startTime
    eventLogger.info('Stripe webhook processed successfully', {
      action: 'webhook-complete',
      duration,
      statusCode: 200
    })

    return NextResponse.json({ received: true })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Stripe webhook processing failed', {
      ...requestContext,
      action: 'process-webhook',
      duration,
      statusCode: 500,
      errorCode: 'WEBHOOK_PROCESSING_FAILED'
    }, error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, creditManager: CreditManager, supabase: any, logger: any) {
  const { mode, itemType, plan, userId } = session.metadata || {}
  
  logger.info('Processing checkout completed', {
    action: 'checkout-completed',
    metadata: { mode, itemType, plan, userId, sessionId: session.id }
  })
  
  if (!userId) {
    logger.error('No userId in session metadata', {
      action: 'checkout-completed',
      errorCode: 'MISSING_USER_ID',
      metadata: { sessionId: session.id }
    })
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
        billing_cycle_anchor: Math.floor(billingAnchor.getTime() / 1000) as any,  // Type assertion
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

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, creditManager: CreditManager, supabase: any, logger?: any) {
  // Use the correct property for latest Stripe version
  const subscriptionId = (invoice as any).subscription_id || (invoice as any).subscription
  
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const { userId, plan } = subscription.metadata || {}
    
    if (userId && plan) {
      await creditManager.processMonthlyReset(userId)
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, creditManager: CreditManager, supabase: any, logger?: any) {
  // Redundant handling for payment success
  const { userId, itemType, plan } = paymentIntent.metadata || {}
  
  if (userId && itemType === 'topup') {
    await creditManager.addTopupCredits(userId, plan, paymentIntent.amount)
  }
}