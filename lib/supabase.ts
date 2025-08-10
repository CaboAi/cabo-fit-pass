import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Class {
  id: string
  title: string
  start_time: string
  end_time: string
  capacity: number
  price: number
  instructor?: string
  difficulty?: string
  gym_id: string
  current_bookings?: number
}

export interface Booking {
  id?: string
  user_id: string
  class_id: string
  type: string
  payment_status: string
  booking_date: string
  notes?: string
  created_at?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  credits: number
  tier: 'basic' | 'premium' | 'unlimited'
  created_at?: string
  updated_at?: string
}

// User Profile Functions
export async function getUserProfile(userId: string): Promise<{ success: boolean; data?: Profile; error?: unknown }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return { success: false, error }
  }
}

export async function updateUserCredits(userId: string, newCredits: number): Promise<{ success: boolean; data?: Profile; error?: unknown }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating user credits:', error)
    return { success: false, error }
  }
}

// Class Functions
export async function getAllClasses(): Promise<{ success: boolean; data: Class[]; error?: unknown }> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        studios (
          name,
          location
        )
      `)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20)
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting classes:', error)
    return { success: false, error, data: [] }
  }
}

export async function getClassWithBookingCount(classId: string): Promise<{ success: boolean; data?: Class & { current_bookings: number }; error?: unknown }> {
  try {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
    
    if (classError) throw classError
    
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('payment_status', 'paid')
    
    if (countError) throw countError
    
    return { 
      success: true, 
      data: { 
        ...classData, 
        current_bookings: count || 0 
      } 
    }
  } catch (error) {
    console.error('Error getting class with booking count:', error)
    return { success: false, error }
  }
}

// Booking Functions
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Booking; error?: unknown }> {
  try {
    // First, check if class has capacity
    const classResult = await getClassWithBookingCount(booking.class_id)
    if (!classResult.success || !classResult.data) {
      throw new Error('Class not found')
    }
    
    if (classResult.data.current_bookings >= classResult.data.capacity) {
      throw new Error('Class is full')
    }
    
    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating booking:', error)
    return { success: false, error }
  }
}

export async function getUserBookings(userId: string): Promise<{ success: boolean; data: Booking[]; error?: unknown }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          title,
          start_time,
          end_time,
          instructor,
          studios (
            name,
            location
          )
        )
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false })
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting user bookings:', error)
    return { success: false, error, data: [] }
  }
}

// Utility Functions
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error }
  }
}
