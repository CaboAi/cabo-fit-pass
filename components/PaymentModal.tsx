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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-fitness-2xl animate-scale-in">
        <div className="sticky top-0 bg-surface/95 backdrop-blur-xl border-b border-border px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="gradient-fitness-primary p-2 sm:p-3 rounded-xl sm:rounded-2xl flex-shrink-0">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg sm:text-heading-xl text-text-primary truncate">Boost Your Credits</h2>
              <p className="text-xs sm:text-body-sm text-text-secondary">
                Balance: <span className="text-primary font-bold">{currentCredits} credits</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-3 hover:bg-surface-tertiary rounded-xl sm:rounded-2xl transition-colors text-text-secondary hover:text-text-primary flex-shrink-0 ml-2"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        
        <div className="p-4 sm:p-8">
          {/* Trust indicators - responsive layout */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-success">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-body-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-body-sm font-medium">Instant Credits</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-body-sm font-medium">Never Expires</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {CREDIT_PACKAGES.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`relative card-fitness-elevated bg-surface p-4 sm:p-6 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
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
                  <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
                    <div className="badge-fitness-primary px-3 sm:px-4 py-1 rounded-full text-xs sm:text-caption-sm font-bold uppercase tracking-wide">
                      <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-1 inline" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-4 sm:mb-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-br from-secondary/20 to-secondary/10' :
                    index === 1 ? 'bg-gradient-to-br from-primary/20 to-primary/10' :
                    'bg-gradient-to-br from-primary/20 to-primary/10'
                  }`}>
                    {index === 0 ? <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" /> :
                     index === 1 ? <Star className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> :
                     <div className="w-6 h-6 sm:w-8 sm:h-8 text-primary text-xl sm:text-2xl">👑</div>}
                  </div>
                  
                  <h3 className="font-heading text-lg sm:text-heading-lg text-text-primary mb-1 sm:mb-2">
                    {pkg.credits} {pkg.bonus > 0 && <span className="text-success">+{pkg.bonus}</span>}
                  </h3>
                  <p className="text-xs sm:text-caption-md text-text-secondary mb-1">
                    Total: {pkg.credits + pkg.bonus} Credits
                  </p>
                </div>
                
                <div className="text-center mb-4 sm:mb-6">
                  <div className="text-xl sm:text-display-sm font-bold text-primary mb-1">
                    ${pkg.price}
                  </div>
                  <p className="text-xs sm:text-body-sm text-text-secondary">
                    {index === 0 ? 'Perfect for beginners' :
                     index === 1 ? 'Most popular choice' :
                     'Maximum value'}
                  </p>
                  {pkg.bonus > 0 && (
                    <div className="mt-2 sm:mt-3 badge-fitness-success text-xs sm:text-sm">
                      <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                      +{pkg.bonus} Bonus Credits!
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  {selectedPackage === pkg.id && isProcessing ? (
                    <div className="btn-fitness-outline opacity-50 cursor-not-allowed py-3 sm:py-2 text-sm sm:text-base">
                      <div className="animate-pulse">Processing...</div>
                    </div>
                  ) : (
                    <div className={`${pkg.popular ? 'btn-fitness-primary' : 'btn-fitness-outline'} w-full py-3 sm:py-2 text-sm sm:text-base`}>
                      <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Purchase {pkg.credits + pkg.bonus} Credits
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl sm:rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-2 h-2 bg-info rounded-full"></div>
              <span className="text-xs sm:text-body-sm font-semibold text-text-primary">Demo Mode Active</span>
            </div>
            <p className="text-xs sm:text-body-sm text-text-secondary">
              This is a demonstration. No real payments will be processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}