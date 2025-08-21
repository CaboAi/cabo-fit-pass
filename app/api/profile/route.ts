import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { UserProfile, ApiResponse } from '@/types'

export async function GET(): Promise<NextResponse<ApiResponse<{ profile: UserProfile }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const supabase = createClient()
    
    // Try to get existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching profile:', error)
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
        console.error('Error creating profile:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: { profile: createdProfile }
      })
    }

    return NextResponse.json({
      success: true,
      data: { profile }
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<{ profile: UserProfile }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, subscription_tier } = body

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
      console.error('Error updating profile:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { profile: updatedProfile }
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}