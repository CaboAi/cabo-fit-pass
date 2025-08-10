'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditPackage } from '@/types'
import { 
  X, 
  Zap, 
  Crown, 
  Star, 
  Sparkles, 
  CreditCard, 
  Shield, 
  CheckCircle,
  TrendingUp,
  Gift
} from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchaseComplete: (creditsAdded: number) => void
  currentCredits: number
}

const CREDIT_PACKAGES: (CreditPackage & { 
  popular?: boolean
  bonus?: number
  savings?: string
  description?: string
  icon?: React.ReactNode
})[] = [
  { 
    id: 'starter', 
    credits: 10, 
    price: 25, 
    popular: false,
    bonus: 2,
    description: 'Perfect for beginners',
    icon: <Zap className="w-6 h-6" />
  },
  { 
    id: 'premium', 
    credits: 25, 
    price: 50, 
    popular: true,
    bonus: 8,
    savings: 'Save 20%',
    description: 'Most popular choice',
    icon: <Star className="w-6 h-6" />
  },
  { 
    id: 'ultimate', 
    credits: 50, 
    price: 90, 
    popular: false,
    bonus: 20,
    savings: 'Save 35%',
    description: 'Maximum value',
    icon: <Crown className="w-6 h-6" />
  }
]

export function PaymentModal({ isOpen, onClose, onPurchaseComplete, currentCredits }: PaymentModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handlePurchase = async () => {
    if (!selectedPackage) return
    
    setIsProcessing(true)
    
    // Simulate payment processing for demo
    setTimeout(() => {
      const packageData = CREDIT_PACKAGES.find(pkg => pkg.id === selectedPackage.id)
      const totalCredits = selectedPackage.credits + (packageData?.bonus || 0)
      onPurchaseComplete(totalCredits)
      setIsProcessing(false)
      setSelectedPackage(null)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
        
        <Card className="relative bg-black/80 backdrop-blur-xl border-white/10 text-white">
          <CardHeader className="relative border-b border-white/10 pb-6">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-purple-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Content */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-orange-400 to-pink-600 text-white p-4 rounded-full">
                    <CreditCard className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                  Boost Your Credits
                </CardTitle>
                <CardDescription className="text-purple-300 text-lg">
                  Current balance: <span className="font-semibold text-orange-400">{currentCredits} credits</span>
                </CardDescription>
              </div>

              {/* Trust Indicators */}
              <div className="flex justify-center gap-6 text-xs text-purple-300">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Instant Credits</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span>Never Expires</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Credit Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CREDIT_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id
                const totalCredits = pkg.credits + (pkg.bonus || 0)
                
                return (
                  <div
                    key={pkg.id}
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isSelected ? 'scale-105' : 'hover:scale-102'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {/* Popular Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-orange-400 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          MOST POPULAR
                        </div>
                      </div>
                    )}

                    {/* Package Card */}
                    <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? 'border-purple-400 bg-gradient-to-br from-purple-600/20 to-pink-600/20' 
                        : 'border-white/10 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                    }`}>
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle className="w-6 h-6 text-purple-400" />
                        </div>
                      )}

                      {/* Package Icon */}
                      <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-xl ${
                          pkg.popular 
                            ? 'bg-gradient-to-r from-orange-400/20 to-pink-600/20 text-orange-400' 
                            : 'bg-white/10 text-purple-400'
                        }`}>
                          {pkg.icon}
                        </div>
                      </div>

                      {/* Package Details */}
                      <div className="text-center space-y-3">
                        <div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {pkg.credits}
                            {pkg.bonus && (
                              <span className="text-lg text-green-400 ml-1">
                                +{pkg.bonus}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-purple-300">
                            Total: {totalCredits} Credits
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                            ${pkg.price}
                          </div>
                          {pkg.savings && (
                            <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full inline-block">
                              {pkg.savings}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-purple-400">{pkg.description}</p>

                        {/* Value Proposition */}
                        {pkg.bonus && (
                          <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                            <Gift className="w-3 h-3" />
                            <span>+{pkg.bonus} Bonus Credits!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Package Summary */}
            {selectedPackage && (
              <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 p-6 rounded-2xl border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-orange-400 to-pink-600 rounded-xl">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">Purchase Summary</h3>
                      <p className="text-purple-300">
                        {selectedPackage.credits} credits + {CREDIT_PACKAGES.find(p => p.id === selectedPackage.id)?.bonus || 0} bonus = {' '}
                        <span className="text-orange-400 font-semibold">
                          {selectedPackage.credits + (CREDIT_PACKAGES.find(p => p.id === selectedPackage.id)?.bonus || 0)} total credits
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">${selectedPackage.price}</div>
                    <div className="text-sm text-purple-300">One-time payment</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handlePurchase}
                disabled={!selectedPackage || isProcessing}
                className="relative flex-1 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100">
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Purchase {selectedPackage?.credits || 0} Credits</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Demo Notice */}
            <div className="text-center p-4 bg-blue-600/10 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-semibold">Demo Mode Active</span>
              </div>
              <p className="text-blue-300 text-xs mt-1">
                This is a demonstration. No real payments will be processed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}