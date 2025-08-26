import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe'
import { STRIPE_PRICE_IDS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mode, itemType, plan, successUrl, cancelUrl } = await request.json()
    
    if (!mode || !itemType || !plan) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let checkoutSession: any

    if (mode === 'subscription') {
      // Validate subscription plan
      if (!['tier1', 'tier2', 'tier3'].includes(plan)) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 })
      }

      const priceId = STRIPE_PRICE_IDS.subscriptions[plan as keyof typeof STRIPE_PRICE_IDS.subscriptions]
      if (!priceId) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 })
      }

      // Calculate billing anchor to 28th of month
      const now = new Date()
      let billingAnchor = new Date(now.getFullYear(), now.getMonth(), 28)
      if (billingAnchor < now) {
        billingAnchor.setMonth(billingAnchor.getMonth() + 1)
      }

      try {
        checkoutSession = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer_email: session.user.email,
          line_items: [{
            price: priceId,
            quantity: 1,
          }],
          subscription_data: {
            billing_cycle_anchor: Math.floor(billingAnchor.getTime() / 1000),
            proration_behavior: 'none',
            metadata: {
              userId: profile.id,
              itemType,
              plan,
              credits: getCreditsForTier(plan)
            }
          },
          metadata: {
            userId: profile.id,
            itemType,
            plan
          },
          success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
          cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
        })
      } catch (stripeError) {
        console.error('Stripe subscription creation error:', stripeError)
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
      }
    } else if (mode === 'payment') {
      // Validate payment parameters
      if (itemType === 'topup' && !['starter', 'standard', 'premium'].includes(plan)) {
        return NextResponse.json({ error: 'Invalid topup plan' }, { status: 400 })
      }
      if (itemType === 'tourist_pass' && plan !== '7day') {
        return NextResponse.json({ error: 'Invalid tourist pass plan' }, { status: 400 })
      }

      // Fix: Use a simpler approach to get the price ID
      let priceId: string | undefined
      
      if (itemType === 'topup') {
        priceId = STRIPE_PRICE_IDS.topup[plan as keyof typeof STRIPE_PRICE_IDS.topup]
      } else if (itemType === 'tourist_pass') {
        priceId = STRIPE_PRICE_IDS.tourist_pass[plan as keyof typeof STRIPE_PRICE_IDS.tourist_pass]
      }
      
      if (!priceId) {
        return NextResponse.json({ error: 'Invalid price configuration' }, { status: 400 })
      }

      try {
        checkoutSession = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: session.user.email,
          line_items: [{
            price: priceId,
            quantity: 1,
          }],
          metadata: {
            userId: profile.id,
            itemType,
            plan,
            credits: getCreditsForItem(itemType, plan)
          },
          success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
          cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
        })
      } catch (stripeError) {
        console.error('Stripe payment creation error:', stripeError)
        return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    if (!checkoutSession?.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getCreditsForTier(tier: string): number {
  const tierCredits: Record<string, number> = {
    'tier1': 10,
    'tier2': 25,
    'tier3': 50
  }
  return tierCredits[tier] || 0
}

function getCreditsForItem(itemType: string, plan: string): number {
  if (itemType === 'topup') {
    const topupCredits: Record<string, number> = {
      'starter': 12,
      'standard': 33,
      'premium': 70
    }
    return topupCredits[plan] || 0
  } else if (itemType === 'tourist_pass') {
    return 3
  }
  return 0
}
