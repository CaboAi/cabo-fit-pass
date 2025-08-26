'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, CreditCard, TrendingUp } from 'lucide-react'

interface PayoutRecord {
  id: string
  period_start: string
  period_end: string
  total_credits_consumed: number
  total_payable_cents: number
  stripe_payout_id: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at: string | null
  created_at: string
}

interface PayoutStats {
  totalPayouts: number
  totalAmount: number
  pendingAmount: number
  completedAmount: number
}

export default function GymPayoutsDashboard({ gymId }: { gymId: string }) {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayouts()
  }, [gymId])

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/payouts`)
      if (response.ok) {
        const data = await response.json()
        setPayouts(data.payouts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading payouts...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.completedAmount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Bi-weekly payout records and transfer status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payouts found
              </div>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payout.total_credits_consumed} credits consumed
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(payout.total_payable_cents)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payout.stripe_payout_id ? `Transfer: ${payout.stripe_payout_id.slice(-8)}` : 'No transfer ID'}
                      </div>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Payout Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Payout</CardTitle>
          <CardDescription>
            Trigger payout processing manually (use with caution)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={async () => {
              try {
                const response = await fetch('/api/payouts/run', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })
                if (response.ok) {
                  alert('Payout processing triggered successfully')
                  fetchPayouts()
                } else {
                  alert('Failed to trigger payout processing')
                }
              } catch (error) {
                alert('Error triggering payout processing')
              }
            }}
            variant="outline"
          >
            Run Payout Processing
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
