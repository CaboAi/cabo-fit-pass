import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Check if user has access to this gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Check permissions
    const hasAccess = gym.owner_id === profile.id || 
                     profile.role === 'admin' ||
                     profile.user_type === 'instructor'
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get payouts for this gym
    const { data: payouts, error: payoutsError } = await supabase
      .from('gym_payouts')
      .select('*')
      .eq('gym_id', params.id)
      .order('created_at', { ascending: false })

    if (payoutsError) {
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    // Calculate stats
    const stats = {
      totalPayouts: payouts?.length || 0,
      totalAmount: payouts?.reduce((sum, p) => sum + p.total_payable_cents, 0) || 0,
      pendingAmount: payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total_payable_cents, 0) || 0,
      completedAmount: payouts?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.total_payable_cents, 0) || 0
    }

    return NextResponse.json({
      success: true,
      payouts: payouts || [],
      stats
    })

  } catch (error) {
    console.error('Error fetching gym payouts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
