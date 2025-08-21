import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const supabase = createClient()

  // Get system statistics
  const [
    { count: totalUsers },
    { count: totalBookings },
    { count: activeClasses },
    { count: activeTouristPasses },
    { data: recentPayouts }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
    supabase.from('tourist_pass').select('*', { count: 'exact', head: true }).gte('ends_at', new Date().toISOString()),
    supabase.from('payout_snapshots').select('*').order('created_at', { ascending: false }).limit(5)
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600">System statistics and recent activity</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">👥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🏋️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tourist Passes</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🎫</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTouristPasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payout Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayouts && recentPayouts.length > 0 ? (
            <div className="space-y-4">
              {recentPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {payout.period_start} to {payout.period_end}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payout.total_gyms} gyms • {payout.total_bookings} bookings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${payout.total_payouts.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${payout.total_revenue.toFixed(2)} revenue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payout reports generated yet</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/gym-pricing"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Manage Gym Pricing</h3>
              <p className="text-sm text-gray-600">Configure payout percentages</p>
            </a>
            <a
              href="/admin/payouts"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Generate Payout</h3>
              <p className="text-sm text-gray-600">Create new payout report</p>
            </a>
            <a
              href="/admin/users"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-gray-600">View user accounts</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}