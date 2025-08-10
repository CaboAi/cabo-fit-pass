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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Comprar Créditos</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-800">
              <strong>Créditos actuales:</strong> {currentCredits}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Cada clase requiere 1 crédito para reservar
            </div>
          </div>

          <div className="space-y-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  pkg.popular
                    ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                } ${
                  selectedPackage === pkg.id && isProcessing
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => !isProcessing && handlePurchase(pkg.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${
                        pkg.popular ? 'text-orange-800' : 'text-gray-800'
                      }`}>
                        {pkg.credits} Créditos
                      </span>
                      
                      {pkg.bonus > 0 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          pkg.popular ? 'bg-orange-200 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          <Zap className="h-3 w-3 mr-1" />
                          +{pkg.bonus} Bonus
                        </span>
                      )}
                      
                      {pkg.popular && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400 text-yellow-900">
                          <Star className="h-3 w-3 mr-1" />
                          Más Popular
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-lg font-bold ${
                      pkg.popular ? 'text-orange-800' : 'text-gray-800'
                    }`}>
                      ${pkg.price} MXN
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Total: {pkg.credits + pkg.bonus} créditos
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {selectedPackage === pkg.id && isProcessing ? (
                      <div className="text-sm text-gray-500">Procesando...</div>
                    ) : (
                      <div className="flex items-center text-orange-600">
                        <CreditCard className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Comprar</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
            <div>• Pago seguro procesado por Stripe</div>
            <div>• Los créditos se agregan instantáneamente</div>
            <div>• Los créditos no expiran</div>
            <div>• Soporte 24/7 disponible</div>
          </div>
        </div>
      </div>
    </div>
  )
}