'use client'

import { useState } from 'react'
import { X, CreditCard, Star, Zap } from 'lucide-react'
import { CREDIT_PACKAGES } from '@/lib/stripe'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchaseComplete: (credits: number) => void
  currentCredits: number
}

export function PaymentModal({ isOpen, onClose, onPurchaseComplete, currentCredits }: PaymentModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handlePurchase = async (packageId: string) => {
    setIsProcessing(true)
    setSelectedPackage(packageId)
    
    try {
      // Mock payment processing for now
      // In production, this would integrate with Stripe Elements
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
      if (pkg) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Mock successful payment
        const totalCredits = pkg.credits + pkg.bonus
        onPurchaseComplete(totalCredits)
        onClose()
        
        alert(`¡Pago exitoso! Se agregaron ${totalCredits} créditos a tu cuenta.`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Error al procesar el pago. Inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
      setSelectedPackage(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-fitness-2xl animate-scale-in">
        <div className="sticky top-0 bg-surface/95 backdrop-blur-xl border-b border-border px-8 py-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="gradient-fitness-primary p-3 rounded-2xl">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-heading text-heading-xl text-text-primary">Boost Your Credits</h2>
              <p className="text-body-sm text-text-secondary">Current balance: <span className="text-primary font-bold">{currentCredits} credits</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-surface-tertiary rounded-2xl transition-colors text-text-secondary hover:text-text-primary"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex items-center gap-2 text-success">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-body-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-body-sm font-medium">Instant Credits</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-body-sm font-medium">Never Expires</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {CREDIT_PACKAGES.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`relative card-fitness-elevated p-6 cursor-pointer transition-all hover:scale-105 ${
                  pkg.popular
                    ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-surface to-secondary/10'
                    : 'hover:border-primary/30'
                } ${
                  selectedPackage === pkg.id && isProcessing
                    ? 'opacity-50 cursor-not-allowed scale-95'
                    : ''
                }`}
                onClick={() => !isProcessing && handlePurchase(pkg.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="badge-fitness-primary px-4 py-1 rounded-full text-caption-sm font-bold uppercase tracking-wide">
                      <Star className="w-3 h-3 mr-1 inline" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-br from-secondary/20 to-secondary/10' :
                    index === 1 ? 'bg-gradient-to-br from-primary/20 to-primary/10' :
                    'bg-gradient-to-br from-primary/20 to-primary/10'
                  }`}>
                    {index === 0 ? <Zap className="w-8 h-8 text-secondary" /> :
                     index === 1 ? <Star className="w-8 h-8 text-primary" /> :
                     <div className="w-8 h-8 text-primary">👑</div>}
                  </div>
                  
                  <h3 className="font-heading text-heading-lg text-text-primary mb-2">
                    {pkg.credits} {pkg.bonus > 0 && <span className="text-success">+{pkg.bonus}</span>}
                  </h3>
                  <p className="text-caption-md text-text-secondary mb-1">
                    Total: {pkg.credits + pkg.bonus} Credits
                  </p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-display-sm font-bold text-primary mb-1">
                    ${pkg.price}
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    {index === 0 ? 'Perfect for beginners' :
                     index === 1 ? 'Most popular choice' :
                     'Maximum value'}
                  </p>
                  {pkg.bonus > 0 && (
                    <div className="mt-3 badge-fitness-success">
                      <Zap className="w-3 h-3 mr-1" />
                      +{pkg.bonus} Bonus Credits!
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  {selectedPackage === pkg.id && isProcessing ? (
                    <div className="btn-fitness-outline opacity-50 cursor-not-allowed">
                      <div className="animate-pulse">Processing...</div>
                    </div>
                  ) : (
                    <div className={`${pkg.popular ? 'btn-fitness-primary' : 'btn-fitness-outline'} w-full`}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase {pkg.credits + pkg.bonus} Credits
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-info rounded-full"></div>
              <span className="text-body-sm font-semibold text-text-primary">Demo Mode Active</span>
            </div>
            <p className="text-body-sm text-text-secondary">
              This is a demonstration. No real payments will be processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}