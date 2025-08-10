'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ClassItem, ClassBooking, BookingResult } from '@/types'

interface UseClassesReturn {
  classes: ClassItem[]
  loading: boolean
  error: string | null
  bookClass: (classId: string) => Promise<BookingResult>
  refreshClasses: () => Promise<void>
  getUserBookings: () => Promise<ClassBooking[]>
}

export function useClasses(): UseClassesReturn {
  const { data: session } = useSession()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/classes')
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      
      const data = await response.json()
      if (data.success && data.data?.classes) {
        setClasses(data.data.classes)
      } else {
        throw new Error(data.error || 'Failed to load classes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classes')
      console.error('Error fetching classes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const bookClass = useCallback(async (classId: string): Promise<BookingResult> => {
    if (!session?.user?.email) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classId,
          user_email: session.user.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to book class')
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Booking failed'
      console.error('Error booking class:', err)
      return { success: false, error: errorMessage }
    }
  }, [session?.user?.email])

  const getUserBookings = useCallback(async (): Promise<ClassBooking[]> => {
    if (!session?.user?.email) {
      return []
    }

    try {
      const response = await fetch('/api/bookings')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const data = await response.json()
      if (data.success && data.data?.bookings) {
        return data.data.bookings
      } else {
        throw new Error(data.error || 'Failed to load bookings')
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err)
      return []
    }
  }, [session?.user?.email])

  const refreshClasses = useCallback(async () => {
    await fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  return {
    classes,
    loading,
    error,
    bookClass,
    refreshClasses,
    getUserBookings,
  }
}
