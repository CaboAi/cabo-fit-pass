import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiResponse } from '@/types'

interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  activeClasses: number
  avgRating: number
  revenueByType: Record<string, number>
  monthlyTrend: Array<{ month: string; revenue: number; bookings: number }>
  peakHours: Record<number, number>
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AnalyticsData>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const timeRange = searchParams.get('timeRange') || 'month'

    if (!studioId) {
      return NextResponse.json({
        success: false,
        error: 'Studio ID is required'
      }, { status: 400 })
    }

    // For demo purposes, we'll return mock analytics data
    // In a real app, you would query the database based on studioId and timeRange
    const analyticsData: AnalyticsData = {
      totalRevenue: 2360,
      totalBookings: 70,
      activeClasses: 3,
      avgRating: 4.9,
      revenueByType: {
        'Yoga': 720,
        'HIIT': 1080,
        'Pilates': 560
      },
      monthlyTrend: [
        { month: 'Jan', revenue: 2400, bookings: 45 },
        { month: 'Feb', revenue: 3200, bookings: 58 },
        { month: 'Mar', revenue: 2800, bookings: 52 },
        { month: 'Apr', revenue: 3600, bookings: 65 },
        { month: 'May', revenue: 4200, bookings: 72 },
        { month: 'Jun', revenue: 3800, bookings: 68 }
      ],
      peakHours: {
        7: 28,   // 7 AM
        18: 24,  // 6 PM
        19: 18   // 7 PM
      }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      message: `Analytics data for ${timeRange} period`
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
