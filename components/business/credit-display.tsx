'use client'

import { useState } from 'react'
import { Zap, Plus, TrendingUp, Sparkles, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
      case 'unlimited': return 'from-purple-400 to-pink-600'
      case 'premium': return 'from-blue-400 to-purple-600'
      case 'basic': return 'from-green-400 to-blue-600'
      default: return 'from-gray-400 to-gray-600'
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
    <Card className="bg-black/40 backdrop-blur-xl border-white/10 h-full">
      <CardHeader className="pb-4 border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-xl text-white">
          <div className="p-2 bg-gradient-to-r from-orange-400 to-pink-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          Credit Balance
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Credit Balance Display */}
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-pink-600/20 rounded-2xl blur-2xl"></div>
          <div className="relative">
            <div className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent mb-2">
              {currentCredits}
            </div>
            <div className="text-sm text-purple-200">
              Available Credits
            </div>
          </div>
        </div>

        {/* Subscription Tier */}
        {profile?.subscription_tier && (
          <div className="flex justify-center">
            <Badge 
              variant="outline" 
              className={`bg-gradient-to-r ${getTierColor(profile.subscription_tier)} text-white border-0 px-4 py-2 text-sm font-medium flex items-center gap-2`}
            >
              {getTierIcon(profile.subscription_tier)}
              {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)} Member
            </Badge>
          </div>
        )}

        {/* Quick Add Credits */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-purple-200 text-center">
            Quick Top-Up
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].map((credits) => (
              <button
                key={credits}
                onClick={() => handleQuickAdd(credits)}
                disabled={isUpdating}
                className="group relative px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-all hover:scale-105 disabled:opacity-50"
              >
                <span className="relative z-10">+{credits}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Purchase More Button */}
        <button
          onClick={onPurchaseCredits}
          className="relative w-full group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-gradient-to-r from-orange-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
            <Plus className="w-5 h-5" />
            Get More Credits
          </div>
        </button>

        {/* Credit Usage Tips */}
        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 p-4 rounded-xl border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-purple-200 mb-2">Pro Tips</div>
              <ul className="space-y-1 text-xs text-purple-300">
                <li className="flex items-center gap-1">
                  <span className="text-purple-400">•</span> Buy in bulk for 20% bonus credits
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-purple-400">•</span> Credits never expire
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-purple-400">•</span> Share with friends & family
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}