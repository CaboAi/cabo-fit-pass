'use client'

import { format } from 'date-fns'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'
import { Class } from '@/lib/supabase'

interface ClassCardProps {
  classItem: Class & { studios?: { name: string; location: string } }
  userCredits: number
  isBooking: boolean
  onBook: () => void
}

export function ClassCard({ classItem, userCredits, isBooking, onBook }: ClassCardProps) {
  const startTime = new Date(classItem.start_time)
  const endTime = new Date(classItem.end_time)
  const isFull = (classItem.current_bookings || 0) >= classItem.capacity
  const spotsLeft = classItem.capacity - (classItem.current_bookings || 0)
  
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityColor = () => {
    if (spotsLeft === 0) return 'text-red-600'
    if (spotsLeft <= 3) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header with title and difficulty */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
            {classItem.title}
          </h4>
          
          {classItem.difficulty && (
            <div className="inline-flex">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(classItem.difficulty)}`}>
                {classItem.difficulty}
              </span>
            </div>
          )}
        </div>
        
        {/* Availability indicator */}
        <div className="flex flex-col items-end">
          <div className={`w-3 h-3 rounded-full ${isFull ? 'bg-red-500' : spotsLeft <= 3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
          <span className={`text-xs font-medium mt-1 ${getAvailabilityColor()}`}>
            {spotsLeft} left
          </span>
        </div>
      </div>
      
      {/* Class details */}
      <div className="space-y-3 mb-5">
        {classItem.instructor && (
          <div className="flex items-center text-gray-600 text-sm">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>Instructor: <span className="font-medium">{classItem.instructor}</span></span>
          </div>
        )}
        
        <div className="flex items-center text-gray-600 text-sm">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">{format(startTime, 'EEEE, MMM d')}</span>
        </div>
        
        <div className="flex items-center text-gray-600 text-sm">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
        </div>
        
        {classItem.studios && (
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>{classItem.studios.name}</span>
          </div>
        )}
        
        <div className="flex items-center text-gray-600 text-sm">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <span>{classItem.current_bookings || 0} / {classItem.capacity} spots filled</span>
        </div>
      </div>
      
      {/* Price and booking section */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-green-600">
            ${classItem.price} MXN
          </div>
          <div className="text-xs text-gray-500">
            1 credit required
          </div>
        </div>
        
        <button
          onClick={onBook}
          disabled={userCredits < 1 || isBooking || isFull}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            userCredits < 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isFull
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isBooking
              ? 'bg-orange-200 text-orange-700 cursor-wait'
              : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {userCredits < 1
            ? 'Need More Credits'
            : isFull
            ? 'Class Full'
            : isBooking
            ? 'Booking...'
            : 'Book Class'
          }
        </button>
      </div>
    </div>
  )
}