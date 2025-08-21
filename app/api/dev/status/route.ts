import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getActiveCredits, getCreditBreakdown, hasActiveTouristPass } from '@/utils/credits'
import { isMockProvider } from '@/lib/payments/provider'

// Development endpoint to check overall system status

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    const isProduction = process.env.NODE_ENV === 'production'
    const isMock = isMockProvider()
    
    // Basic system status (available to all)
    const systemStatus = {
      environment: process.env.NODE_ENV || 'development',
      paymentProvider: isMock ? 'mock' : 'stripe',
      stripeEnabled: process.env.FEATURE_STRIPE === 'true',
      mockAutoComplete: process.env.MOCK_AUTO_COMPLETE === 'true',
      timestamp: new Date().toISOString()
    }

    // If no session, return basic status only
    if (!session?.user?.email) {
      return NextResponse.json({
        success: true,
        data: {
          ...systemStatus,
          user: null,
          message: 'System status (unauthenticated)'
        }
      })
    }

    const supabase = createClient()

    // Get user profile and status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: true,
        data: {
          ...systemStatus,
          user: null,
          error: 'User profile not found'
        }
      })
    }

    // Get comprehensive user status
    const [
      activeCredits,
      creditBreakdown,
      touristPass
    ] = await Promise.all([
      getActiveCredits(profile.id),
      getCreditBreakdown(profile.id),
      hasActiveTouristPass(profile.id)
    ])

    // Get recent audit logs
    const { data: recentLogs } = await supabase
      .from('credit_audit_log')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          title,
          start_time
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(3)

    const userStatus = {
      profile: {
        id: profile.id,
        email: profile.email,
        tier: profile.tier,
        frozen: profile.frozen,
        stripeCustomerId: profile.stripe_customer_id
      },
      credits: {
        active: activeCredits,
        breakdown: creditBreakdown
      },
      touristPass: touristPass ? {
        id: touristPass.id,
        remaining: touristPass.remaining,
        endsAt: touristPass.ends_at
      } : null,
      recentActivity: {
        auditLogs: recentLogs || [],
        bookings: recentBookings || []
      }
    }

    // Get system-wide stats (development only)
    let systemStats = null
    if (!isProduction) {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      const { count: activePasses } = await supabase
        .from('tourist_pass')
        .select('*', { count: 'exact', head: true })
        .gte('ends_at', new Date().toISOString())

      systemStats = {
        totalUsers: totalUsers || 0,
        totalBookings: totalBookings || 0,
        activeTouristPasses: activePasses || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...systemStatus,
        user: userStatus,
        system: systemStats,
        availableEndpoints: !isProduction && isMock ? {
          directTopup: '/api/dev/topup-direct',
          directTouristPass: '/api/dev/tourist-pass-direct',
          mockCheckout: '/api/dev/mock-checkout',
          sessionStatus: '/api/dev/session-status'
        } : null
      }
    })

  } catch (error) {
    console.error('Status endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}