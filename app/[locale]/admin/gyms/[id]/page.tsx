'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Settings, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Gym {
  id: string
  name: string
  location: string
  email?: string
  phone?: string
  description?: string
  stripe_connect_id?: string
  created_at: string
}

export default function GymDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSettingUpPayouts, setIsSettingUpPayouts] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchGym = async () => {
      try {
        const response = await fetch(`/api/admin/gyms/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setGym(data.data)
        }
      } catch (error) {
        console.error('Error fetching gym:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchGym()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
              <div className="h-8 bg-gray-100 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Gym Not Found</CardTitle>
            <CardDescription>
              The gym you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/en/admin/gyms">
                Back to Gyms List
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleFinishPayoutSetup = async () => {
    if (!gym) return
    
    setIsSettingUpPayouts(true)
    try {
      const response = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gymId: gym.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start payout setup')
      }

      const data = await response.json()
      console.log('Onboarding response:', data)
      
      // Check for the correct property name
      const onboardingUrl = data.accountLinkUrl || data.url
      
      if (onboardingUrl) {
        // Redirect to Stripe Connect onboarding
        window.location.href = onboardingUrl
      } else {
        throw new Error('No onboarding URL received')
      }
    } catch (error) {
      console.error('Error starting payout setup:', error)
      showError(`Failed to start payout setup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSettingUpPayouts(false)
    }
  }

  const handleDeleteGym = async () => {
    if (!gym) return
    
    try {
      console.log('Deleting gym:', gym.id)
      
      const response = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete gym')
      }

      const result = await response.json()
      console.log('Delete result:', result)

      // Redirect back to gyms list
      router.push('/en/admin/gyms')
    } catch (error) {
      console.error('Error deleting gym:', error)
      showError(`Failed to delete gym: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="../">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{gym.name}</h1>
            <p className="text-gray-600 mt-1">Gym management and configuration</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gym Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Gym Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{gym.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{gym.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{gym.email || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{gym.phone || 'Not specified'}</p>
                </div>
              </div>
              {gym.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{gym.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stripe Connect Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Connect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={gym.stripe_connect_id ? "default" : "outline"}>
                    {gym.stripe_connect_id ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                
                {!gym.stripe_connect_id && (
                  <Button 
                    className="w-full" 
                    onClick={handleFinishPayoutSetup}
                    disabled={isSettingUpPayouts}
                  >
                    {isSettingUpPayouts ? (
                      <>Setting up...</>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Finish Payouts Setup
                      </>
                    )}
                  </Button>
                )}
                
                {gym.stripe_connect_id && (
                  <div className="text-sm text-gray-600">
                    Connected on: {new Date(gym.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gym Management Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Gym Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => router.push(`/en/admin/gyms/${gym.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Gym
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Gym
                </Button>
                
                {/* Confirmation Dialog */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Delete Gym
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Are you sure you want to delete "{gym.name}"? This action cannot be undone.
                      </p>
                      <div className="flex gap-3 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="min-w-[44px] min-h-[44px]"
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            handleDeleteGym()
                          }}
                          className="min-w-[44px] min-h-[44px]"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}