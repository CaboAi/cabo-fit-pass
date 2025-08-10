import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock credit packages for development
const CREDIT_PACKAGES = [
  { id: 'basic', name: 'Basic Pack', credits: 5, bonus: 1, price: '$25', priceUSD: 2500 },
  { id: 'premium', name: 'Premium Pack', credits: 12, bonus: 3, price: '$50', priceUSD: 5000 },
  { id: 'ultimate', name: 'Ultimate Pack', credits: 25, bonus: 10, price: '$99', priceUSD: 9900 },
]

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

    // Mock payment intent for development
    const mockPaymentIntent = {
      client_secret: `pi_mock_${Date.now()}_secret`,
    }

    return NextResponse.json({
      clientSecret: mockPaymentIntent.client_secret,
      credits: creditPackage.credits + creditPackage.bonus,
      price: creditPackage.price,
      priceUSD: creditPackage.priceUSD / 100, // Convert back to dollars
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}