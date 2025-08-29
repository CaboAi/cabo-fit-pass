'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Cookie, X, Settings } from 'lucide-react'
import Link from 'next/link'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const consentData = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consentData))
    setShowBanner(false)
    
    // Initialize analytics if accepted
    if (consentData.analytics) {
      console.log('Analytics cookies accepted - would initialize tracking here')
    }
  }

  const acceptSelected = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consentData))
    setShowBanner(false)
    
    // Initialize services based on preferences
    if (preferences.analytics) {
      console.log('Analytics cookies accepted - would initialize tracking here')
    }
    if (preferences.marketing) {
      console.log('Marketing cookies accepted - would initialize marketing tools here')
    }
  }

  const rejectNonEssential = () => {
    const consentData = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consentData))
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto shadow-lg border-2 border-blue-200 bg-white">
        <CardContent className="p-6">
          {!showSettings ? (
            // Simple consent banner
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">We use cookies</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We use cookies to enhance your experience, analyze site usage, and personalize content. 
                    Essential cookies are required for the site to function.{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Learn more in our Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rejectNonEssential}
                >
                  Reject Non-Essential
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            // Detailed settings panel
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Cookie Preferences</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Essential Cookies</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Required for basic site functionality, authentication, and security.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Always Active
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Help us understand how visitors use our site to improve performance and user experience.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Used to personalize ads and marketing communications based on your interests.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rejectNonEssential}
                  className="flex-1 sm:flex-none"
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={acceptSelected}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}