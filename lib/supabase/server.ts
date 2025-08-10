import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper function to get authenticated user on server side
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

// Helper function to get user session on server side
export async function getCurrentSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting current session:', error)
    return null
  }
  
  return session
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// Helper function to get user profile with credits
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }
  
  return profile
}

// Helper function to update user credits
export async function updateUserCredits(userId: string, creditsToAdd: number) {
  const supabase = createClient()
  
  // Get current profile
  const currentProfile = await getUserProfile(userId)
  if (!currentProfile) {
    throw new Error('User profile not found')
  }
  
  const newCredits = currentProfile.credits + creditsToAdd
  
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({ 
      credits: newCredits, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating user credits:', error)
    throw error
  }
  
  return updatedProfile
}
