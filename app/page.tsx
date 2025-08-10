'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
          Cabo Fit Pass
        </h1>
        <p className="text-xl text-gray-600">
          Premium Fitness Marketplace in Los Cabos
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {session ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Welcome back!
              </h2>
              <p className="text-gray-600">
                Logged in as: {session.user?.email}
              </p>
              <Link href="/dashboard">
                <Button className="w-full mb-2">
                  View Classes 
                </Button>
              </Link>
              <Button onClick={() => signOut()} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Ready to Get Fit?
              </h2>
              <p className="text-gray-600">
                Book premium fitness classes across Los Cabos with our credit system
              </p>
              <Link href="/auth/signin">
                <Button className="w-full">
                  Sign In to Book Classes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
