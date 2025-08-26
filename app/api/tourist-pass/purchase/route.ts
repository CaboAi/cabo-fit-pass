import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider, createCheckoutMetadata } from '@/lib/payments/provider'
import { TOURIST_PACKAGES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passType } = await request.json()
    
    if (!passType) {
      return NextResponse.json({ error: 'Pass type is required' }, { status: 400 })
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

    // Get tourist pass product
    const product = TOURIST_PACKAGES.find(pkg => pkg.id === passType)
    
    if (!product) {
      return NextResponse.json({ error: 'Invalid pass type' }, { status: 400 })
    }

    // Calculate expiration (default to 7 days for tourist passes)
    const expiresAfter = new Date()
    expiresAfter.setDate(expiresAfter.getDate() + 7)

    // Create Stripe checkout session
    const paymentProvider = await getPaymentProvider()
    
    const checkoutSession = await paymentProvider.createCheckoutSession({
      customerId: profile.stripe_customer_id,
      customerEmail: session.user.email,
      lineItems: [{
        name: product.name,
        description: `${product.description} - valid for 7 days`,
        amount: product.price * 100, // Convert to cents
        currency: 'usd',
        quantity: 1
      }],
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
      metadata: createCheckoutMetadata({
        userId: profile.id,
        kind: 'tourist_pass',
        credits: 0, // Tourist passes don't add credits, they enable access
        passType: passType,
        validityDays: 7,
        expiresAfter: expiresAfter.toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error) {
    console.error('Error creating tourist pass session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
