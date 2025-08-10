export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          user_type: 'member' | 'instructor' | 'studio_owner'
          credits: number
          subscription_tier: 'free' | 'basic' | 'premium' | 'unlimited'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          user_type?: 'member' | 'instructor' | 'studio_owner'
          credits?: number
          subscription_tier?: 'free' | 'basic' | 'premium' | 'unlimited'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          user_type?: 'member' | 'instructor' | 'studio_owner'
          credits?: number
          subscription_tier?: 'free' | 'basic' | 'premium' | 'unlimited'
          created_at?: string
          updated_at?: string
        }
      }
      studios: {
        Row: {
          id: string
          name: string
          owner_id: string
          description: string | null
          location: {
            lat: number
            lng: number
            address: string
            neighborhood: string
          }
          amenities: string[]
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          description?: string | null
          location: {
            lat: number
            lng: number
            address: string
            neighborhood: string
          }
          amenities?: string[]
          rating?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          description?: string | null
          location?: {
            lat: number
            lng: number
            address: string
            neighborhood: string
          }
          amenities?: string[]
          rating?: number
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          studio_id: string
          name: string
          instructor_id: string | null
          class_type: string
          description: string | null
          start_time: string
          duration: number
          max_capacity: number
          credit_cost: number
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          created_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          name: string
          instructor_id?: string | null
          class_type: string
          description?: string | null
          start_time: string
          duration?: number
          max_capacity?: number
          credit_cost?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          created_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          name?: string
          instructor_id?: string | null
          class_type?: string
          description?: string | null
          start_time?: string
          duration?: number
          max_capacity?: number
          credit_cost?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          class_id: string
          credits_used: number
          booking_status: 'confirmed' | 'cancelled' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          credits_used: number
          booking_status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          credits_used?: number
          booking_status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Studio = Database['public']['Tables']['studios']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type StudioInsert = Database['public']['Tables']['studios']['Insert']
export type ClassInsert = Database['public']['Tables']['classes']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type StudioUpdate = Database['public']['Tables']['studios']['Update']
export type ClassUpdate = Database['public']['Tables']['classes']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
