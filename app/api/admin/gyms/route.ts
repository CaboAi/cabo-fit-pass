import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you'll need to implement this check)
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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

    const gymData = await request.json()
    
    const { data: gym, error } = await supabase
      .from('gyms')
      .insert(gymData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: gym })
  } catch (error) {
    console.error('Error creating gym:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
