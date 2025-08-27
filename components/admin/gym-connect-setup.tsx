'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Clock, ExternalLink, Loader2 } from 'lucide-react'

interface ConnectStatus {
  hasConnectAccount: boolean
  status: 'not_setup' | 'pending' | 'incomplete' | 'complete'
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirements?: any
  accountId?: string
  detailsSubmitted?: boolean
}

interface GymConnectSetupProps {
  gymId: string
  gymName: string
}

export function GymConnectSetup({ gymId, gymName }: GymConnectSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingStatus, setIsFetchingStatus] = useState(true)
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch status on component mount
  useEffect(() => {
    fetchStatus()
  }, [gymId])

  const fetchStatus = async () => {
    try {
      setIsFetchingStatus(true)
      setError(null)
      
      const response = await fetch(`/api/connect/status/${gymId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      
      const result = await response.json()
      if (result.success) {
        setStatus(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch status')
      }
    } catch (err) {
      console.error('Error fetching status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    } finally {
      setIsFetchingStatus(false)
    }
  }

  const handleOnboarding = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gymId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create onboarding session')
      }

      const { accountLinkUrl } = await response.json()
      
      // Redirect to Stripe Connect onboarding
      window.location.href = accountLinkUrl
      
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (isFetchingStatus) {
      return <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
    }
    
    switch (status?.status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'incomplete':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    if (isFetchingStatus) {
      return <Badge variant="outline">Loading...</Badge>
    }
    
    switch (status?.status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'incomplete':
        return <Badge variant="destructive">Incomplete</Badge>
      default:
        return <Badge variant="outline">Not Setup</Badge>
    }
  }

  const getTransfersBadge = () => {
    if (isFetchingStatus) {
      return <Badge variant="outline" className="text-xs">Loading...</Badge>
    }
    
    if (!status?.hasConnectAccount) {
      return <Badge variant="outline" className="text-xs">Inactive</Badge>
    }
    
    if (status.status === 'complete' && status.payoutsEnabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Active</Badge>
    }
    
    if (status.status === 'pending') {
      return <Badge variant="secondary" className="text-xs">Pending</Badge>
    }
    
    return <Badge variant="destructive" className="text-xs">Inactive</Badge>
  }

  const getStatusDescription = () => {
    if (isFetchingStatus) {
      return 'Loading status...'
    }
    
    switch (status?.status) {
      case 'complete':
        return 'This gym can receive payouts and process payments.'
      case 'pending':
        return 'Additional information required to complete setup.'
      case 'incomplete':
        return 'Onboarding process needs to be completed.'
      default:
        return 'Stripe Connect account not yet configured.'
    }
  }

  const getButtonText = () => {
    if (isLoading) {
      return 'Setting up...'
    }
    
    if (status?.status === 'complete') {
      return 'Manage Account'
    }
    
    if (status?.hasConnectAccount) {
      return 'Complete Setup'
    }
    
    return 'Finish payouts setup'
  }

  if (error && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Error Loading Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStatus} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Stripe Connect Setup
        </CardTitle>
        <CardDescription>
          Configure payouts and payment processing for {gymName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-600">{getStatusDescription()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 block mb-1">Transfers</span>
            {getTransfersBadge()}
          </div>
        </div>

        {status?.hasConnectAccount && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Charges Enabled:</span>
              <Badge variant={status.chargesEnabled ? "default" : "destructive"} className="ml-2">
                {status.chargesEnabled ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Payouts Enabled:</span>
              <Badge variant={status.payoutsEnabled ? "default" : "destructive"} className="ml-2">
                {status.payoutsEnabled ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleOnboarding}
            disabled={isLoading || isFetchingStatus}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {getButtonText()}
          </Button>
          
          {status?.hasConnectAccount && (
            <Button variant="outline" onClick={fetchStatus} disabled={isFetchingStatus}>
              {isFetchingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh Status'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
