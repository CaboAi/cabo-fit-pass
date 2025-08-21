'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Award,
  PieChart,
  Activity,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClassItem } from '@/types'

interface AnalyticsDashboardProps {
  classes: (ClassItem & { revenue: number; bookings: number })[]
}

export function AnalyticsDashboard({ classes }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  // Calculate analytics data
  const totalRevenue = classes.reduce((sum, c) => sum + c.revenue, 0)
  const totalBookings = classes.reduce((sum, c) => sum + c.bookings, 0)
  const avgClassSize = totalBookings / classes.length || 0
  const avgRevPerClass = totalRevenue / classes.length || 0

  // Revenue by class type
  const revenueByType = classes.reduce((acc, cls) => {
    acc[cls.class_type] = (acc[cls.class_type] || 0) + cls.revenue
    return acc
  }, {} as Record<string, number>)

  // Peak hours analysis
  const bookingsByHour = classes.reduce((acc, cls) => {
    const hour = new Date(cls.start_time).getHours()
    acc[hour] = (acc[hour] || 0) + cls.bookings
    return acc
  }, {} as Record<number, number>)

  const peakHour = Object.entries(bookingsByHour)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '18'

  // Time period specific data
  const getTimeData = () => {
    if (timeRange === 'week') {
      return [
        { period: 'Mon', revenue: 520, bookings: 12 },
        { period: 'Tue', revenue: 680, bookings: 15 },
        { period: 'Wed', revenue: 450, bookings: 10 },
        { period: 'Thu', revenue: 780, bookings: 18 },
        { period: 'Fri', revenue: 950, bookings: 22 },
        { period: 'Sat', revenue: 1200, bookings: 28 },
        { period: 'Sun', revenue: 860, bookings: 20 }
      ]
    } else if (timeRange === 'year') {
      return [
        { period: '2023', revenue: 28500, bookings: 580 },
        { period: '2024', revenue: 42800, bookings: 720 }
      ]
    }
    // Default to month
    return [
      { period: 'Jan', revenue: 2400, bookings: 45 },
      { period: 'Feb', revenue: 3200, bookings: 58 },
      { period: 'Mar', revenue: 2800, bookings: 52 },
      { period: 'Apr', revenue: 3600, bookings: 65 },
      { period: 'May', revenue: 4200, bookings: 72 },
      { period: 'Jun', revenue: 3800, bookings: 68 },
      { period: 'Jul', revenue: 4100, bookings: 75 },
      { period: 'Aug', revenue: 3900, bookings: 70 },
      { period: 'Sep', revenue: 3700, bookings: 67 },
      { period: 'Oct', revenue: 4000, bookings: 73 },
      { period: 'Nov', revenue: 3600, bookings: 65 },
      { period: 'Dec', revenue: 4500, bookings: 80 }
    ]
  }

  const timeData = getTimeData()
  const maxRevenue = Math.max(...timeData.map(d => d.revenue))

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card className="card-fitness bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-heading-xl text-text-primary">Analytics Dashboard</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-all capitalize ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-fitness-stats bg-surface">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-success mx-auto mb-3" />
            <p className="text-display-sm font-bold text-text-primary">${totalRevenue.toLocaleString()}</p>
            <p className="text-caption-md text-text-secondary">Total Revenue</p>
            <p className="text-success text-xs mt-1">+12% vs last month</p>
          </CardContent>
        </Card>

        <Card className="card-fitness-stats bg-surface">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-display-sm font-bold text-text-primary">{totalBookings}</p>
            <p className="text-caption-md text-text-secondary">Total Bookings</p>
            <p className="text-primary text-xs mt-1">+8% vs last month</p>
          </CardContent>
        </Card>

        <Card className="card-fitness-stats bg-surface">
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-secondary mx-auto mb-3" />
            <p className="text-display-sm font-bold text-text-primary">{avgClassSize.toFixed(1)}</p>
            <p className="text-caption-md text-text-secondary">Avg Class Size</p>
            <p className="text-secondary text-xs mt-1">+5% vs last month</p>
          </CardContent>
        </Card>

        <Card className="card-fitness-stats bg-surface">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-warning mx-auto mb-3" />
            <p className="text-display-sm font-bold text-text-primary">${avgRevPerClass.toFixed(0)}</p>
            <p className="text-caption-md text-text-secondary">Revenue per Class</p>
            <p className="text-warning text-xs mt-1">+15% vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="card-fitness-elevated bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-text-primary">
              <TrendingUp className="w-5 h-5 text-success" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeData.map((data) => (
                <div key={data.period} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-text-secondary">{data.period}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-surface-tertiary rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                        style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-text-primary font-medium w-20 text-right">
                      ${data.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Type Performance */}
        <Card className="card-fitness-elevated bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-text-primary">
              <PieChart className="w-5 h-5 text-primary" />
              Revenue by Class Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(revenueByType)
                .sort(([,a], [,b]) => b - a)
                .map(([type, revenue], index) => {
                  const percentage = (revenue / totalRevenue) * 100
                  const colors = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-warning', 'bg-error']
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${colors[index % colors.length]} rounded-full`}></div>
                        <span className="text-text-secondary">{type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 bg-surface-tertiary rounded-full h-2">
                          <div 
                            className={`${colors[index % colors.length]} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-text-primary font-medium w-16 text-right">
                          ${revenue}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Times */}
        <Card className="card-fitness-elevated bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-text-primary">
              <Clock className="w-5 h-5 text-warning" />
              Peak Booking Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-warning/10 to-secondary/10 p-4 rounded-xl border border-warning/20">
              <p className="text-warning font-semibold text-lg">Peak Hour: {parseInt(peakHour) === 0 ? '12:00 AM' : parseInt(peakHour) <= 12 ? `${peakHour}:00 AM` : `${parseInt(peakHour) - 12}:00 PM`}</p>
              <p className="text-text-secondary text-sm">Most bookings happen around this time</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-text-primary">Booking Distribution</h4>
              {Object.entries(bookingsByHour)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([hour, bookings]) => {
                  const hourNum = parseInt(hour)
                  const startTime = hourNum === 0 ? '12:00 AM' : hourNum <= 12 ? `${hourNum}:00 AM` : `${hourNum - 12}:00 PM`
                  const endHour = (hourNum + 1) % 24
                  const endTime = endHour === 0 ? '12:00 AM' : endHour <= 12 ? `${endHour}:00 AM` : `${endHour - 12}:00 PM`
                  
                  return (
                    <div key={hour} className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg">
                      <span className="text-text-secondary">{startTime} - {endTime}</span>
                      <span className="text-text-primary font-medium">{bookings} bookings</span>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="card-fitness-elevated bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-text-primary">
              <Activity className="w-5 h-5 text-success" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-success/10 to-primary/10 p-4 rounded-xl border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-success font-semibold">Top Performer</span>
                </div>
                <p className="text-text-primary font-medium">
                  {classes.sort((a, b) => b.revenue - a.revenue)[0]?.name}
                </p>
                <p className="text-text-secondary text-sm">
                  ${classes.sort((a, b) => b.revenue - a.revenue)[0]?.revenue} revenue
                </p>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-primary font-semibold">Most Popular</span>
                </div>
                <p className="text-text-primary font-medium">
                  {classes.sort((a, b) => b.bookings - a.bookings)[0]?.name}
                </p>
                <p className="text-text-secondary text-sm">
                  {classes.sort((a, b) => b.bookings - a.bookings)[0]?.bookings} total bookings
                </p>
              </div>

              <div className="bg-gradient-to-r from-warning/10 to-secondary/10 p-4 rounded-xl border border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-warning" />
                  <span className="text-warning font-semibold">Recommendation</span>
                </div>
                <p className="text-text-secondary text-sm">
                  Consider adding more {Object.entries(revenueByType).sort(([,a], [,b]) => b - a)[0]?.[0]} classes during peak hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
