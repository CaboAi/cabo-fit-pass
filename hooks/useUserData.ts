'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getUserProfile, updateUserCredits, Profile } from '@/lib/supabase'

export function useUserData() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    loadUserProfile()
  }, [session])

  const loadUserProfile = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await getUserProfile(session.user.email)
      
      if (result.success && result.data) {
        setProfile(result.data)
      } else {
        // If profile doesn't exist, create a default one
        const defaultProfile: Profile = {
          id: session.user.email,
          email: session.user.email,
          full_name: session.user.name || '',
          credits: 5, // Start with 5 free credits
          tier: 'basic'
        }
        setProfile(defaultProfile)
      }
    } catch (err) {
      console.error('Error loading user profile:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Connection error. Please check your internet connection.')
      } else {
        setError('Failed to load user profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateCredits = async (creditsToAdd: number) => {
    if (!profile) return false

    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credits: creditsToAdd,
          paymentIntentId: 'mock_payment_' + Date.now() // Mock payment ID
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setProfile(prev => prev ? { ...prev, credits: result.newCredits } : null)
        return true
      } else {
        setError('Failed to update credits')
        return false
      }
    } catch (err) {
      console.error('Error updating credits:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Connection error. Please check your internet connection.')
      } else {
        setError('Failed to update credits')
      }
      return false
    }
  }

  const refreshProfile = () => {
    loadUserProfile()
  }

  return {
    profile,
    loading,
    error,
    updateCredits,
    refreshProfile,
    setProfile
  }
}