'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CreditDisplay from '@/components/CreditDisplay'

// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===')
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has Supabase Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('========================')

const mockClasses = [
  {
    id: '1',
    title: 'Morning Yoga',
    instructor: 'Maria Lopez',
    difficulty: 'Beginner',
    capacity: 20,
    price: 15
  },
  {
    id: '2',
    title: 'CrossFit WOD',
    instructor: 'Carlos Martinez',
    difficulty: 'Advanced',
    capacity: 15,
    price: 25
  },
  {
    id: '3',
    title: 'Swimming Lessons',
    instructor: 'Ana Rodriguez',
    difficulty: 'Intermediate',
    capacity: 10,
    price: 20
  }
]

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [credits, setCredits] = useState(5)
  const [showCreditModal, setShowCreditModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const handleBookClass = (classItem: any) => {
    if (credits < 1) {
      setShowCreditModal(true)
      return
    }

    setCredits(prev => prev - 1)
    alert(`Successfully booked! Credits remaining: ${credits - 1}`)
  }

  const handleCreditPurchase = () => {
    setCredits(prev => prev + 10)
    setShowCreditModal(false)
    alert('Successfully purchased 10 credits!')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
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
            currentCredits={credits}
            onPurchaseCredits={handleCreditPurchase}
            onCreditsUpdate={setCredits}
          />
        </div>

        <h3 className="text-2xl font-bold mb-6">Available Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockClasses.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-lg p-6 border shadow-sm">
              <h4 className="text-xl font-semibold mb-2">{classItem.title}</h4>
              <p className="text-gray-600 mb-1">Instructor: {classItem.instructor}</p>
              <p className="text-gray-600 mb-1">Difficulty: {classItem.difficulty}</p>
              <p className="text-gray-600 mb-1">Capacity: {classItem.capacity}</p>
              <p className="text-green-600 font-semibold mb-4">{classItem.price} MXN</p>
              <button
                onClick={() => handleBookClass(classItem)}
                disabled={credits < 1}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  credits < 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {credits < 1 ? 'Need More Credits' : 'Book Class (1 credit)'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Purchase Credits</h3>
            <button
              onClick={handleCreditPurchase}
              className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 mb-3"
            >
              Buy 10 Credits - MXN
            </button>
            <button
              onClick={() => setShowCreditModal(false)}
              className="w-full p-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}