import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments/provider'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Development endpoint not available in production' },
        { status: 403 }
      )
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const provider = getPaymentProvider()

    // Check if it's the mock provider
    if (provider.constructor.name !== 'MockProvider') {
      return NextResponse.json(
        { success: false, error: 'This endpoint only works with MockProvider' },
        { status: 400 }
      )
    }

    // Complete the checkout session (mock provider specific)
    await (provider as any).completeCheckoutSession(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Checkout session completed successfully',
      sessionId
    })

  } catch (error) {
    console.error('Complete checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete checkout' },
      { status: 500 }
    )
  }
}