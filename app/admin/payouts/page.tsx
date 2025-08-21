'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PayoutSnapshot {
  id: string
  period_start: string
  period_end: string
  total_revenue: number
  total_payouts: number
  total_gyms: number
  total_bookings: number
  created_at: string
  created_by: string
  summary: {
    total_gyms: number
    total_bookings: number
    total_revenue: number
    total_payouts: number
    average_payout_percentage: number
  }
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

export default function PayoutsPage() {
  const [snapshots, setSnapshots] = useState<PayoutSnapshot[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchSnapshots()
    
    // Set default dates (14 days ago to today)
    const today = new Date()
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(twoWeeksAgo.toISOString().split('T')[0])
  }, [])

  const fetchSnapshots = async () => {
    try {
      const response = await fetch('/api/reports/payouts')
      if (!response.ok) throw new Error('Failed to fetch payouts')
      
      const data = await response.json()
      setSnapshots(data.data?.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }

  const generatePayout = async (useCurrentPeriod = false) => {
    setGenerating(true)
    setError(null)
    
    try {
      const url = useCurrentPeriod ? '/api/reports/payouts' : '/api/reports/payouts'
      const body = useCurrentPeriod ? {} : { start: startDate, end: endDate }
      
      const response = await fetch(url, {
        method: useCurrentPeriod ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate payout')
      }
      
      const data = await response.json()
      setSelectedSnapshot(data.data)
      await fetchSnapshots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate payout')
    } finally {
      setGenerating(false)
    }
  }

  const viewSnapshot = async (snapshotId: string) => {
    try {
      const response = await fetch(`/api/reports/payouts/${snapshotId}`)
      if (!response.ok) throw new Error('Failed to fetch snapshot details')
      
      const data = await response.json()
      setSelectedSnapshot(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshot')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payouts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
        <p className="text-gray-600">Generate and view gym payout reports</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Generate New Payout */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Payout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={() => generatePayout(false)}
              disabled={generating || !startDate || !endDate}
            >
              {generating ? 'Generating...' : 'Generate Custom Period'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => generatePayout(true)}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Current 14-Day Period'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout Snapshots */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payout Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length > 0 ? (
            <div className="space-y-4">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {snapshot.period_start} to {snapshot.period_end}
                      </div>
                      <div className="text-sm text-gray-600">
                        {snapshot.total_gyms} gyms • {snapshot.total_bookings} bookings
                        • Created by {snapshot.created_by}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-lg">
                        ${snapshot.total_payouts.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${snapshot.total_revenue.toFixed(2)} revenue
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewSnapshot(snapshot.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payout reports found</p>
          )}
        </CardContent>
      </Card>

      {/* Payout Details Modal/Panel */}
      {selectedSnapshot && (
        <PayoutDetails 
          snapshot={selectedSnapshot} 
          onClose={() => setSelectedSnapshot(null)} 
        />
      )}
    </div>
  )
}

function PayoutDetails({ 
  snapshot, 
  onClose 
}: { 
  snapshot: any
  onClose: () => void 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Payout Details: {snapshot.period_start} to {snapshot.period_end}
          </CardTitle>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold">{snapshot.summary.total_gyms}</div>
            <div className="text-sm text-gray-600">Gyms</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold">{snapshot.summary.total_bookings}</div>
            <div className="text-sm text-gray-600">Bookings</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold">${snapshot.summary.total_revenue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold">${snapshot.summary.total_payouts.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Payouts</div>
          </div>
        </div>

        {/* Gym Breakdown */}
        <div>
          <h3 className="text-lg font-medium mb-4">Gym Breakdown</h3>
          <div className="space-y-4">
            {snapshot.gym_payouts?.map((gym: GymPayout) => (
              <div key={gym.gym_id} className="border rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-medium">{gym.gym_name}</div>
                    <div className="text-sm text-gray-600">
                      {gym.total_classes} classes • {gym.total_attended} attendees
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${gym.payout_amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">
                      ${gym.total_revenue.toFixed(2)} revenue
                    </div>
                  </div>
                </div>
                
                {/* Class Details */}
                {gym.details && gym.details.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Class Details:</div>
                    <div className="space-y-2">
                      {gym.details.map((detail, index) => (
                        <div key={index} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="font-medium">{detail.class_name}</span>
                            <span className="text-gray-600 ml-2">({detail.class_date})</span>
                          </div>
                          <div className="text-right">
                            <div>{detail.attendees} attendees</div>
                            <div className="font-medium">${detail.payout.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}