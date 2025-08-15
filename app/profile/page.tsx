'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavigationHeader } from '@/components/layout/navigation-header'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Settings,
  Bell,
  Shield,
  Heart,
  Star,
  Clock,
  Award,
  TrendingUp,
  Activity,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  Gift,
  History,
  X
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name?: string
  phone?: string
  location?: string
  joinDate: string
  credits: number
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  totalClassesBooked: number
  favoriteStudios: string[]
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    reminders: boolean
    newsletter: boolean
  }
}

interface BookingHistory {
  id: string
  className: string
  studioName: string
  date: string
  time: string
  credits: number
  status: 'completed' | 'upcoming' | 'cancelled'
  instructor: string
}

interface CreditTransaction {
  id: string
  type: 'purchase' | 'spent' | 'bonus'
  amount: number
  description: string
  date: string
  remaining: number
}

// Mock data
const MOCK_PROFILE: UserProfile = {
  id: '1',
  email: 'fitness.enthusiast@example.com',
  name: 'Maria Rodriguez',
  phone: '+52 624 123 4567',
  location: 'Los Cabos, BCS',
  joinDate: '2024-01-15',
  credits: 42,
  tier: 'Gold',
  totalClassesBooked: 28,
  favoriteStudios: ['Cabo Wellness Studio', 'Serenity Spa & Fitness', 'Beachside Yoga Retreat'],
  preferences: {
    notifications: true,
    emailUpdates: true,
    reminders: true,
    newsletter: false
  }
}

const MOCK_BOOKING_HISTORY: BookingHistory[] = [
  {
    id: '1',
    className: 'Sunrise Beach Yoga',
    studioName: 'Beachside Yoga Retreat',
    date: '2024-01-10',
    time: '07:00 AM',
    credits: 3,
    status: 'upcoming',
    instructor: 'Elena Martinez'
  },
  {
    id: '2',
    className: 'HIIT Bootcamp',
    studioName: 'Iron Paradise Gym',
    date: '2024-01-08',
    time: '06:30 PM',
    credits: 4,
    status: 'completed',
    instructor: 'Carlos Mendez'
  },
  {
    id: '3',
    className: 'Pilates Flow',
    studioName: 'Cabo Wellness Studio',
    date: '2024-01-05',
    time: '09:00 AM',
    credits: 3,
    status: 'completed',
    instructor: 'Sofia Chen'
  },
  {
    id: '4',
    className: 'Aqua Fitness',
    studioName: 'Serenity Spa & Fitness',
    date: '2024-01-03',
    time: '10:00 AM',
    credits: 4,
    status: 'cancelled',
    instructor: 'Ana Lopez'
  }
]

