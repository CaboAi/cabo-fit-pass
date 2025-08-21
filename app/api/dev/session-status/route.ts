import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments/provider'

// Development endpoint to check mock session status

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Security guard - only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const paymentProvider = getPaymentProvider()
    const session = await paymentProvider.getCheckoutSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        metadata: session.metadata,
        provider: paymentProvider.getProviderName()
      }
    })

  } catch (error) {
    console.error('Session status check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}