'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, Users, MapPin, Star, Zap, Activity, ChevronRight, Flame, Target } from 'lucide-react'
// Card and Badge components not used - imports removed for cleaner code
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
      case 'beginner': return 'badge-fitness-beginner'
      case 'intermediate': return 'badge-fitness-intermediate'
      case 'advanced': return 'badge-fitness-advanced'
      default: return 'badge-fitness'
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
    const levels: Record<string, number> = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
    const level = levels[difficulty] || 1
    return Array(3).fill(0).map((_, i) => (
      <div 
        key={i} 
        className={`h-2 w-2 rounded-full ${
          i < level ? 'gradient-fitness-primary' : 'bg-surface-tertiary'
        }`}
      />
    ))
  }

  const spotsRemaining = classItem.max_capacity - (classItem.current_bookings || 0)
  const isAlmostFull = spotsRemaining <= 3 && spotsRemaining > 0

  return (
    <div className="card-fitness-workout group animate-scale-in">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 gradient-fitness-surface opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
      
      <div className="relative p-6 border-b border-border">
        <div className="space-y-3">
          {/* Header with Class Type Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-heading text-heading-lg text-text-primary mb-1 line-clamp-1">
                {classItem.name}
              </h3>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-text-tertiary" />
                <span className="text-caption-md text-text-secondary">{classItem.studio?.name || 'Studio'}</span>
                {classItem.studio?.rating && classItem.studio.rating > 0 && (
                  <>
                    <span className="text-text-tertiary">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span className="text-caption-md text-text-secondary">{classItem.studio.rating}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className={`${getDifficultyColor(classItem.difficulty_level)} flex items-center gap-1`}>
              {getDifficultyIcon(classItem.difficulty_level)}
              <span className="capitalize">{classItem.difficulty_level}</span>
            </div>
          </div>

          {/* Intensity Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-caption-md text-text-tertiary">Intensity</span>
            <div className="flex gap-1">
              {getIntensityBars(classItem.difficulty_level)}
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-6 pt-4 space-y-4">
        {/* Time and Duration */}
        <div className="flex items-center justify-between card-fitness p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <div>
              <p className="text-caption-sm text-text-tertiary">Class Time</p>
              <p className="text-body-sm font-semibold text-text-primary">
                {format(new Date(classItem.start_time), 'MMM dd, h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-caption-sm text-text-tertiary">Duration</p>
            <p className="text-body-sm font-semibold text-text-primary">{classItem.duration} min</p>
          </div>
        </div>

        {/* Capacity with Visual Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-body-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-text-tertiary" />
              <span className="text-text-secondary">Capacity</span>
            </div>
            <span className="text-text-primary font-medium">
              {classItem.current_bookings || 0}/{classItem.max_capacity}
              {isAlmostFull && (
                <span className="ml-2 text-caption-sm text-warning">Almost Full!</span>
              )}
            </span>
          </div>
          <div className="progress-fitness">
            <div 
              className={`progress-fitness-fill ${
                isAlmostFull ? 'bg-gradient-to-r from-warning to-error' : ''
              }`}
              style={{ width: `${((classItem.current_bookings || 0) / classItem.max_capacity) * 100}%` }}
            />
          </div>
        </div>

        {/* Credit Cost */}
        <div className="flex items-center justify-between card-fitness p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-body-sm text-text-secondary">Credits Required</span>
          </div>
          <span className="text-heading-md font-heading text-primary">
            {classItem.credit_cost}
          </span>
        </div>

        {/* Description */}
        {classItem.description && (
          <div className="text-body-sm text-text-secondary">
            <p className="line-clamp-2">
              {classItem.description}
            </p>
            {classItem.description.length > 100 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-primary hover:text-primary/80 mt-1 text-caption-md font-medium flex items-center gap-1 focus-fitness"
              >
                {showDetails ? 'Show less' : 'Read more'}
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
            )}
            {showDetails && (
              <p className="mt-2 text-text-primary">
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
              <div className="absolute inset-0 gradient-fitness-primary rounded-xl blur-md opacity-30 group-hover/btn:opacity-60 transition-opacity shadow-fitness-glow-primary"></div>
              <div className="relative btn-fitness-primary w-full justify-center gap-2 animate-fitness-bounce hover:shadow-fitness-glow-primary">
                {isBooking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
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
            <div className="text-center card-fitness p-3 bg-gradient-to-r from-error/10 to-error/5 border-error/20">
              {userCredits < classItem.credit_cost ? (
                <div>
                  <p className="text-error text-body-sm font-medium">
                    Insufficient Credits
                  </p>
                  <p className="text-error/80 text-caption-md mt-1">
                    Need {classItem.credit_cost - userCredits} more credit{classItem.credit_cost - userCredits !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <p className="text-error text-body-sm font-medium">Class Full</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}