const MOCK_CREDIT_HISTORY: CreditTransaction[] = [
  {
    id: '1',
    type: 'purchase',
    amount: 25,
    description: 'Premium Package + 8 Bonus Credits',
    date: '2024-01-09',
    remaining: 42
  },
  {
    id: '2',
    type: 'spent',
    amount: -4,
    description: 'HIIT Bootcamp - Iron Paradise Gym',
    date: '2024-01-08',
    remaining: 21
  },
  {
    id: '3',
    type: 'bonus',
    amount: 5,
    description: 'Gold Tier Monthly Bonus',
    date: '2024-01-01',
    remaining: 25
  },
  {
    id: '4',
    type: 'spent',
    amount: -3,
    description: 'Pilates Flow - Cabo Wellness Studio',
    date: '2024-01-05',
    remaining: 20
  }
]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([])
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'credits' | 'settings'>('overview')
  const [showCreditDetails, setShowCreditDetails] = useState(false)
  const [navigationProfile, setNavigationProfile] = useState<{ email: string; credits: number; name?: string } | null>(null)

  useEffect(() => {
    // Check for demo session
    const demoSession = localStorage.getItem('demo-session')
    const demoUser = localStorage.getItem('demo-user')
    
    if (!demoSession || !demoUser) {
      router.push('/auth/signin')
      return
    }

    // Load profile data (demo)
    setProfile(MOCK_PROFILE)
    setBookingHistory(MOCK_BOOKING_HISTORY)
    setCreditHistory(MOCK_CREDIT_HISTORY)
    
    if (demoUser) {
      const user = JSON.parse(demoUser)
      setNavigationProfile(user)
    }
  }, [router])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
      case 'Silver': return 'text-slate-300 bg-slate-500/10 border-slate-500/20'
      case 'Gold': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'Platinum': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10'
      case 'upcoming': return 'text-blue-400 bg-blue-500/10'
      case 'cancelled': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <CreditCard className="w-4 h-4 text-green-400" />
      case 'spent': return <Activity className="w-4 h-4 text-red-400" />
      case 'bonus': return <Gift className="w-4 h-4 text-yellow-400" />
      default: return <History className="w-4 h-4 text-gray-400" />
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <User className="w-16 h-16 text-purple-400 opacity-75" />
            </div>
            <User className="w-16 h-16 text-purple-500 relative" />
          </div>
          <p className="mt-4 text-purple-200 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const handleSignOut = () => {
    localStorage.removeItem('demo-session')
    localStorage.removeItem('demo-user')
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      <NavigationHeader profile={navigationProfile || undefined} onSignOut={handleSignOut} />
      {/* Header */}
      <div className="relative bg-surface/95 backdrop-blur-xl border-b border-border shadow-fitness-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 -z-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-3 text-text-secondary hover:text-text-primary transition-colors rounded-2xl hover:bg-surface-tertiary"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-fitness-primary rounded-full blur-xl opacity-75 -z-10"></div>
                <div className="relative gradient-fitness-primary text-primary-foreground p-4 rounded-2xl z-10">
                  <User className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h1 className="font-heading text-display-lg gradient-fitness-text">
                  My Profile
                </h1>
                <p className="text-text-secondary text-body-lg">Manage your account and preferences</p>
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <div className="relative group">
            <div className="absolute inset-0 gradient-fitness-primary rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity -z-10"></div>
            <Card className="relative card-fitness-elevated bg-surface overflow-hidden z-10">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 gradient-fitness-primary rounded-full blur opacity-75 -z-10"></div>
                      <div className="relative w-24 h-24 gradient-fitness-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold z-10">
                        {profile.name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="font-heading text-display-sm text-text-primary">{profile.name || 'Fitness Enthusiast'}</h2>
                        <Badge className={`badge-fitness-primary ${getTierColor(profile.tier)}`}>
                          {profile.tier} Member
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Mail className="w-4 h-4" />
                          <span>{profile.email}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Phone className="w-4 h-4" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.location && (
                          <div className="flex items-center gap-2 text-text-secondary">
                            <MapPin className="w-4 h-4" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Calendar className="w-4 h-4" />
                          <span>Member since {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="card-fitness-stats p-6">
                      <p className="text-display-sm font-bold text-text-primary">{profile.credits}</p>
                      <p className="text-caption-sm text-text-secondary">Active Credits</p>
                    </div>
                    <div className="card-fitness-stats p-6">
                      <p className="text-display-sm font-bold text-text-primary">{profile.totalClassesBooked}</p>
                      <p className="text-caption-sm text-text-secondary">Classes Booked</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-2 border border-white/10 inline-flex">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'credits', label: 'Credits', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'bookings' | 'credits' | 'settings')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-purple-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Stats */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Fitness Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">78%</div>
                    <div className="text-sm text-purple-300">Monthly Goal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">5</div>
                    <div className="text-sm text-purple-300">This Week</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Yoga</span>
                    <span className="text-white">12 classes</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">HIIT</span>
                    <span className="text-white">8 classes</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-400 to-red-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Pilates</span>
                    <span className="text-white">6 classes</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Studios */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Favorite Studios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.favoriteStudios.map((studio, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-lg">
                        <Activity className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{studio}</p>
                        <p className="text-xs text-purple-300">⭐ 4.8 &bull; Los Cabos</p>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-pink-400 fill-current" />
                  </div>
                ))}
                <button className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-all text-center">
                  + Add More Studios
                </button>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Gold Member</h3>
                        <p className="text-xs text-yellow-300">Tier Upgrade</p>
                      </div>
                    </div>
                    <p className="text-sm text-yellow-200">Congratulations on reaching Gold status!</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Activity className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">25 Classes</h3>
                        <p className="text-xs text-purple-300">Milestone Reached</p>
                      </div>
                    </div>
                    <p className="text-sm text-purple-200">You&apos;ve completed 25 fitness classes!</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Weekly Goal</h3>
                        <p className="text-xs text-green-300">Consistency</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-200">3 weeks in a row hitting your goal!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Booking History
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Your recent and upcoming fitness classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold mb-1">{booking.className}</h3>
                            <div className="flex items-center gap-4 text-sm text-purple-300">
                              <span>{booking.studioName}</span>
                              <span>•</span>
                              <span>{booking.instructor}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs text-purple-300">
                                {new Date(booking.date).toLocaleDateString()} at {booking.time}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-purple-300">
                            {booking.credits} credits
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Credit Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent mb-2">
                    {profile.credits}
                  </div>
                  <CardTitle className="text-white">Available Credits</CardTitle>
                </CardHeader>
              </Card>
              
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {creditHistory.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0)}
                  </div>
                  <CardTitle className="text-white">Total Purchased</CardTitle>
                  <CardDescription className="text-purple-300">Lifetime credits bought</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {Math.abs(creditHistory.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.amount, 0))}
                  </div>
                  <CardTitle className="text-white">Credits Used</CardTitle>
                  <CardDescription className="text-purple-300">Classes booked</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Credit History */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-400" />
                    Credit History
                  </div>
                  <button
                    onClick={() => setShowCreditDetails(!showCreditDetails)}
                    className="p-2 text-purple-400 hover:text-white transition-colors"
                  >
                    {showCreditDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditHistory.map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white/10 rounded-lg">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="text-white font-medium mb-1">{transaction.description}</h3>
                            <div className="text-xs text-purple-300">
                              {new Date(transaction.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </div>
                          {showCreditDetails && (
                            <div className="text-xs text-purple-300">
                              Balance: {transaction.remaining}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Settings */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-purple-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-300 block mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-300 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-300 block mb-1">Location</label>
                    <input
                      type="text"
                      value={profile.location || ''}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                      placeholder="Enter your location"
                    />
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:scale-[1.02] transition-transform">
                  Save Changes
                </button>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-400" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries({
                  notifications: 'Push Notifications',
                  emailUpdates: 'Email Updates',
                  reminders: 'Class Reminders',
                  newsletter: 'Newsletter Subscription'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{label}</p>
                      <p className="text-xs text-purple-300">
                        {key === 'notifications' && 'Receive push notifications for bookings'}
                        {key === 'emailUpdates' && 'Get updates about new classes and features'}
                        {key === 'reminders' && 'Reminder notifications before your classes'}
                        {key === 'newsletter' && 'Monthly fitness tips and studio news'}
                      </p>
                    </div>
                    <button
                      onClick={() => setProfile(prev => prev ? {
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          [key]: !prev.preferences[key as keyof typeof prev.preferences]
                        }
                      } : null)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        profile.preferences[key as keyof typeof profile.preferences]
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                          : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        profile.preferences[key as keyof typeof profile.preferences]
                          ? 'translate-x-6'
                          : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-purple-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Change Password</span>
                    </div>
                    <p className="text-xs text-purple-300">Update your account password</p>
                  </button>

                  <button className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-purple-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Two-Factor Auth</span>
                    </div>
                    <p className="text-xs text-purple-300">Add extra security to your account</p>
                  </button>

                  <button className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-purple-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <Eye className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Privacy Settings</span>
                    </div>
                    <p className="text-xs text-purple-300">Control your data and privacy</p>
                  </button>

                  <button className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left hover:border-red-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Delete Account</span>
                    </div>
                    <p className="text-xs text-red-300">Permanently delete your account</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}