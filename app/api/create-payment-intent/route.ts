import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPaymentProvider, createCheckoutMetadata } from '@/lib/payments/provider'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES } from '@/lib/stripe'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
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

    // Find the credit package
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
    
    if (!creditPackage) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 })
    }

    const paymentProvider = await getPaymentProvider()
    
    // Create checkout session
    const checkoutSession = await paymentProvider.createCheckoutSession({
      customerId: profile.stripe_customer_id,
      customerEmail: session.user.email,
      lineItems: [{
        name: creditPackage.name,
        description: `${creditPackage.credits} credits${creditPackage.bonus > 0 ? ` + ${creditPackage.bonus} bonus` : ''}`,
        amount: creditPackage.priceUSD, // Price in cents
        currency: 'usd',
        quantity: 1
      }],
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
      metadata: createCheckoutMetadata({
        userId: profile.id,
        kind: 'topup',
        credits: creditPackage.credits + creditPackage.bonus,
        packType: packageId,
        creditsBefore: profile.credits
      })
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      credits: creditPackage.credits + creditPackage.bonus,
      price: creditPackage.price,
      priceUSD: creditPackage.priceUSD / 100
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}