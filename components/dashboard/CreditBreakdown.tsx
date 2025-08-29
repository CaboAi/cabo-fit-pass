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
      // Check if we're in demo mode
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-session')
      
      if (isDemoMode) {
        // Use demo data
        const demoCreditBreakdown: CreditBreakdown = {
          total: 15,
          expiring: [
            {
              amount: 10,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            }
          ],
          nonExpiring: 5
        }
        setCreditBreakdown(demoCreditBreakdown)
        setTouristPass(null) // No active tourist pass in demo
        setLoading(false)
        return
      }

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
      <Card className="bg-surface-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Credit Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="text-text-secondary">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-surface-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Credit Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-error">{error}</div>
          <Button 
            variant="outline" 
            onClick={fetchCreditData}
            className="mt-2 border-primary/20 text-primary hover:bg-primary/10"
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
      <Card className="bg-surface-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-text-primary">
            <Coins className="h-5 w-5 text-primary" />
            <span>Credit Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {creditBreakdown?.total || 0}
                </div>
                <div className="text-sm text-text-secondary">Total Active Credits</div>
              </div>
              <Button onClick={onPurchaseCredits} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Purchase Credits
              </Button>
            </div>

            {/* Credit Breakdown */}
            {creditBreakdown && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Non-expiring credits:</span>
                    <span className="font-medium text-primary">{creditBreakdown.nonExpiring}</span>
                  </div>
                  
                  {creditBreakdown.expiring.map((entry, index) => {
                    const daysUntil = getDaysUntilExpiry(entry.expires_at)
                    const isExpiringSoon = daysUntil <= 7
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-text-secondary">
                            Expires {formatDate(entry.expires_at)}:
                          </span>
                          {isExpiringSoon && (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-text-primary">{entry.amount}</span>
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-warning border-warning/20">
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
                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-text-primary">
                        Next Expiry
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">
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
      <Card className="bg-surface-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-text-primary">
            <Calendar className="h-5 w-5 text-secondary" />
            <span>Tourist Pass</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {touristPass ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {touristPass.classesRemaining}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Classes Remaining
                  </div>
                </div>
                <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">{touristPass.classesUsed}</div>
                  <div className="text-sm text-text-secondary">Used</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">{touristPass.classesTotal}</div>
                  <div className="text-sm text-text-secondary">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-error">
                    {formatDate(touristPass.endsAt)}
                  </div>
                  <div className="text-sm text-text-secondary">Expires</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-primary rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(touristPass.classesUsed / touristPass.classesTotal) * 100}%` 
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-text-secondary mb-4">
                No active tourist pass
              </div>
              <Button variant="outline" onClick={onPurchaseTouristPass} className="border-primary/20 text-primary hover:bg-primary/10">
                Purchase Tourist Pass
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Top-Up Options */}
      <Card className="bg-surface-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Credit Top-Up Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer" onClick={onPurchaseCredits}>
              <div className="text-2xl font-bold text-primary">
                10
              </div>
              <div className="text-sm text-text-secondary">Credits</div>
              <div className="text-xs text-text-tertiary mt-1">Starter Pack</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer" onClick={onPurchaseCredits}>
              <div className="text-2xl font-bold text-primary">
                25
              </div>
              <div className="text-sm text-text-secondary">Credits</div>
              <div className="text-xs text-text-tertiary mt-1">Standard Pack</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer" onClick={onPurchaseCredits}>
              <div className="text-2xl font-bold text-primary">
                50
              </div>
              <div className="text-sm text-text-secondary">Credits</div>
              <div className="text-xs text-text-tertiary mt-1">Premium Pack</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}