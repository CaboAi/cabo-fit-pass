'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, Calendar, Clock, AlertCircle } from 'lucide-react'

interface CreditEntry {
  amount: number
  expires_at: string
}

interface CreditBreakdown {
  total: number
  expiring: CreditEntry[]
  nonExpiring: number
}

interface TouristPass {
  id: string
  startsAt: string
  endsAt: string
  classesTotal: number
  classesUsed: number
  classesRemaining: number
}

interface CreditBreakdownProps {
  onPurchaseCredits: () => void
  onPurchaseTouristPass: () => void
}

export function CreditBreakdown({ onPurchaseCredits, onPurchaseTouristPass }: CreditBreakdownProps) {
  const [creditBreakdown, setCreditBreakdown] = useState<CreditBreakdown | null>(null)
  const [touristPass, setTouristPass] = useState<TouristPass | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreditData()
  }, [])

  const fetchCreditData = async () => {
    try {
      const [creditsResponse, touristResponse] = await Promise.all([
        fetch('/api/credits/breakdown'),
        fetch('/api/tourist-pass/status')
      ])

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setCreditBreakdown(creditsData.data)
      }

      if (touristResponse.ok) {
        const touristData = await touristResponse.json()
        setTouristPass(touristData.data?.activePass || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credit data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (dateString: string) => {
    const expiryDate = new Date(dateString)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="text-gray-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error}</div>
          <Button 
            variant="outline" 
            onClick={fetchCreditData}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-green-600" />
            <span>Credit Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {creditBreakdown?.total || 0}
                </div>
                <div className="text-sm text-gray-600">Total Active Credits</div>
              </div>
              <Button onClick={onPurchaseCredits}>
                Purchase Credits
              </Button>
            </div>

            {/* Credit Breakdown */}
            {creditBreakdown && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Non-expiring credits:</span>
                    <span className="font-medium">{creditBreakdown.nonExpiring}</span>
                  </div>
                  
                  {creditBreakdown.expiring.map((entry, index) => {
                    const daysUntil = getDaysUntilExpiry(entry.expires_at)
                    const isExpiringSoon = daysUntil <= 7
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Expires {formatDate(entry.expires_at)}:
                          </span>
                          {isExpiringSoon && (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{entry.amount}</span>
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-orange-600">
                              {daysUntil} days
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Next Expiry Alert */}
                {creditBreakdown.expiring.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">
                        Next Expiry
                      </span>
                    </div>
                    <div className="text-sm text-orange-700">
                      {creditBreakdown.expiring[0].amount} credits expire on{' '}
                      {formatDate(creditBreakdown.expiring[0].expires_at)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tourist Pass Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Tourist Pass</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {touristPass ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {touristPass.classesRemaining}
                  </div>
                  <div className="text-sm text-gray-600">
                    Classes Remaining
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold">{touristPass.classesUsed}</div>
                  <div className="text-sm text-gray-600">Used</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{touristPass.classesTotal}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-red-600">
                    {formatDate(touristPass.endsAt)}
                  </div>
                  <div className="text-sm text-gray-600">Expires</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(touristPass.classesUsed / touristPass.classesTotal) * 100}%` 
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-500 mb-4">
                No active tourist pass
              </div>
              <Button variant="outline" onClick={onPurchaseTouristPass}>
                Purchase Tourist Pass
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(creditBreakdown?.total || 0) + (touristPass?.classesRemaining || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Available</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {touristPass ? 1 : 0}
              </div>
              <div className="text-sm text-gray-600">Active Passes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}