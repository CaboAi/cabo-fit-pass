import { NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments/provider'

export async function GET(): Promise<NextResponse> {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Development endpoint not available in production' },
        { status: 403 }
      )
    }

    const provider = getPaymentProvider()
    const providerName = provider.constructor.name
    const isStripeEnabled = process.env.FEATURE_STRIPE === 'true'

    return NextResponse.json({
      success: true,
      data: {
        provider: providerName,
        stripeEnabled: isStripeEnabled,
        environment: process.env.NODE_ENV,
        features: {
          stripe: isStripeEnabled,
          mock: !isStripeEnabled
        }
      }
    })

  } catch (error) {
    console.error('Payment provider status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get provider status' },
      { status: 500 }
    )
  }
}