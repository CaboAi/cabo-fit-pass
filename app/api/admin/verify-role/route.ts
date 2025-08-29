import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Get user role from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify user role'
      }, { status: 500 })
    }
    
    const isAdmin = profile?.role === 'admin'
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'user'
      },
      isAdmin
    })
    
  } catch (error) {
    console.error('Admin role verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}