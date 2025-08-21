import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, getActiveCredits, canPurchaseTopUp } from '@/utils/credits'
import { PACKS, isPurchaseWithinCap, TIER_CAPS, type PackType } from '@/lib/billing'
import { getPaymentProvider, createCheckoutMetadata, isMockProvider } from '@/lib/payments/provider'

interface TopUpRequest {
  pack: PackType
}

interface TopUpResponse {
  sessionUrl: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pack }: TopUpRequest = await request.json()

    // Validate pack type
    if (!pack || !PACKS[pack]) {
      return NextResponse.json(
        { success: false, error: 'Invalid pack type' },
        { status: 400 }
      )
    }

    const packDetails = PACKS[pack]
    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tier, stripe_customer_id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get user's current tier and active credits
    const tier = await getUserTier(profile.id)
    const currentCredits = await getActiveCredits(profile.id)

    // Check if purchase would exceed tier cap
    const canPurchase = await canPurchaseTopUp(profile.id, tier, packDetails.credits)
    
    if (!canPurchase) {
      const projectedBalance = currentCredits + packDetails.credits
      return NextResponse.json(
        { 
          success: false, 
          error: `Purchase would exceed your tier cap. You have ${currentCredits} credits and this would bring you to ${projectedBalance}, but your cap is ${TIER_CAPS[tier]}. Please use some credits before purchasing more.`
        },
        { status: 400 }
      )
    }

    // Get payment provider
    const paymentProvider = getPaymentProvider()
    
    // Create or retrieve customer
    let customerId = profile.stripe_customer_id
    
    if (!customerId) {
      const customer = await paymentProvider.createCustomer(
        session.user.email,
        { user_id: profile.id }
      )
      customerId = customer.id
      
      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id)
    }
    
    // Create checkout session
    const metadata = createCheckoutMetadata({
      userId: profile.id,
      kind: 'topup',
      credits: packDetails.credits,
      packType: pack,
      creditsBefore: currentCredits
    })
    
    const checkoutSession = await paymentProvider.createCheckoutSession({
      customerId,
      lineItems: [{
        name: `${packDetails.credits} Credits Package`,
        description: `Add ${packDetails.credits} credits to your Cabo Fit Pass account`,
        amount: packDetails.priceUsd * 100, // Convert to cents
        currency: 'usd',
        quantity: 1
      }],
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?purchase=success&credits=${packDetails.credits}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard?purchase=cancelled`,
      metadata
    })
    
    if (!checkoutSession.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        provider: paymentProvider.getProviderName(),
        isMock: isMockProvider()
      }
    })

  } catch (error) {
    console.error('Top-up API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check purchase eligibility
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tier')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = await getUserTier(profile.id)
    const currentCredits = await getActiveCredits(profile.id)

    // Check eligibility for each pack
    const eligibility = Object.entries(PACKS).reduce((acc, [packName, packDetails]) => {
      const canPurchase = isPurchaseWithinCap(currentCredits, packDetails.credits, tier)
      return {
        ...acc,
        [packName]: {
          eligible: canPurchase,
          currentCredits,
          wouldHave: currentCredits + packDetails.credits,
          tierCap: TIER_CAPS[tier],
          message: canPurchase 
            ? `You can purchase this pack`
            : `This would exceed your tier cap of ${TIER_CAPS[tier]} credits`
        }
      }
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        tier,
        currentCredits,
        tierCap: TIER_CAPS[tier],
        packs: eligibility
      }
    })

  } catch (error) {
    console.error('Eligibility check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}