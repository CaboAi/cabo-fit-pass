import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_RULES } from '@/lib/credits/credit-rules'
import { TOPUP_PACKAGES } from '@/lib/stripe'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await request.json()
    
    if (!packageId || !TOPUP_PACKAGES.find(pkg => pkg.id === packageId)) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 })
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

    const pack = TOPUP_PACKAGES.find(pkg => pkg.id === packageId)!
    const totalCredits = pack.credits + pack.bonus
    
    // Check credit cap using new credit rules
    const tier = profile.subscription_tier || 'tier1'
    const tierRules = CREDIT_RULES.subscriptionTiers[tier]
    const currentCredits = profile.credits || 0
    
    if (currentCredits + totalCredits > tierRules.cap) {
      return NextResponse.json({ 
        error: `Credit cap reached. Cannot exceed ${tierRules.cap} credits.` 
      }, { status: 400 })
    }

    // Calculate expiration date (90 days from now)
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 90)

    // Create Stripe checkout session using the new checkout API
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/checkout/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'payment',
        itemType: 'topup',
        plan: packageId,
        successUrl: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const { url } = await response.json()

    return NextResponse.json({
      success: true,
      url
    })

  } catch (error) {
    console.error('Error creating top-up session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check purchase eligibility using new credit rules
export async function GET(request: NextRequest) {
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
      .select('id, subscription_tier, credits')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = profile.subscription_tier || 'tier1'
    const currentCredits = profile.credits || 0
    const tierRules = CREDIT_RULES.subscriptionTiers[tier]

    // Check eligibility for each pack using new credit rules
    const eligibility = TOPUP_PACKAGES.reduce((acc, pack) => {
      const totalCredits = pack.credits + pack.bonus
      const canPurchase = currentCredits + totalCredits <= tierRules.cap
      
      return {
        ...acc,
        [pack.id]: {
          eligible: canPurchase,
          currentCredits,
          wouldHave: currentCredits + totalCredits,
          tierCap: tierRules.cap,
          message: canPurchase 
            ? `You can purchase this pack`
            : `This would exceed your tier cap of ${tierRules.cap} credits`
        }
      }
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        tier,
        currentCredits,
        tierCap: tierRules.cap,
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