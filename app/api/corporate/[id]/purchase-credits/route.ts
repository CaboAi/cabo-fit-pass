import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider, createCheckoutMetadata } from '@/lib/payments/provider'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { creditAmount } = await request.json()
    
    if (!creditAmount || creditAmount <= 0) {
      return NextResponse.json({ error: 'Valid credit amount is required' }, { status: 400 })
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

    // Get corporate account
    const { data: corporate, error: corporateError } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()
    
    if (corporateError || !corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    // Calculate price with discount
    const basePrice = creditAmount * 1.50 // $1.50 per credit
    const discountAmount = basePrice * corporate.discount_rate
    const finalPrice = basePrice - discountAmount

    // Create Stripe checkout session
    const paymentProvider = await getPaymentProvider()
    
    const checkoutSession = await paymentProvider.createCheckoutSession({
      customerId: corporate.stripe_customer_id,
      customerEmail: corporate.contact_email,
      lineItems: [{
        name: `Corporate Credit Purchase - ${corporate.business_name}`,
        description: `${creditAmount} credits with ${(corporate.discount_rate * 100).toFixed(0)}% discount`,
        amount: Math.round(finalPrice * 100), // Convert to cents
        currency: 'usd',
        quantity: 1
      }],
      successUrl: `${process.env.NEXTAUTH_URL}/admin/corporate?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/admin/corporate?payment=cancelled`,
      metadata: createCheckoutMetadata({
        userId: corporate.id,
        kind: 'corporate_purchase',
        credits: creditAmount,
        discountRate: corporate.discount_rate.toString(),
        businessName: corporate.business_name
      })
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error) {
    console.error('Error creating corporate purchase session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
