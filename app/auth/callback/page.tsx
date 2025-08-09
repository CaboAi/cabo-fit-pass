'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AuthCallback() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // Successful login - redirect to dashboard
      router.push('/dashboard')
    } else {
      // No session - redirect to sign in
      router.push('/auth/signin')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl mb-4">Completing sign in...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
      </div>
    </div>
  )
}
