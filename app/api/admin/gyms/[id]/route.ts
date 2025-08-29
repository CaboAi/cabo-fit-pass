import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guard'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const supabase = createClient()
    
    const { data: gym, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: gym })
  } catch (error) {
    console.error('Error fetching gym:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const supabase = createClient()
    const gymData = await request.json()
    
    const { data: gym, error } = await supabase
      .from('gyms')
      .update(gymData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: gym })
  } catch (error) {
    console.error('Error updating gym:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const supabase = createClient()
    
    console.log('Attempting to delete gym with ID:', params.id)
    
    const { error } = await supabase
      .from('gyms')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }

    console.log('Gym deleted successfully')
    return NextResponse.json({ success: true, message: 'Gym deleted successfully' })
  } catch (error) {
    console.error('Error deleting gym:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
