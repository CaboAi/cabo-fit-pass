'use client'

import { useState, useEffect } from 'react'
import { getAllClasses, createBooking, Class, supabase } from '@/lib/supabase'

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClasses()

    // Set up real-time subscription for classes
    const classesSubscription = supabase
      .channel('classes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        () => {
          // Refresh classes when there are changes
          loadClasses()
        }
      )
      .subscribe()

    // Set up real-time subscription for bookings to update counts
    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Refresh classes when bookings change to update counts
          loadClasses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(classesSubscription)
      supabase.removeChannel(bookingsSubscription)
    }
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getAllClasses()
      
      if (result.success) {
        setClasses(result.data)
      } else {
        setError('Failed to load classes')
        console.error('Error loading classes:', result.error)
      }
    } catch (err) {
      console.error('Error loading classes:', err)
      setError('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const bookClass = async (classId: string) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Refresh classes to update booking counts
        await loadClasses()
        return { success: true, remainingCredits: result.remainingCredits }
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to book class' 
        }
      }
    } catch (err) {
      console.error('Error booking class:', err)
      return { 
        success: false, 
        error: 'Failed to book class' 
      }
    }
  }

  const refreshClasses = () => {
    loadClasses()
  }

  return {
    classes,
    loading,
    error,
    bookClass,
    refreshClasses
  }
}