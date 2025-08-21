import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Get user profile
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

    // Get active tourist pass
    const { data: touristPass, error: passError } = await supabase
      .from('tourist_pass')
      .select('*')
      .eq('user_id', profile.id)
      .eq('active', true)
      .gte('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (passError) {
      console.error('Error fetching tourist pass:', passError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tourist pass' },
        { status: 500 }
      )
    }

    // Transform the data if pass exists
    const activePass = touristPass ? {
      id: touristPass.id,
      startsAt: touristPass.starts_at,
      endsAt: touristPass.ends_at,
      classesTotal: touristPass.classes_total,
      classesUsed: touristPass.classes_used,
      classesRemaining: touristPass.classes_total - touristPass.classes_used
    } : null

    return NextResponse.json({
      success: true,
      data: {
        activePass
      }
    })

  } catch (error) {
    console.error('Tourist pass status API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}