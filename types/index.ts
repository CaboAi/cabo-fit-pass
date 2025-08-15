// Core Types for Cabo Fit Pass
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  user_type: 'member' | 'instructor' | 'studio_owner'
  credits: number
  subscription_tier: 'free' | 'basic' | 'premium' | 'unlimited'
  created_at?: string
  updated_at?: string
}

export interface Studio {
  id: string
  name: string
  owner_id: string
  description?: string
  location: {
    lat: number
    lng: number
    address: string
    neighborhood: string
  }
  amenities: string[]
  rating: number
  created_at?: string
}

export interface ClassItem {
  id: string
  studio_id: string
  name: string
  instructor_id?: string
  class_type: string
  description?: string
  start_time: string
  duration: number // minutes
  max_capacity: number
  credit_cost: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  created_at?: string
  // Extended fields for UI
  studio?: Studio
  current_bookings?: number
}

export interface ClassBooking {
  id?: string
  user_id: string
  class_id: string
  credits_used: number
  booking_status: 'confirmed' | 'cancelled' | 'completed'
  created_at?: string
  // Extended fields for UI
  class?: ClassItem
}

export interface PaymentIntent {
  id: string
  amount: number
  status: string
  client_secret: string
}

export interface CreditPackage {
  id: string
  credits: number
  price: number
  description: string
  popular?: boolean
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface BookingResult {
  success: boolean
  booking?: ClassBooking
  remainingCredits?: number
  error?: string
}

// Form Types
export interface BookingFormData {
  class_id: string
  user_id: string
  credits_used: number
}

export interface PaymentFormData {
  amount: number
  currency: string
  description: string
}

// Studio Management Types
export interface StudioOwnerProfile extends UserProfile {
  user_type: 'studio_owner'
  studios_owned: string[]
}

export interface ClassWithMetrics extends ClassItem {
  revenue: number
  bookings: number
  attendance_rate: number
  avg_rating: number
}

export interface StudioAnalytics {
  totalRevenue: number
  totalBookings: number
  activeClasses: number
  avgRating: number
  revenueByType: Record<string, number>
  monthlyTrend: Array<{ month: string; revenue: number; bookings: number }>
  peakHours: Record<number, number>
  topPerformingClasses: ClassWithMetrics[]
}

export interface ClassFormData {
  name: string
  class_type: string
  description?: string
  start_time: string
  duration: number
  max_capacity: number
  credit_cost: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  instructor_id?: string
}