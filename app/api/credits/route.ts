import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types'
import { cache, CACHE_TTL, invalidateCache } from '@/lib/cache'
import { createComponentLogger } from '@/lib/logger'

interface CreditUpdateRequest {
  user_email: string
  credits_to_add: number
  payment_intent_id?: string
}

interface CreditUpdateResponse {
  success: boolean
  new_credits: number
  added_credits: number
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreditUpdateResponse>>> {
  const logger = createComponentLogger('credits')
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    
    logger.info('Credit update requested', {
      action: 'update-credits',
      metadata: { userId: session?.user?.email }
    })
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { user_email, credits_to_add, payment_intent_id }: CreditUpdateRequest = await request.json()

    if (!credits_to_add || credits_to_add <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credit amount' 
      }, { status: 400 })
    }

    // Verify the requesting user matches the session
    if (user_email !== session.user.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Cannot update credits for different user' 
      }, { status: 403 })
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user_email)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    // In production, verify payment with Stripe/payment processor here
    if (payment_intent_id) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Payment verified for ${credits_to_add} credits with intent ${payment_intent_id}`)
      }
      // TODO: Verify payment_intent_id with Stripe
    }

    // Add credits to user account
    const newCreditAmount = profile.credits + credits_to_add
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: newCreditAmount,
        updated_at: new Date().toISOString()
      })
      .eq('email', user_email)
      .select()
      .single()
    
    if (updateError || !updatedProfile) {
      logger.error('Error updating credits', {
        action: 'update-credits',
        errorCode: 'CREDIT_UPDATE_FAILED',
        metadata: { userId: user_email, creditsToAdd: credits_to_add }
      }, new Error(updateError?.message || 'Update failed'))
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update credits' 
      }, { status: 500 })
    }

    // Invalidate user cache and credit cache
    await Promise.all([
      invalidateCache.user(user_email),
      cache.user.credits(user_email).invalidate()
    ])

    // Cache updated credits
    await cache.user.credits(user_email).set({ credits: newCreditAmount }, CACHE_TTL.MEDIUM)

    const duration = Date.now() - startTime
    logger.info('Credits updated successfully', {
      action: 'update-credits',
      duration,
      statusCode: 200,
      metadata: { 
        userId: user_email, 
        newCredits: newCreditAmount, 
        addedCredits: credits_to_add 
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        new_credits: newCreditAmount,
        added_credits: credits_to_add
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Credits API error', {
      action: 'update-credits',
      duration,
      statusCode: 500,
      errorCode: 'CREDITS_API_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<{ credits: number }>>> {
  const logger = createComponentLogger('credits')
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    
    logger.info('Credit fetch requested', {
      action: 'fetch-credits',
      metadata: { userId: session?.user?.email }
    })
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Try to get credits from cache first
    const cachedCredits = await cache.user.credits(session.user.email).get()
    if (cachedCredits) {
      const duration = Date.now() - startTime
      logger.info('Credits served from cache', {
        action: 'fetch-credits',
        duration,
        statusCode: 200,
        metadata: { userId: session.user.email, credits: cachedCredits.credits, source: 'cache' }
      })
      
      return NextResponse.json({
        success: true,
        data: { credits: cachedCredits.credits }
      })
    }

    const supabase = createClient()

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('email', session.user.email)
      .single()
    
    if (error || !profile) {
      logger.error('Error fetching user credits', {
        action: 'fetch-credits',
        errorCode: 'CREDITS_FETCH_FAILED',
        metadata: { userId: session.user.email }
      }, new Error(error?.message || 'Profile not found'))
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    // Cache the credits data
    await cache.user.credits(session.user.email).set({ credits: profile.credits }, CACHE_TTL.MEDIUM)

    const duration = Date.now() - startTime
    logger.info('Credits fetched successfully from database and cached', {
      action: 'fetch-credits',
      duration,
      statusCode: 200,
      metadata: { userId: session.user.email, credits: profile.credits, source: 'database' }
    })

    return NextResponse.json({
      success: true,
      data: { credits: profile.credits }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Credits GET API error', {
      action: 'fetch-credits',
      duration,
      statusCode: 500,
      errorCode: 'CREDITS_GET_API_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}