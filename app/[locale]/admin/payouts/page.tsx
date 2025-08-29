import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'

export default async function PayoutsPage() {
  const supabase = createClient()
  
  const { data: payoutSnapshots, error } = await supabase
    .from('payout_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching payout snapshots:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
        <p className="text-gray-600 mt-1">Generate and manage gym payout reports</p>
      </div>

      {/* Generate New Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate New Payout Report
          </CardTitle>
          <CardDescription>
            Create a new payout report for the specified time period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border rounded-md"
                defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border rounded-md"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <Button className="w-full md:w-auto">
            <DollarSign className="w-4 h-4 mr-2" />
            Generate Payout Report
          </Button>
        </CardContent>
      </Card>

      {/* Recent Payout Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Payout Reports
          </CardTitle>
          <CardDescription>
            View and manage recent payout reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutSnapshots && payoutSnapshots.length > 0 ? (
            <div className="space-y-4">
              {payoutSnapshots.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {payout.period_start} to {payout.period_end}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payout.total_gyms || 0} gyms • {payout.total_bookings || 0} bookings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${(payout.total_payouts || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${(payout.total_revenue || 0).toFixed(2)} revenue
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Process Payouts
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payout reports generated yet</p>
              <p className="text-sm">Generate your first payout report above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}