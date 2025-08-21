'use client'

import { Coins, Plus, TrendingUp, Star, Zap } from "lucide-react"
import { useState } from 'react'

interface CreditDisplayProps {
  currentCredits: number
  onPurchaseCredits: () => void
  onCreditsUpdate?: (newCredits: number) => void
}

export function CreditDisplay({ 
  currentCredits, 
  onPurchaseCredits,
  onCreditsUpdate 
}: CreditDisplayProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickPurchase, setShowQuickPurchase] = useState(false)

  const handleQuickAdd = async (amount: number) => {
    setIsLoading(true)
    setTimeout(() => {
      const newCredits = currentCredits + amount
      onCreditsUpdate?.(newCredits)
      setIsLoading(false)
      alert(`Added ${amount} credits! Total: ${newCredits}`)
    }, 1000)
  }

  const getCreditStatus = () => {
    if (currentCredits === 0) return { 
      color: "bg-red-100 text-red-800 border-red-200", 
      text: "No credits",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    }
    if (currentCredits <= 2) return { 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      text: "Low credits",
      bgColor: "bg-yellow-50", 
      textColor: "text-yellow-700"
    }
    if (currentCredits <= 5) return { 
      color: "bg-blue-100 text-blue-800 border-blue-200", 
      text: "Good",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    }
    return { 
      color: "bg-green-100 text-green-800 border-green-200", 
      text: "Plenty",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    }
  }

  const status = getCreditStatus()

  const creditPackages = [
    { credits: 5, price: 25, bonus: 0, popular: false },
    { credits: 10, price: 45, bonus: 2, popular: true },
    { credits: 20, price: 80, bonus: 5, popular: false }
  ]

  return (
    <div className="w-full">
      {/* Main Credit Card */}
      <div className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-600" />
            Your Credits
          </h3>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${status.color}`}>
            {status.text}
          </span>
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-bold text-orange-600">
                {currentCredits}
              </div>
              <div className="text-sm text-gray-500">
                {currentCredits === 1 ? 'credit' : 'credits'} available
              </div>
            </div>
            
            <div className="flex gap-2">
              {currentCredits < 8 && (
                <button 
                  onClick={() => handleQuickAdd(5)}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-md text-xs h-8 px-3 border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? '...' : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      +5 Quick
                    </>
                  )}
                </button>
              )}
              
              <button 
                onClick={onPurchaseCredits}
                className="inline-flex items-center justify-center rounded-md text-sm h-9 px-4 bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-sm"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Buy More
              </button>
            </div>
          </div>

          {/* Credit Status Messages */}
          {currentCredits === 0 && (
            <div className={`p-3 rounded-lg border ${status.bgColor} border-red-200`}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <p className={`text-sm font-medium ${status.textColor}`}>
                  You need credits to book classes
                </p>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Get started with a credit package to book your first class!
              </p>
            </div>
          )}

          {currentCredits > 0 && currentCredits <= 2 && (
            <div className={`p-3 rounded-lg border ${status.bgColor} border-yellow-200`}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <p className={`text-sm font-medium ${status.textColor}`}>
                  Running low on credits
                </p>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Consider buying more credits to avoid missing out on classes.
              </p>
            </div>
          )}

          {currentCredits >= 10 && (
            <div className={`p-3 rounded-lg border ${status.bgColor} border-green-200`}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className={`text-sm font-medium ${status.textColor}`}>
                  You&apos;re all set for the week!
                </p>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Plenty of credits to book your favorite classes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Purchase Options */}
      {(currentCredits < 5 || showQuickPurchase) && (
        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-orange-800">Quick Purchase</h4>
            {!showQuickPurchase && currentCredits >= 5 && (
              <button 
                onClick={() => setShowQuickPurchase(false)}
                className="text-xs text-orange-600 hover:text-orange-800"
              >
                Hide
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {creditPackages.map((pkg, index) => (
              <button
                key={index}
                onClick={() => handleQuickAdd(pkg.credits + pkg.bonus)}
                disabled={isLoading}
                className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm disabled:opacity-50 ${pkg.popular ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${pkg.popular ? 'text-orange-800' : 'text-gray-800'}`}>
                        {pkg.credits} Credits
                      </span>
                      {pkg.bonus > 0 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pkg.popular ? 'bg-orange-200 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                          <Zap className="h-3 w-3 mr-1" />
                          +{pkg.bonus} Bonus
                        </span>
                      )}
                      {pkg.popular && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400 text-yellow-900">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${pkg.popular ? 'text-orange-700' : 'text-gray-600'}`}>
                      MXN ${pkg.price} {pkg.bonus > 0 && `Total: ${pkg.credits + pkg.bonus} credits`}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${pkg.popular ? 'text-orange-800' : 'text-gray-800'}`}>
                    {isLoading ? '...' : `${pkg.credits + pkg.bonus}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <p className="text-xs text-orange-700 mt-3 text-center">
            All purchases are processed instantly • Secure payment
          </p>
        </div>
      )}

      {/* Show Quick Purchase Toggle */}
      {currentCredits >= 5 && !showQuickPurchase && (
        <button
          onClick={() => setShowQuickPurchase(true)}
          className="mt-3 w-full text-center text-sm text-orange-600 hover:text-orange-800 transition-colors"
        >
          Show quick purchase options
        </button>
      )}
    </div>
  )
}

export default CreditDisplay
