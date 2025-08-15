'use client'

import { useState } from 'react'
import { Zap, Plus, TrendingUp, Sparkles, Crown } from 'lucide-react'
// Card and Badge components not used - imports removed for cleaner code
import { UserProfile } from '@/types'

interface CreditDisplayProps {
  currentCredits: number
  onPurchaseCredits: () => void
  onCreditsUpdate: (creditsToAdd: number) => void
  profile?: UserProfile
}

export function CreditDisplay({ 
  currentCredits, 
  onPurchaseCredits, 
  onCreditsUpdate,
  profile 
}: CreditDisplayProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'unlimited': return 'badge-fitness bg-gradient-to-r from-warning to-accent-purple text-warning-foreground'
      case 'premium': return 'badge-fitness bg-gradient-to-r from-secondary to-accent-blue text-secondary-foreground'
      case 'basic': return 'badge-fitness bg-gradient-to-r from-success to-accent-green text-success-foreground'
      default: return 'badge-fitness'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'unlimited': return <Crown className="w-4 h-4" />
      case 'premium': return <Sparkles className="w-4 h-4" />
      case 'basic': return <Zap className="w-4 h-4" />
      default: return <TrendingUp className="w-4 h-4" />
    }
  }

  const handleQuickAdd = async (credits: number) => {
    setIsUpdating(true)
    try {
      await onCreditsUpdate(credits)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="card-fitness-stats h-full animate-scale-in">
      <div className="pb-4 border-b border-border p-6">
        <h3 className="flex items-center gap-2 font-heading text-heading-lg text-text-primary">
          <div className="p-2 gradient-fitness-primary rounded-lg shadow-fitness-glow-primary">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          Credit Balance
        </h3>
      </div>

      <div className="space-y-6 pt-6 p-6">
        {/* Credit Balance Display */}
        <div className="text-center relative">
          <div className="absolute inset-0 gradient-fitness-secondary rounded-2xl blur-2xl opacity-30"></div>
          <div className="relative">
            <div className="text-6xl font-heading font-bold gradient-fitness-text mb-2 animate-fitness-glow">
              {currentCredits}
            </div>
            <div className="text-body-sm text-text-secondary">
              Available Credits
            </div>
          </div>
        </div>

        {/* Subscription Tier */}
        {profile?.subscription_tier && (
          <div className="flex justify-center">
            <div className={`${getTierColor(profile.subscription_tier)} px-4 py-2 flex items-center gap-2`}>
              {getTierIcon(profile.subscription_tier)}
              {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)} Member
            </div>
          </div>
        )}

        {/* Quick Add Credits */}
        <div className="space-y-3">
          <div className="text-body-sm font-medium text-text-secondary text-center">
            Quick Top-Up
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].map((credits) => (
              <button
                key={credits}
                onClick={() => {
                  handleQuickAdd(credits)
                  onPurchaseCredits()
                }}
                disabled={isUpdating}
                className="px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 animate-fade-in bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 hover:border-blue-400 hover:shadow-md"
                style={{ animationDelay: `${credits * 0.1}s` }}
              >
                <span className="relative z-10 text-white">+{credits}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Purchase More Button */}
        <button
          onClick={onPurchaseCredits}
          className="relative w-full group"
        >
          <div className="absolute inset-0 gradient-fitness-primary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity shadow-fitness-glow-primary"></div>
          <div className="relative btn-fitness-primary w-full justify-center gap-2 animate-fitness-bounce hover:shadow-fitness-glow-primary">
            <Plus className="w-5 h-5" />
            Get More Credits
          </div>
        </button>

        {/* Credit Usage Tips */}
        <div className="card-fitness p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-caption-lg font-semibold text-text-primary mb-2">Pro Tips</div>
              <ul className="space-y-1 text-caption-md text-text-secondary">
                <li className="flex items-center gap-1">
                  <span className="text-primary">•</span> Buy in bulk for 20% bonus credits
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-primary">•</span> Credits never expire
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-primary">•</span> Share with friends & family
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}