'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditDisplay } from '@/components/business/credit-display'
import { PaymentModal } from '@/components/business/payment-modal'
import { LoadingSpinner } from '@/components/layout/loading-spinner'
import { EmptyState } from '@/components/layout/empty-state'
import { ClassCard } from '@/components/business/class-card'
import { useToast } from '@/hooks/use-toast'
import { ClassItem } from '@/types'

interface Profile {
  id: string
  email: string
  name?: string
  credits: number
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null)
  const { showBookingSuccess, showBookingError, showPaymentSuccess } = useToast()

  useEffect(() => {
    const demoSession = localStorage.getItem('demo-session')
    const demoUser = localStorage.getItem('demo-user')
    
    if (!demoSession || !demoUser) {
      router.push('/auth/signin')
      return
    }
    
    const user = JSON.parse(demoUser)
    setProfile(user)
    loadClasses()
  }, [router])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      
      if (data.success) {
        setClasses(data.data.classes)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookClass = async (classItem: ClassItem) => {
    if (!profile || profile.credits < classItem.credit_cost) {
      showBookingError('Insufficient credits')
      return
    }

    setBookingInProgress(classItem.id)
    
    // Simulate booking process
    setTimeout(() => {
      const newCredits = profile.credits - classItem.credit_cost
      setProfile((prev: Profile | null) => prev ? { ...prev, credits: newCredits } : null)
      
      // Update class booking count
      setClasses((prev: ClassItem[]) => prev.map(cls => 
        cls.id === classItem.id 
          ? { ...cls, current_bookings: (cls.current_bookings || 0) + 1 }
          : cls
      ))
      
      setBookingInProgress(null)
      showBookingSuccess(classItem.name, newCredits)
    }, 1000)
  }

  const handlePurchaseComplete = async (creditsAdded: number) => {
    setProfile((prev: Profile | null) => prev ? { ...prev, credits: prev.credits + creditsAdded } : null)
    setShowPaymentModal(false)
    showPaymentSuccess(creditsAdded)
  }

  const handleSignOut = () => {
    localStorage.removeItem('demo-session')
    localStorage.removeItem('demo-user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Cabo Fit Pass</h1>
            <div className="flex items-center space-x-4">
              <CreditDisplay 
                currentCredits={profile.credits}
                onPurchaseCredits={() => setShowPaymentModal(true)}
                onCreditsUpdate={handlePurchaseComplete}
              />
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.name || 'Fitness Enthusiast'}!
          </h2>
          <p className="text-gray-600">
            Book your next fitness class and stay on track with your goals.
          </p>
        </div>

        {classes.length === 0 ? (
          <EmptyState 
            title="No classes available"
            description="Check back later for new fitness classes."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                userCredits={profile.credits}
                onBook={handleBookClass}
                isBooking={bookingInProgress === classItem.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPurchaseComplete={handlePurchaseComplete}
          currentCredits={profile.credits}
        />
      )}
    </div>
  )
}