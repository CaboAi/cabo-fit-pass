'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { UserProfile } from '@/types'

interface UseUserDataReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  updateCredits: (creditsToAdd: number) => Promise<boolean>
  setProfile: (profile: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => void
  refreshProfile: () => Promise<void>
}

export function useUserData(): UseUserDataReturn {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.email) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      if (data.success && data.data?.profile) {
        setProfile(data.data.profile)
      } else {
        throw new Error(data.error || 'Failed to load profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.email])

  const updateCredits = useCallback(async (creditsToAdd: number): Promise<boolean> => {
    if (!profile || !session?.user?.email) {
      return false
    }

    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: session.user.email,
          credits_to_add: creditsToAdd,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update credits')
      }

      const result = await response.json()
      if (result.success && result.data) {
        // Use the actual new_credits value from the API response
        setProfile(prev => prev ? { ...prev, credits: result.data.new_credits } : null)
        return true
      } else {
        throw new Error(result.error || 'Failed to update credits')
      }
    } catch (err) {
      console.error('Error updating credits:', err)
      return false
    }
  }, [profile, session?.user?.email])

  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'authenticated' && session?.user?.email) {
      fetchProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [status, session?.user?.email, fetchProfile])

  return {
    profile,
    loading,
    error,
    updateCredits,
    setProfile,
    refreshProfile,
  }
}
