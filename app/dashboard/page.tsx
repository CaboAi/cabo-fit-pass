'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditDisplay } from '@/components/business/credit-display'
import { PaymentModal } from '@/components/business/payment-modal'
import { ClassCard } from '@/components/business/class-card'
import { NavigationHeader } from '@/components/layout/navigation-header'
import { useToast } from '@/hooks/use-toast'
import { ClassItem } from '@/types'
import { Activity, TrendingUp, Award, Calendar, Search, BarChart3, Trophy } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ email: string; credits: number; name?: string } | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
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
      setProfile(prev => {
        if (!prev) return null
        return { ...prev, credits: newCredits }
      })
      
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
    if (!profile) return
    
    setProfile(prev => {
      if (!prev) return null
      return { ...prev, credits: prev.credits + creditsAdded }
    })
    showPaymentSuccess(creditsAdded)
    setShowPaymentModal(false)
  }



  const handleSignOut = () => {
    localStorage.removeItem('demo-session')
    localStorage.removeItem('demo-user')
    router.push('/')
  }

  // Filter classes based on search and filter
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cls.studio?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cls.class_type?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || 
                         cls.difficulty_level === selectedFilter ||
                         cls.class_type === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Activity className="w-16 h-16 text-purple-400 opacity-75" />
            </div>
            <Activity className="w-16 h-16 text-purple-500 relative" />
          </div>
          <p className="mt-4 text-purple-200 font-medium">Loading your fitness journey...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Header */}
      <NavigationHeader profile={profile} onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section with Stats */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="lg:col-span-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, Champion! 💪
                </h2>
                <p className="text-purple-200 mb-6">
                  Your fitness journey continues. Book your next class and keep pushing your limits.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                    <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-white">87%</p>
                    <p className="text-xs text-purple-200">Goal Progress</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                    <Calendar className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-white">3</p>
                    <p className="text-xs text-purple-200">This Week</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                    <Award className="w-6 h-6 text-yellow-400 mb-2" />
                    <p className="text-2xl font-bold text-white">15</p>
                    <p className="text-xs text-purple-200">Achievements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement & Insights */}
          <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Peak Times Chart (mock) */}
            <div className="xl:col-span-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-white">Peak Booking Times</h3>
                  </div>
                  <span className="text-xs text-purple-300">Last 7 days</span>
                </div>
                {/* Simple bar visualization */}
                <div className="grid grid-cols-7 items-end gap-3 h-40">
                  {[
                    { d: 'Mon', v: 35 },
                    { d: 'Tue', v: 55 },
                    { d: 'Wed', v: 70 },
                    { d: 'Thu', v: 45 },
                    { d: 'Fri', v: 85 },
                    { d: 'Sat', v: 95 },
                    { d: 'Sun', v: 60 }
                  ].map(({ d, v }) => (
                    <div key={d} className="flex flex-col items-center gap-2">
                      <div
                        className="w-8 rounded-xl bg-gradient-to-b from-pink-600 to-purple-600 border border-white/10"
                        style={{ height: `${Math.max(10, v)}%` }}
                        title={`${d}: ${v}`}
                      />
                      <span className="text-xs text-purple-300">{d}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-purple-200">
                  Highest demand around <span className="text-white font-medium">Sat 6–8pm</span>. Consider booking early.
                </p>
              </div>
            </div>

            {/* Leaderboard (mock) */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <h3 className="text-lg font-semibold text-white">Weekly Leaderboard</h3>
                </div>
                <ol className="space-y-3">
                  {[
                    { name: 'Alex M.', classes: 6 },
                    { name: 'Jordan R.', classes: 5 },
                    { name: 'You', classes: 3 }
                  ].map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm text-white font-semibold">
                          {i + 1}
                        </span>
                        <span className="text-white font-medium">{p.name}</span>
                      </div>
                      <span className="text-purple-200 text-sm">{p.classes} classes</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm text-purple-200">Keep booking to climb the board!</p>
              </div>
            </div>
          </div>

          {/* Enhanced Credit Display */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative h-full">
              <CreditDisplay
                currentCredits={profile.credits}
                onPurchaseCredits={() => setShowPaymentModal(true)}
                onCreditsUpdate={() => {}}
                profile={{
                  id: 'demo-user',
                  email: profile.email,
                  credits: profile.credits,
                  user_type: 'member',
                  subscription_tier: 'basic'
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Navigation removed to reduce redundancy; use header nav */}

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search classes, studios, or instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedFilter === filter
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-purple-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Available Classes
            </h2>
            <p className="text-purple-200">
              {filteredClasses.length} classes available
            </p>
          </div>
          
          {filteredClasses.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
              <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No classes found</h3>
              <p className="text-purple-200">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className="transform hover:scale-105 transition-transform duration-300">
                  <ClassCard
                    classItem={classItem}
                    userCredits={profile.credits}
                    onBook={handleBookClass}
                    isBooking={bookingInProgress === classItem.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
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