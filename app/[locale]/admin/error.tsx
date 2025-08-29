'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Admin Panel Error</CardTitle>
              <CardDescription className="mt-1">
                We encountered an error while loading the admin panel
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
              <p className="text-sm font-semibold text-gray-700 mb-1">Error Details:</p>
              <p className="text-sm font-mono text-gray-600">
                {error.message || 'An unexpected error occurred'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={() => reset()}
              variant="default"
              className="flex-1"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}