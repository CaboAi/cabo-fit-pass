import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const pricingData = await request.json()
    
    const { data: gym, error } = await supabase
      .from('gyms')
      .update({
        drop_in_rate: pricingData.drop_in_rate,
        pack_prices: pricingData.pack_prices,
        capacity: pricingData.capacity,
        peak_hours: pricingData.peak_hours,
        off_peak_hours: pricingData.off_peak_hours,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: gym })
  } catch (error) {
    console.error('Error updating gym pricing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
