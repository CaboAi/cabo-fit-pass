'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CREDIT_PACKAGES, TOPUP_PACKAGES, TOURIST_PASS } from '@/lib/stripe'
import { useToast } from '@/hooks/use-toast'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'subscription' | 'topup' | 'tourist_pass'
  currentCredits?: number
}

export default function PaymentModal({ isOpen, onClose, type, currentCredits = 0 }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showError } = useToast()  // Use showError instead of toast

  if (!isOpen) return null

  const handleCheckout = async (plan: string) => {
    setIsLoading(true)
    
    try {
      let mode: 'subscription' | 'payment'
      let itemType: string
      
      if (type === 'subscription') {
        mode = 'subscription'
        itemType = 'subscription'
      } else if (type === 'topup') {
        mode = 'payment'
        itemType = 'topup'
      } else {
        mode = 'payment'
        itemType = 'tourist_pass'
      }

      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          itemType,
          plan,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
      
    } catch (error) {
      console.error('Checkout error:', error)
      showError('Failed to create checkout session. Please try again.')  // Use showError
    } finally {
      setIsLoading(false)
    }
  }

  const renderPackages = () => {
    if (type === 'subscription') {
      return CREDIT_PACKAGES.map((pkg) => (
        <Card key={pkg.id} className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {pkg.name}
              <Badge variant="secondary">${pkg.price}/month</Badge>
            </CardTitle>
            <CardDescription>{pkg.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">{pkg.credits} credits</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {pkg.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
              <Button 
                onClick={() => handleCheckout(pkg.id)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Subscribe'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))
    } else if (type === 'topup') {
      return TOPUP_PACKAGES.map((pkg) => (
        <Card key={pkg.id} className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {pkg.name}
              <Badge variant="secondary">${pkg.price}</Badge>
            </CardTitle>
            <CardDescription>{pkg.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">{pkg.credits} credits</div>
              <div className="text-sm text-muted-foreground">
                Includes {pkg.bonus} bonus credits!
              </div>
              <Button 
                onClick={() => handleCheckout(pkg.id)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Buy Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))
    } else {
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {TOURIST_PASS.name}
              <Badge variant="secondary">${TOURIST_PASS.price}</Badge>
            </CardTitle>
            <CardDescription>{TOURIST_PASS.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">{TOURIST_PASS.credits} credits</div>
              <div className="text-sm text-muted-foreground">
                Valid for {TOURIST_PASS.validityDays} days
              </div>
              <Button 
                onClick={() => handleCheckout(TOURIST_PASS.id)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Buy Tourist Pass'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {type === 'subscription' ? 'Choose Subscription Plan' : 
             type === 'topup' ? 'Buy Credit Pack' : 'Tourist Pass'}
          </h2>
          <Button variant="ghost" onClick={onClose} size="sm">
            ✕
          </Button>
        </div>
        
        {currentCredits > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Current credits: <span className="font-semibold">{currentCredits}</span>
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderPackages()}
        </div>
      </div>
    </div>
  )
}