'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react'

interface GymConnectSetupProps {
  gymId: string
  gymName: string
  currentStatus?: {
    hasConnectAccount: boolean
    status: string
    chargesEnabled: boolean
    payoutsEnabled: boolean
  }
}

export function GymConnectSetup({ gymId, gymName, currentStatus }: GymConnectSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  const handleOnboarding = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gymId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create onboarding session')
      }

      const { accountLinkUrl } = await response.json()
      
      // Redirect to Stripe Connect onboarding
      window.location.href = accountLinkUrl
      
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to start onboarding. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
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

  const getStatusDescription = () => {
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
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              'Setting up...'
            ) : status?.status === 'complete' ? (
              <>
                <ExternalLink className="w-4 h-4" />
                Manage Account
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                {status?.hasConnectAccount ? 'Complete Setup' : 'Start Setup'}
              </>
            )}
          </Button>
          
          {status?.hasConnectAccount && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
