import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { UserProfile, ApiResponse } from '@/types'
import { createComponentLogger, extractUserContext } from '@/lib/logger'
import { cache, CACHE_TTL, invalidateCache } from '@/lib/cache'

export async function GET(): Promise<NextResponse<ApiResponse<{ profile: UserProfile }>>> {
  const logger = createComponentLogger('profile')
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    const userContext = extractUserContext(session)
    const requestLogger = logger.child({ ...userContext, userId: session?.user?.email })
    
    requestLogger.info('Profile fetch requested', {
      action: 'fetch-profile'
    })
    
    if (!session?.user?.email) {
      requestLogger.warn('Unauthorized profile fetch attempt', {
        action: 'auth-check',
        errorCode: 'UNAUTHORIZED'
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Try to get profile from cache first
    const cachedProfile = await cache.user.profile(session.user.email).get()
    if (cachedProfile) {
      const duration = Date.now() - startTime
      requestLogger.info('Profile served from cache', {
        action: 'fetch-profile',
        duration,
        statusCode: 200,
        metadata: { profileId: cachedProfile.id, source: 'cache' }
      })
      
      return NextResponse.json({
        success: true,
        data: { profile: cachedProfile }
      })
    }

    const supabase = createClient()
    
    // Try to get existing profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      requestLogger.error('Error fetching profile', {
        action: 'fetch-profile',
        resource: 'profiles',
        errorCode: 'PROFILE_FETCH_FAILED'
      }, new Error(error.message))
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch profile'
      }, { status: 500 })
    }

    // If profile doesn't exist, create one
    if (!profile) {
      const newProfile: Omit<UserProfile, 'created_at' | 'updated_at'> = {
        id: session.user.email,
        email: session.user.email,
        full_name: session.user.name || '',
        user_type: 'member',
        credits: 5, // Start with 5 free credits
        subscription_tier: 'free'
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (createError) {
        requestLogger.error('Error creating profile', {
          action: 'create-profile',
          resource: 'profiles',
          errorCode: 'PROFILE_CREATION_FAILED'
        }, new Error(createError.message))
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile'
        }, { status: 500 })
      }

      // Cache the newly created profile
      await cache.user.profile(session.user.email).set(createdProfile, CACHE_TTL.LONG)

      const duration = Date.now() - startTime
      requestLogger.info('Profile created successfully and cached', {
        action: 'create-profile',
        duration,
        statusCode: 200,
        metadata: { profileId: createdProfile.id, source: 'database' }
      })

      return NextResponse.json({
        success: true,
        data: { profile: createdProfile }
      })
    }

    // Cache the profile data
    await cache.user.profile(session.user.email).set(profile, CACHE_TTL.LONG)

    const duration = Date.now() - startTime
    requestLogger.info('Profile fetched successfully from database and cached', {
      action: 'fetch-profile',
      duration,
      statusCode: 200,
      metadata: { profileId: profile.id, source: 'database' }
    })

    return NextResponse.json({
      success: true,
      data: { profile }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Profile API error', {
      action: 'fetch-profile',
      duration,
      statusCode: 500,
      errorCode: 'PROFILE_API_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<{ profile: UserProfile }>>> {
  const logger = createComponentLogger('profile')
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    const userContext = extractUserContext(session)
    const requestLogger = logger.child({ ...userContext, userId: session?.user?.email })
    
    if (!session?.user?.email) {
      requestLogger.warn('Unauthorized profile update attempt', {
        action: 'auth-check',
        errorCode: 'UNAUTHORIZED'
      })
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, subscription_tier } = body

    requestLogger.info('Profile update requested', {
      action: 'update-profile',
      metadata: { full_name, subscription_tier }
    })

    const supabase = createClient()
    
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        subscription_tier,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()
      .single()

    if (error) {
      requestLogger.error('Error updating profile', {
        action: 'update-profile',
        resource: 'profiles',
        errorCode: 'PROFILE_UPDATE_FAILED'
      }, new Error(error.message))
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      }, { status: 500 })
    }

    // Invalidate and update cache with new profile data
    await invalidateCache.user(session.user.email)
    await cache.user.profile(session.user.email).set(updatedProfile, CACHE_TTL.LONG)

    const duration = Date.now() - startTime
    requestLogger.info('Profile updated successfully and cache refreshed', {
      action: 'update-profile',
      duration,
      statusCode: 200,
      metadata: { profileId: updatedProfile.id, source: 'database' }
    })

    return NextResponse.json({
      success: true,
      data: { profile: updatedProfile }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Profile update API error', {
      action: 'update-profile',
      duration,
      statusCode: 500,
      errorCode: 'PROFILE_UPDATE_API_EXCEPTION'
    }, error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}