import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all gym pricing with studio info
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

    // Get gym pricing with studio information
    const { data: gymPricing, error } = await supabase
      .from('gym_pricing')
      .select(`
        *,
        studios (
          id,
          name,
          location
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching gym pricing:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gym pricing' },
        { status: 500 }
      )
    }

    // Transform data to include gym_name for easier frontend handling
    const transformedData = (gymPricing || []).map(pricing => ({
      ...pricing,
      gym_name: pricing.studios?.name || 'Unknown Gym'
    }))

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Gym pricing API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new gym pricing
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const { gym_id, base_price, payout_percentage, active } = await request.json()

    // Validate input
    if (!gym_id || typeof base_price !== 'number' || typeof payout_percentage !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      )
    }

    if (payout_percentage < 0 || payout_percentage > 1) {
      return NextResponse.json(
        { success: false, error: 'Payout percentage must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Create gym pricing
    const { data, error } = await supabase
      .from('gym_pricing')
      .insert({
        gym_id,
        base_price,
        payout_percentage,
        active: active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating gym pricing:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create gym pricing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Create gym pricing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update gym pricing
export async function PUT(request: NextRequest): Promise<NextResponse> {
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

    const { gym_id, base_price, payout_percentage, active } = await request.json()

    // Validate input
    if (!gym_id) {
      return NextResponse.json(
        { success: false, error: 'Gym ID is required' },
        { status: 400 }
      )
    }

    if (payout_percentage !== undefined && (payout_percentage < 0 || payout_percentage > 1)) {
      return NextResponse.json(
        { success: false, error: 'Payout percentage must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (base_price !== undefined) updates.base_price = base_price
    if (payout_percentage !== undefined) updates.payout_percentage = payout_percentage
    if (active !== undefined) updates.active = active

    // Update gym pricing
    const { data, error } = await supabase
      .from('gym_pricing')
      .update(updates)
      .eq('gym_id', gym_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating gym pricing:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update gym pricing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Update gym pricing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}