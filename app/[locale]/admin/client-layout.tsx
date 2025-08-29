'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminNavigation from '@/components/admin/AdminNavigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminClientLayoutProps {
  children: React.ReactNode
  locale: string
}

export default function AdminClientLayout({ children, locale }: AdminClientLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const demoParam = searchParams.get('demo') === 'true'
    
    if (demoParam) {
      // Set up demo admin session
      const demoAdminData = {
        email: 'admin@cabofitpass.com',
        name: 'Demo Admin',
        role: 'admin'
      }
      localStorage.setItem('demo-admin-session', 'true')
      localStorage.setItem('demo-admin-user', JSON.stringify(demoAdminData))
      setIsDemoMode(true)
      setIsLoading(false)
      return
    }

    // Check for existing demo session
    const existingDemo = localStorage.getItem('demo-admin-session')
    if (existingDemo) {
      setIsDemoMode(true)
      setIsLoading(false)
      return
    }

    // If not demo mode, check authentication
    if (status === 'loading') {
      return // Still loading auth
    }

    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/admin`)
      return
    }

    // TODO: Add role check for real auth
    setIsLoading(false)
  }, [searchParams, status, router, locale])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">Loading admin...</div>
        </div>
      </div>
    )
  }

  const userEmail = isDemoMode 
    ? 'admin@cabofitpass.com' 
    : session?.user?.email || ''

  return (
    <div className="min-h-screen bg-gray-50">
      {isDemoMode && (
        <div className="bg-orange-100 border-b border-orange-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-orange-800">Demo Admin Mode</div>
                <div className="text-xs text-orange-600">Testing admin features without authentication</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                localStorage.removeItem('demo-admin-session')
                localStorage.removeItem('demo-admin-user')
                router.push('/en/dashboard?demo=true')
              }}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Back to User Demo
            </Button>
          </div>
        </div>
      )}
      
      <AdminNavigation 
        locale={locale} 
        userEmail={userEmail} 
      />
      
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}