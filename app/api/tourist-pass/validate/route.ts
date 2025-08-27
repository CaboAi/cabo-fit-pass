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

    // Get active tourist passes
    const { data: passes, error: passesError } = await supabase
      .from('tourist_passes')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .gte('expires_after', new Date().toISOString())
      .order('expires_after', { ascending: true })

    if (passesError) throw passesError

    return NextResponse.json({
      success: true,
      data: {
        hasActivePass: passes.length > 0,
        passes: passes,
        totalCredits: passes.reduce((sum, pass) => sum + pass.credits, 0)
      }
    })

  } catch (error) {
    console.error('Error validating tourist pass:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
