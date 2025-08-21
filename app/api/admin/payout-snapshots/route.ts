import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get payout snapshots with studio information
    const { data: snapshots, error } = await supabase
      .from('payout_snapshots')
      .select(`
        *,
        studios (
          id,
          name,
          location
        )
      `)
      .order('period_end', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching payout snapshots:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payout snapshots' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('payout_snapshots')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting payout snapshots:', countError)
    }

    // Transform data for easier frontend consumption
    const transformedSnapshots = (snapshots || []).map(snapshot => ({
      ...snapshot,
      gym_name: snapshot.studios?.name || 'Unknown Gym',
      period_days: Math.ceil(
        (new Date(snapshot.period_end).getTime() - new Date(snapshot.period_start).getTime()) 
        / (1000 * 60 * 60 * 24)
      )
    }))

    return NextResponse.json({
      success: true,
      data: {
        snapshots: transformedSnapshots,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    })

  } catch (error) {
    console.error('Payout snapshots API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}