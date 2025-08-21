import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, getActiveCredits, canPurchaseTopUp, addTopUp } from '@/utils/credits'
import { PACKS, TIER_CAPS, type PackType } from '@/lib/billing'

// This endpoint bypasses payment processing for development/testing
// Only available in non-production environments with mock payment provider

interface DirectTopUpRequest {
  pack: PackType
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Security guards - only allow in development with mock provider
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Endpoint not available in production' },
      { status: 403 }
    )
  }

  if (process.env.FEATURE_STRIPE === 'true') {
    return NextResponse.json(
      { success: false, error: 'Direct endpoints only available with mock payment provider' },
      { status: 403 }
    )
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pack }: DirectTopUpRequest = await request.json()

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
      .select('id, tier, frozen')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if account is frozen
    if (profile.frozen) {
      return NextResponse.json(
        { success: false, error: 'Cannot purchase credits while account is frozen' },
        { status: 403 }
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

    // Generate mock transaction ID for tracking
    const mockTransactionId = `dev_topup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Directly add credits (bypassing payment processing)
    await addTopUp(profile.id, packDetails.credits, mockTransactionId)

    // Get updated balance
    const newBalance = await getActiveCredits(profile.id)

    // Log to audit table
    const { error: auditError } = await supabase
      .from('credit_audit_log')
      .insert({
        user_id: profile.id,
        action: 'topup',
        credits_before: currentCredits,
        credits_after: newBalance,
        credits_changed: packDetails.credits,
        metadata: {
          transaction_id: mockTransactionId,
          pack_type: pack,
          amount_paid: packDetails.priceUsd * 100, // in cents
          provider: 'dev_direct',
          development_mode: true
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    console.log(`[DEV] Direct top-up: ${packDetails.credits} credits added to user ${profile.id}`)

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully added ${packDetails.credits} credits to your account`,
        creditsAdded: packDetails.credits,
        previousBalance: currentCredits,
        newBalance,
        transactionId: mockTransactionId,
        packType: pack,
        isDevelopment: true
      }
    })

  } catch (error) {
    console.error('Direct top-up API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to show available packs for direct purchase
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Security guards
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Endpoint not available in production' },
      { status: 403 }
    )
  }

  if (process.env.FEATURE_STRIPE === 'true') {
    return NextResponse.json(
      { success: false, error: 'Direct endpoints only available with mock payment provider' },
      { status: 403 }
    )
  }

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
      .select('id, tier, frozen')
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
    const packsWithEligibility = await Promise.all(
      Object.entries(PACKS).map(async ([packName, packDetails]) => {
        const eligible = await canPurchaseTopUp(profile.id, tier, packDetails.credits)
        const projectedBalance = currentCredits + packDetails.credits
        
        return {
          id: packName,
          name: `${packDetails.credits} Credits Package`,
          credits: packDetails.credits,
          price: packDetails.priceUsd,
          eligible,
          projectedBalance,
          tierCap: TIER_CAPS[tier],
          reason: eligible 
            ? 'Available for purchase'
            : `Would exceed tier cap of ${TIER_CAPS[tier]} credits`
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        currentCredits,
        tier,
        tierCap: TIER_CAPS[tier],
        accountFrozen: profile.frozen,
        availablePacks: packsWithEligibility,
        isDevelopment: true
      }
    })

  } catch (error) {
    console.error('Direct top-up options error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}