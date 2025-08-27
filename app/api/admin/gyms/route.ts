import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guard'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const supabase = createClient()
    
    const { data: gyms, error } = await supabase
      .from('gyms')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({ success: true, data: gyms })
  } catch (error) {
    console.error('Error fetching gyms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const supabase = createClient()
    const gymData = await request.json()
    
    console.log('Creating gym with data:', gymData)
    
    const { data: gym, error } = await supabase
      .from('gyms')
      .insert(gymData)
      .select()
      .single()

    console.log('Supabase response:', { data: gym, error })
    console.log('Gym object keys:', Object.keys(gym || {}))
    console.log('Gym ID value:', gym?.id)

    if (error) throw error

    if (!gym || !gym.id) {
      console.error('No gym ID returned:', gym)
      throw new Error('Failed to create gym - no ID returned')
    }

    return NextResponse.json({ success: true, data: gym })
  } catch (error) {
    console.error('Error creating gym:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
