'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CreditDisplay from '@/components/CreditDisplay'
import { useUserData } from '@/hooks/useUserData'
import { useClasses } from '@/hooks/useClasses'
import { PaymentModal } from '@/components/PaymentModal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ClassCard } from '@/components/ClassCard'
import { useToast } from '@/hooks/useToast'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { profile, loading: profileLoading, updateCredits, setProfile } = useUserData()
  const { classes, loading: classesLoading, bookClass, refreshClasses } = useClasses()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null)
  const { showBookingSuccess, showBookingError, showPaymentSuccess, showConnectionError } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const handleBookClass = async (classItem: { id: string; title: string }) => {
    if (!profile || !session?.user?.email) return
    
    if (profile.credits < 1) {
      setShowPaymentModal(true)
      return
    }

    setBookingInProgress(classItem.id)
    
    try {
      // Book the class (server-side validation and credit deduction)
      const bookingResult = await bookClass(classItem.id)
      
      if (bookingResult.success) {
        // Update local profile with new credit count from server
        if (bookingResult.remainingCredits !== undefined) {
          setProfile(prev => prev ? { ...prev, credits: bookingResult.remainingCredits } : null)
        }
        showBookingSuccess(classItem.title, bookingResult.remainingCredits || profile.credits - 1)
        refreshClasses() // Refresh to show updated booking counts
      } else {
        showBookingError(bookingResult.error || 'Failed to book class. Please try again.')
      }
    } catch (error) {
      console.error('Error booking class:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showConnectionError()
      } else {
        showBookingError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setBookingInProgress(null)
    }
  }

  const handlePurchaseComplete = async (creditsAdded: number) => {
    if (!profile) return
    
    // Update local profile state with new credits
    setProfile(prev => prev ? { ...prev, credits: prev.credits + creditsAdded } : null)
    showPaymentSuccess(creditsAdded)
    setShowPaymentModal(false)
  }

  if (status === 'loading' || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <LoadingSpinner size="lg" text="Loading your fitness dashboard..." />
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-orange-600">
            Cabo Fit Pass
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">
          Welcome, {session.user?.email?.split('@')[0]}!
        </h2>

        <div className="max-w-md mb-8">
          <CreditDisplay
            currentCredits={profile.credits}
            onPurchaseCredits={() => setShowPaymentModal(true)}
            onCreditsUpdate={(creditsToAdd) => updateCredits(creditsToAdd)}
          />
        </div>

        <h3 className="text-2xl font-bold mb-6">Available Classes</h3>
        
        {classesLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading available classes..." />
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            title="No Classes Available"
            description="There are no fitness classes scheduled at the moment. Check back later for new classes!"
            action={{
              label: "Refresh Classes",
              onClick: refreshClasses
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                userCredits={profile.credits}
                isBooking={bookingInProgress === classItem.id}
                onBook={() => handleBookClass(classItem)}
              />
            ))}
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPurchaseComplete={handlePurchaseComplete}
        currentCredits={profile.credits}
      />
    </div>
  )
}