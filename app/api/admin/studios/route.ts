import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all studios
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (!profile || profile.user_type !== 'studio_owner') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all studios
    const { data: studios, error } = await supabase
      .from('studios')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching studios:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch studios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: studios || []
    })

  } catch (error) {
    console.error('Studios API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}