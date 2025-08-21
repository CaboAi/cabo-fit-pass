import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TOURIST_PASS_CONFIG, type TouristPassType } from '@/lib/billing'
import { getPaymentProvider, createCheckoutMetadata, isMockProvider } from '@/lib/payments/provider'

interface TouristPassRequest {
  passType: TouristPassType
}

interface TouristPassResponse {
  sessionUrl: string
  sessionId: string
  provider: string
  isMock: boolean
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

    const { passType }: TouristPassRequest = await request.json()

    // Validate pass type
    if (!passType || !TOURIST_PASS_CONFIG[passType]) {
      return NextResponse.json(
        { success: false, error: 'Invalid tourist pass type' },
        { status: 400 }
      )
    }

    const passConfig = TOURIST_PASS_CONFIG[passType]
    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active tourist pass
    const { data: existingPass, error: passError } = await supabase
      .from('tourist_pass')
      .select('id, ends_at, classes_total, classes_used')
      .eq('user_id', profile.id)
      .gte('ends_at', new Date().toISOString())
      .gt('classes_total', 'classes_used')
      .single()

    if (!passError && existingPass) {
      return NextResponse.json(
        { 
          success: false, 
          error: `You already have an active tourist pass that expires on ${new Date(existingPass.ends_at).toLocaleDateString()}. Please wait for it to expire before purchasing a new one.`
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
      kind: 'tourist_pass',
      passType
    })
    
    const checkoutSession = await paymentProvider.createCheckoutSession({
      customerId,
      lineItems: [{
        name: passConfig.name,
        description: `${passConfig.durationDays}-day tourist pass with ${passConfig.classes} classes included`,
        amount: passConfig.priceUsd * 100, // Convert to cents
        currency: 'usd',
        quantity: 1
      }],
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?purchase=success&pass=${passType}`,
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
    console.error('Tourist pass checkout API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check tourist pass options and eligibility
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
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check for existing active tourist pass
    const { data: activePasses, error: passError } = await supabase
      .from('tourist_pass')
      .select('*')
      .eq('user_id', profile.id)
      .gte('ends_at', new Date().toISOString())
      .gt('classes_total', 'classes_used')

    if (passError) {
      console.error('Error checking active passes:', passError)
    }

    const hasActivePass = activePasses && activePasses.length > 0
    const activePass = hasActivePass ? activePasses[0] : null

    // Convert config to API format
    const availablePasses = Object.entries(TOURIST_PASS_CONFIG).map(([key, config]) => ({
      id: key,
      ...config,
      eligible: !hasActivePass,
      reason: hasActivePass ? 'You already have an active tourist pass' : 'Available for purchase'
    }))

    return NextResponse.json({
      success: true,
      data: {
        availablePasses,
        hasActivePass,
        activePass: activePass ? {
          id: activePass.id,
          startsAt: activePass.starts_at,
          endsAt: activePass.ends_at,
          classesTotal: activePass.classes_total,
          classesUsed: activePass.classes_used,
          classesRemaining: activePass.classes_total - activePass.classes_used
        } : null
      }
    })

  } catch (error) {
    console.error('Tourist pass options API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}