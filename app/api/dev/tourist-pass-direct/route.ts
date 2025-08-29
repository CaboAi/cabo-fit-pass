import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { addTouristPass } from '@/utils/credits'
import { TOURIST_PASS_CONFIG, type TouristPassType } from '@/lib/billing'

// This endpoint bypasses payment processing for development/testing
// Only available in non-production environments with mock payment provider

interface DirectTouristPassRequest {
  passType: TouristPassType
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

    const { passType }: DirectTouristPassRequest = await request.json()

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
      .select('id, frozen')
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
        { success: false, error: 'Cannot purchase tourist pass while account is frozen' },
        { status: 403 }
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

    // Generate mock transaction ID for tracking
    const mockTransactionId = `dev_tourist_pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Directly add tourist pass (bypassing payment processing)
    await addTouristPass(
      profile.id,
      passConfig.durationDays,
      passConfig.classes,
      mockTransactionId
    )

    // Get the created pass for response
    const { data: newPass } = await supabase
      .from('tourist_pass')
      .select('*')
      .eq('stripe_session_id', mockTransactionId)
      .single()

    // Log to audit table
    const { error: auditError } = await supabase
      .from('credit_audit_log')
      .insert({
        user_id: profile.id,
        action: 'tourist_pass_purchase',
        credits_before: 0, // Passes don't affect credit balance
        credits_after: 0,
        credits_changed: 0,
        metadata: {
          transaction_id: mockTransactionId,
          pass_type: passType,
          duration_days: passConfig.durationDays,
          classes_included: passConfig.classes,
          amount_paid: passConfig.priceUsd * 100, // in cents
          provider: 'dev_direct',
          development_mode: true
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    console.log(`[DEV] Direct tourist pass: ${passType} created for user ${profile.id}`)

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully created ${passConfig.name}`,
        passType,
        passConfig,
        touristPass: newPass ? {
          id: newPass.id,
          startsAt: newPass.starts_at,
          endsAt: newPass.ends_at,
          classesTotal: newPass.classes_total,
          classesUsed: newPass.classes_used,
          classesRemaining: newPass.classes_total - newPass.classes_used
        } : null,
        transactionId: mockTransactionId,
        isDevelopment: true
      }
    })

  } catch (error) {
    console.error('Direct tourist pass API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to show available tourist passes for direct purchase
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
      .select('id, frozen')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check for existing active tourist passes
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

    // Convert config to API format with eligibility
    const availablePasses = Object.entries(TOURIST_PASS_CONFIG).map(([key, config]) => ({
      id: key,
      ...config,
      eligible: !hasActivePass && !profile.frozen,
      reason: profile.frozen 
        ? 'Account is frozen'
        : hasActivePass 
          ? 'You already have an active tourist pass' 
          : 'Available for purchase'
    }))

    return NextResponse.json({
      success: true,
      data: {
        accountFrozen: profile.frozen,
        hasActivePass,
        activePass: activePass ? {
          id: activePass.id,
          startsAt: activePass.starts_at,
          endsAt: activePass.ends_at,
          classesTotal: activePass.classes_total,
          classesUsed: activePass.classes_used,
          classesRemaining: activePass.classes_total - activePass.classes_used
        } : null,
        availablePasses,
        isDevelopment: true
      }
    })

  } catch (error) {
    console.error('Direct tourist pass options error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}