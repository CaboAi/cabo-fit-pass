import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'

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

    // Find the credit package
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
    
    if (!creditPackage) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 })
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: creditPackage.priceUSD, // Amount in cents
      currency: 'usd',
      metadata: {
        userId: session.user.email,
        packageId: packageId,
        credits: (creditPackage.credits + creditPackage.bonus).toString(),
      },
      description: `${creditPackage.name} for Cabo Fit Pass`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      credits: creditPackage.credits + creditPackage.bonus,
      price: creditPackage.price,
      priceUSD: creditPackage.priceUSD / 100, // Convert back to dollars
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}