import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { GYM_PAYOUT } from '@/lib/billing'
import { headers } from 'next/headers'

interface PayoutRequest {
  start?: string // YYYY-MM-DD (optional, defaults to 14 days ago)
  end?: string   // YYYY-MM-DD (optional, defaults to today)
}

interface GymPayout {
  gym_id: string
  gym_name: string
  total_classes: number
  total_attended: number
  total_revenue: number
  payout_amount: number
  details: Array<{
    class_id: string
    class_name: string
    class_date: string
    attendees: number
    revenue: number
    payout: number
  }>
}

interface PayoutSnapshot {
  period_start: string
  period_end: string
  gym_payouts: GymPayout[]
  summary: {
    total_gyms: number
    total_bookings: number
    total_revenue: number
    total_payouts: number
    average_payout_percentage: number
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // This endpoint should be admin-only or called by a service
    const serviceSecret = headers().get('x-service-secret')
    const expectedSecret = process.env.SERVICE_SECRET

    if (!expectedSecret || serviceSecret !== expectedSecret) {
      // Fallback to checking if user is admin
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const supabase = createClient()
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
    }

    const body = await request.json().catch(() => ({}))
    const { start, end }: PayoutRequest = body

    // Default to 14-day window ending today
    const endDate = end ? new Date(end) : new Date()
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get all attended bookings within date range
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        credits_used,
        attended,
        booking_date,
        classes (
          id,
          title,
          start_time,
          price,
          gym_id,
          studios (
            id,
            name
          )
        )
      `)
      .eq('attended', true)
      .in('booking_status', ['completed', 'confirmed'])
      .gte('classes.start_time', startDate.toISOString())
      .lte('classes.start_time', endDate.toISOString())

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch booking data' },
        { status: 500 }
      )
    }

    // Get gym pricing information
    const { data: gymPricing } = await supabase
      .from('gym_pricing')
      .select('gym_id, payout_percentage, base_price')
      .eq('active', true)

    // Create a map of gym pricing
    const pricingMap = new Map(
      (gymPricing || []).map(p => [p.gym_id, p])
    )

    // Aggregate payouts by gym
    const gymPayouts = new Map<string, GymPayout>()

    for (const booking of bookings || []) {
      if (!booking.classes || !booking.classes.studios) continue

      const gymId = booking.classes.gym_id
      const gymName = booking.classes.studios.name
      
      // Get payout percentage for this gym (default to 70%)
      const pricing = pricingMap.get(gymId) || { 
        payout_percentage: GYM_PAYOUT.percentage,
        base_price: 15.00
      }

      // Calculate revenue and payout for this booking
      const classPrice = booking.classes.price || pricing.base_price
      const payoutAmount = classPrice * pricing.payout_percentage

      // Get or create gym payout entry
      if (!gymPayouts.has(gymId)) {
        gymPayouts.set(gymId, {
          gym_id: gymId,
          gym_name: gymName,
          total_classes: 0,
          total_attended: 0,
          total_revenue: 0,
          payout_amount: 0,
          details: []
        })
      }

      const gymPayout = gymPayouts.get(gymId)!
      
      // Find or create class detail entry
      const classDate = booking.classes.start_time.split('T')[0]
      let classDetail = gymPayout.details.find(d => 
        d.class_id === booking.classes.id &&
        d.class_date === classDate
      )

      if (!classDetail) {
        classDetail = {
          class_id: booking.classes.id,
          class_name: booking.classes.title,
          class_date: classDate,
          attendees: 0,
          revenue: 0,
          payout: 0
        }
        gymPayout.details.push(classDetail)
        gymPayout.total_classes++
      }

      // Update totals
      classDetail.attendees++
      classDetail.revenue += classPrice
      classDetail.payout += payoutAmount
      
      gymPayout.total_attended++
      gymPayout.total_revenue += classPrice
      gymPayout.payout_amount += payoutAmount
    }

    // Convert map to array and sort by payout amount
    const payouts = Array.from(gymPayouts.values())
      .sort((a, b) => b.payout_amount - a.payout_amount)

    // Calculate summary statistics
    const summary = {
      total_gyms: payouts.length,
      total_bookings: bookings?.length || 0,
      total_revenue: payouts.reduce((sum, p) => sum + p.total_revenue, 0),
      total_payouts: payouts.reduce((sum, p) => sum + p.payout_amount, 0),
      average_payout_percentage: GYM_PAYOUT.percentage
    }

    // Create payout snapshot
    const snapshot: PayoutSnapshot = {
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      gym_payouts: payouts,
      summary
    }

    // Store payout snapshot for historical records
    const { data: snapshotRecord, error: snapshotError } = await supabase
      .from('payout_snapshots')
      .insert({
        period_start: snapshot.period_start,
        period_end: snapshot.period_end,
        gym_payouts: snapshot.gym_payouts,
        summary: snapshot.summary,
        total_revenue: summary.total_revenue,
        total_payouts: summary.total_payouts,
        total_gyms: summary.total_gyms,
        total_bookings: summary.total_bookings,
        created_by: serviceSecret ? 'service' : 'admin'
      })
      .select('id')
      .single()

    if (snapshotError) {
      console.error('Failed to store payout snapshot:', snapshotError)
      // Continue even if snapshot fails
    }

    console.log(`Payout report generated for ${snapshot.period_start} to ${snapshot.period_end}`)
    console.log(`Total revenue: $${summary.total_revenue}, Total payouts: $${summary.total_payouts}`)

    return NextResponse.json({
      success: true,
      data: {
        ...snapshot,
        snapshot_id: snapshotRecord?.id,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Payout computation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve stored payout reports
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

    // Check if user is admin/studio owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, id')
      .eq('email', session.user.email)
      .single()

    if (!profile || profile.user_type !== 'studio_owner') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const gymId = url.searchParams.get('gym_id')

    let query = supabase
      .from('payout_snapshots')
      .select(`
        id,
        period_start,
        period_end,
        total_revenue,
        total_payouts,
        total_gyms,
        total_bookings,
        created_at,
        created_by,
        summary
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: snapshots, error } = await query

    if (error) {
      console.error('Error fetching payout snapshots:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payout reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        reports: snapshots || [],
        pagination: {
          limit,
          offset,
          total: snapshots?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Get payout reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT endpoint to generate payout for current 14-day period
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // This is a convenience endpoint to generate current 14-day payout
    const serviceSecret = headers().get('x-service-secret') || 'manual'
    
    // Calculate 14-day period ending today
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Call the POST endpoint with default dates
    const requestBody = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }

    // Create new request for POST method
    const newRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-service-secret': serviceSecret
      },
      body: JSON.stringify(requestBody)
    })

    return await exports.POST(newRequest)

  } catch (error) {
    console.error('Payout generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}