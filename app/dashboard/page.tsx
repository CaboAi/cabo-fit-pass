'use client'

import { useEffect, useState } from 'react'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-glow">
              <Activity className="w-16 h-16 text-primary opacity-75" />
            </div>
            <Activity className="w-16 h-16 text-primary relative animate-fitness-bounce" />
          </div>
          <p className="mt-4 text-text-secondary font-heading text-heading-lg animate-fade-in">Loading your fitness journey...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      {/* Navigation Header */}
      <NavigationHeader profile={profile} onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Top summary grid: Welcome + Credits (row 1), Peak Times + Leaderboard (row 2) */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Welcome Card */}
          <div className="col-span-12 lg:col-span-8">
            <div className="relative group animate-fade-in">
              <div className="absolute inset-0 gradient-fitness-primary rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity -z-10"></div>
              <div className="relative card-fitness-stats p-8 animate-slide-up z-10">
                <h2 className="font-heading text-display-md text-text-primary mb-2">
                  {`Welcome back${profile?.name ? `, ${profile.name}` : ''}!`} 💪
                </h2>
                <p className="text-text-secondary mb-6 text-body-lg">
                  Your fitness journey continues. Book your next class and keep pushing your limits.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="card-fitness p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <TrendingUp className="w-6 h-6 text-success mb-2" />
                    <p className="text-display-sm font-heading text-text-primary">87%</p>
                    <p className="text-caption-md text-text-tertiary">Goal Progress</p>
                  </div>
                  <div className="card-fitness p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                    <Calendar className="w-6 h-6 text-secondary mb-2" />
                    <p className="text-display-sm font-heading text-text-primary">3</p>
                    <p className="text-caption-md text-text-tertiary">This Week</p>
                  </div>
                  <div className="card-fitness p-4 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                    <Award className="w-6 h-6 text-warning mb-2" />
                    <p className="text-display-sm font-heading text-text-primary">15</p>
                    <p className="text-caption-md text-text-tertiary">Achievements</p>
                  </div>
                </div>
              </div>
        </div>
      </div>

          {/* Credit Balance (top-right) */}
          <div className="col-span-12 lg:col-span-4 relative group animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 gradient-fitness-secondary rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity -z-10"></div>
            <div className="relative h-full z-10">
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

          {/* Peak Times Chart (bottom-left) */}
          <div className="col-span-12 lg:col-span-8 relative group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 gradient-fitness-accent rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity -z-10"></div>
              <div className="relative card-fitness-stats p-6 animate-slide-up z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-heading text-heading-lg text-text-primary">Peak Booking Times</h3>
                  </div>
                  <span className="text-caption-md text-text-tertiary">Last 7 days</span>
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
                        className="w-8 rounded-xl gradient-fitness-primary border border-primary/20 shadow-fitness-sm hover:shadow-fitness-glow-primary transition-shadow"
                        style={{ height: `${Math.max(10, v)}%` }}
                        title={`${d}: ${v}`}
                      />
                      <span className="text-caption-sm text-text-tertiary">{d}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-body-sm text-text-secondary">
                  Highest demand around <span className="text-text-primary font-semibold">Sat 6–8pm</span>. Consider booking early.
                </p>
              </div>
            </div>

          {/* Leaderboard (bottom-right) */}
          <div className="col-span-12 lg:col-span-4 relative group animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-warning to-accent-orange rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity -z-10"></div>
              <div className="relative card-fitness-stats p-6 animate-slide-up z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-warning" />
                  <h3 className="font-heading text-heading-lg text-text-primary">Weekly Leaderboard</h3>
                </div>
                <ol className="space-y-3">
                  {[
                    { name: 'Alex M.', classes: 6 },
                    { name: 'Jordan R.', classes: 5 },
                    { name: 'You', classes: 3 }
                  ].map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between card-fitness px-4 py-3 hover:shadow-fitness-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-caption-lg text-text-primary font-bold">
                          {i + 1}
                        </span>
                        <span className="text-text-primary font-medium text-body-md">{p.name}</span>
                      </div>
                      <span className="text-text-secondary text-caption-lg">{p.classes} classes</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-body-sm text-text-secondary">Keep booking to climb the board!</p>
              </div>
            </div>
          </div>

        {/* Quick Navigation removed to reduce redundancy; use header nav */}

        {/* Search and Filter Bar */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-fitness p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search classes, studios, or instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-fitness-search focus-fitness"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedFilter === filter
                        ? 'btn-fitness-primary'
                        : 'btn-fitness-ghost border border-border hover:border-primary/40'
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
            <h2 className="font-heading text-display-sm text-text-primary">
              Available Classes
            </h2>
            <p className="text-text-secondary text-body-md">
              {filteredClasses.length} classes available
            </p>
          </div>
          
          {filteredClasses.length === 0 ? (
            <div className="card-fitness p-12 text-center animate-fade-in">
              <Calendar className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="font-heading text-heading-xl text-text-primary mb-2">No classes found</h3>
              <p className="text-text-secondary text-body-md">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem, index) => (
                <div 
                  key={classItem.id} 
                  className="animate-fade-in hover:scale-105 transition-all duration-300" 
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
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