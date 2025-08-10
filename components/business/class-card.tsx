'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, Users, MapPin, Star, Zap, Activity, ChevronRight, Flame, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClassItem } from '@/types'

interface ClassCardProps {
  classItem: ClassItem
  userCredits: number
  onBook: (classItem: ClassItem) => void
  isBooking?: boolean
}

export function ClassCard({ classItem, userCredits, onBook, isBooking }: ClassCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const canBook = userCredits >= classItem.credit_cost && 
                  (classItem.current_bookings || 0) < classItem.max_capacity

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-400 to-emerald-600'
      case 'intermediate': return 'from-yellow-400 to-orange-600'
      case 'advanced': return 'from-red-400 to-pink-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Activity className="w-3 h-3" />
      case 'intermediate': return <Flame className="w-3 h-3" />
      case 'advanced': return <Target className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  const getIntensityBars = (difficulty: string) => {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
    const level = levels[difficulty] || 1
    return Array(3).fill(0).map((_, i) => (
      <div 
        key={i} 
        className={`h-2 w-2 rounded-full ${
          i < level ? 'bg-gradient-to-r from-orange-400 to-pink-600' : 'bg-white/20'
        }`}
      />
    ))
  }

  const spotsRemaining = classItem.max_capacity - (classItem.current_bookings || 0)
  const isAlmostFull = spotsRemaining <= 3 && spotsRemaining > 0

  return (
    <Card className="group relative bg-black/40 backdrop-blur-xl border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="relative pb-4 border-b border-white/10">
        <div className="space-y-3">
          {/* Header with Class Type Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-white mb-1 line-clamp-1">
                {classItem.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-purple-300">{classItem.studio?.name || 'Studio'}</span>
                {classItem.studio?.rating && classItem.studio.rating > 0 && (
                  <>
                    <span className="text-purple-500">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-purple-300">{classItem.studio.rating}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`bg-gradient-to-r ${getDifficultyColor(classItem.difficulty_level)} text-white border-0 px-2 py-1 text-xs font-semibold flex items-center gap-1`}
            >
              {getDifficultyIcon(classItem.difficulty_level)}
              <span className="capitalize">{classItem.difficulty_level}</span>
            </Badge>
          </div>

          {/* Intensity Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-400">Intensity</span>
            <div className="flex gap-1">
              {getIntensityBars(classItem.difficulty_level)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-4 space-y-4">
        {/* Time and Duration */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-purple-300">Class Time</p>
              <p className="text-sm font-semibold text-white">
                {format(new Date(classItem.start_time), 'MMM dd, h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-300">Duration</p>
            <p className="text-sm font-semibold text-white">{classItem.duration} min</p>
          </div>
        </div>

        {/* Capacity with Visual Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300">Capacity</span>
            </div>
            <span className="text-white font-medium">
              {classItem.current_bookings || 0}/{classItem.max_capacity}
              {isAlmostFull && (
                <span className="ml-2 text-xs text-orange-400">Almost Full!</span>
              )}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r transition-all duration-500 ${
                isAlmostFull ? 'from-orange-400 to-red-500' : 'from-purple-400 to-pink-600'
              }`}
              style={{ width: `${((classItem.current_bookings || 0) / classItem.max_capacity) * 100}%` }}
            />
          </div>
        </div>

        {/* Credit Cost */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-600/10 to-pink-600/10 rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-300">Credits Required</span>
          </div>
          <span className="text-lg font-bold text-orange-400">
            {classItem.credit_cost}
          </span>
        </div>

        {/* Description */}
        {classItem.description && (
          <div className="text-sm text-purple-200">
            <p className="line-clamp-2">
              {classItem.description}
            </p>
            {classItem.description.length > 100 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-purple-400 hover:text-purple-300 mt-1 text-xs font-medium flex items-center gap-1"
              >
                {showDetails ? 'Show less' : 'Read more'}
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
            )}
            {showDetails && (
              <p className="mt-2 text-purple-300">
                {classItem.description}
              </p>
            )}
          </div>
        )}

        {/* Booking Button */}
        <div className="pt-2">
          {canBook ? (
            <button
              onClick={() => onBook(classItem)}
              disabled={isBooking}
              className="relative w-full group/btn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 group-hover/btn:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                {isBooking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    <span>Book Class</span>
                  </>
                )}
              </div>
            </button>
          ) : (
            <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              {userCredits < classItem.credit_cost ? (
                <div>
                  <p className="text-red-400 text-sm font-medium">
                    Insufficient Credits
                  </p>
                  <p className="text-red-300 text-xs mt-1">
                    Need {classItem.credit_cost - userCredits} more credit{classItem.credit_cost - userCredits !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <p className="text-red-400 text-sm font-medium">Class Full</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}