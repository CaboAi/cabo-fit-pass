'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Calendar, 
  Users, 
  TrendingUp, 
  Plus,
  Search,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Settings,
  BarChart3,
  Edit3,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavigationHeader } from '@/components/layout/navigation-header'
import { ClassManagementModal } from '@/components/studio/class-management-modal'
import { AnalyticsDashboard } from '@/components/studio/analytics-dashboard'
import { useToast } from '@/hooks/use-toast'
import { ClassItem, Studio, UserProfile } from '@/types'
// React and ChevronDownIcon imports removed - not needed

// Calendar24 component moved to separate file

// Mock studio owner profile
const MOCK_STUDIO_OWNER: UserProfile = {
  id: 'studio-owner-1',
  email: 'owner@cabofitness.com',
  full_name: 'Maria Rodriguez',
  user_type: 'studio_owner',
  credits: 0,
  subscription_tier: 'premium'
}

// Mock studio data
const MOCK_STUDIO: Studio = {
  id: 'studio-1',
  name: 'Cabo Fitness Studio',
  owner_id: 'studio-owner-1',
  description: 'Premium fitness studio in the heart of Cabo San Lucas with ocean views',
  location: {
    lat: 22.8905,
    lng: -109.9167,
    address: 'Blvd. Marina 15, Centro',
    neighborhood: 'Marina District'
  },
  amenities: ['Ocean View', 'Premium Equipment', 'Changing Rooms', 'Parking', 'AC', 'Sound System'],
  rating: 4.9,
  created_at: '2024-01-15T00:00:00Z'
}

// Mock classes data with additional studio management fields
const MOCK_CLASSES: (ClassItem & { revenue: number; bookings: number })[] = [
  {
    id: 'class-1',
    studio_id: 'studio-1',
    name: 'Morning Yoga Flow',
    instructor_id: 'instructor-1',
    class_type: 'Yoga',
    description: 'Start your day with energizing yoga flow sessions',
    start_time: '2024-01-16T07:00:00Z',
    duration: 60,
    max_capacity: 15,
    credit_cost: 2,
    difficulty_level: 'beginner',
    created_at: '2024-01-10T00:00:00Z',
    current_bookings: 12,
    studio: MOCK_STUDIO,
    revenue: 720,
    bookings: 28
  },
  {
    id: 'class-2',
    studio_id: 'studio-1',
    name: 'HIIT Power Hour',
    instructor_id: 'instructor-2',
    class_type: 'HIIT',
    description: 'High-intensity interval training for maximum results',
    start_time: '2024-01-16T18:00:00Z',
    duration: 45,
    max_capacity: 12,
    credit_cost: 3,
    difficulty_level: 'intermediate',
    created_at: '2024-01-10T00:00:00Z',
    current_bookings: 10,
    studio: MOCK_STUDIO,
    revenue: 1080,
    bookings: 24
  },
  {
    id: 'class-3',
    studio_id: 'studio-1',
    name: 'Sunset Pilates',
    instructor_id: 'instructor-3',
    class_type: 'Pilates',
    description: 'Strengthen your core with ocean sunset views',
    start_time: '2024-01-16T19:00:00Z',
    duration: 50,
    max_capacity: 10,
    credit_cost: 2,
    difficulty_level: 'beginner',
    created_at: '2024-01-10T00:00:00Z',
    current_bookings: 8,
    studio: MOCK_STUDIO,
    revenue: 560,
    bookings: 18
  }
]

export default function StudioManagementPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [classes, setClasses] = useState<(ClassItem & { revenue: number; bookings: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'analytics' | 'settings'>('overview')
  const [showClassModal, setShowClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const { showSuccess } = useToast()

  useEffect(() => {
    // Ensure we're on the client side before accessing localStorage
    if (typeof window === 'undefined') return
    
    // For demo, we'll simulate checking if user is a studio owner
    const demoSession = localStorage.getItem('demo-session')
    
    if (!demoSession) {
      router.push('/auth/signin')
      return
    }

    // Load studio owner data
    setProfile(MOCK_STUDIO_OWNER)
    setStudio(MOCK_STUDIO)
    setClasses(MOCK_CLASSES)
    setLoading(false)
  }, [router])

  const handleSignOut = () => {
    localStorage.removeItem('demo-session')
    localStorage.removeItem('demo-user')
    router.push('/auth/signin')
  }

  const handleCreateClass = () => {
    setEditingClass(null)
    setShowClassModal(true)
  }

  const handleEditClass = (classItem: ClassItem) => {
    setEditingClass(classItem)
    setShowClassModal(true)
  }

  const handleDeleteClass = async (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      // Simulate API call
      setTimeout(() => {
        setClasses(prev => prev.filter(c => c.id !== classId))
        showSuccess('Class deleted successfully')
      }, 500)
    }
  }

  const handleClassSave = (classData: Partial<ClassItem>) => {
    if (editingClass) {
      // Update existing class
      setClasses(prev => prev.map(c => 
        c.id === editingClass.id 
          ? { ...c, ...classData }
          : c
      ))
      showSuccess('Class updated successfully')
    } else {
      // Create new class
      const newClass = {
        id: `class-${Date.now()}`,
        studio_id: studio!.id,
        studio: studio!,
        revenue: 0,
        bookings: 0,
        current_bookings: 0,
        created_at: new Date().toISOString(),
        ...classData
      } as ClassItem & { revenue: number; bookings: number }
      
      setClasses(prev => [newClass, ...prev])
      showSuccess('Class created successfully')
    }
    setShowClassModal(false)
  }

  // Filter classes
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = searchQuery === '' || 
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.class_type.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || 
      classItem.class_type.toLowerCase() === selectedFilter.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  // Calculate stats
  const totalRevenue = classes.reduce((sum, c) => sum + c.revenue, 0)
  const totalBookings = classes.reduce((sum, c) => sum + c.bookings, 0)
  const avgRating = studio?.rating || 0
  const activeClasses = classes.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading studio dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      <NavigationHeader 
        profile={profile ? {
          email: profile.email,
          credits: profile.credits,
          name: profile.full_name
        } : undefined}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl blur-3xl -z-10"></div>
          <Card className="card-fitness-elevated bg-surface relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 -z-10"></div>
            <CardHeader className="relative pb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 gradient-fitness-primary rounded-2xl blur-xl opacity-75 -z-10"></div>
                    <div className="relative gradient-fitness-primary text-primary-foreground p-6 rounded-2xl z-10">
                      <Building2 className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h1 className="font-heading text-display-lg gradient-fitness-text mb-2">
                      {studio?.name}
                    </h1>
                    <p className="text-text-secondary text-body-lg mb-3">{studio?.description}</p>
                    <div className="flex items-center gap-4 text-body-md text-text-secondary">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{studio?.location.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-warning" />
                        <span>{studio?.rating} rating</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCreateClass}
                    className="btn-fitness-primary gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Class
                  </button>
                </div>
              </div>
            </CardHeader>

            {/* Stats Cards */}
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-0">
              <div className="card-fitness-stats p-6 text-center">
                <DollarSign className="w-8 h-8 text-success mx-auto mb-3" />
                <p className="text-display-sm font-bold text-text-primary">${totalRevenue.toLocaleString()}</p>
                <p className="text-caption-md text-text-secondary">Total Revenue</p>
              </div>
              <div className="card-fitness-stats p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-display-sm font-bold text-text-primary">{totalBookings}</p>
                <p className="text-caption-md text-text-secondary">Total Bookings</p>
              </div>
              <div className="card-fitness-stats p-6 text-center">
                <Calendar className="w-8 h-8 text-secondary mx-auto mb-3" />
                <p className="text-display-sm font-bold text-text-primary">{activeClasses}</p>
                <p className="text-caption-md text-text-secondary">Active Classes</p>
              </div>
              <div className="card-fitness-stats p-6 text-center">
                <Star className="w-8 h-8 text-warning mx-auto mb-3" />
                <p className="text-display-sm font-bold text-text-primary">{avgRating}</p>
                <p className="text-caption-md text-text-secondary">Avg Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="card-fitness p-2">
          <nav className="flex items-center gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'classes', label: 'Class Management', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'settings', label: 'Studio Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'classes' | 'analytics' | 'settings')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    isActive 
                      ? 'btn-fitness-primary' 
                      : 'btn-fitness-ghost'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="card-fitness-elevated bg-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-text-primary">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { action: 'New booking', class: 'Morning Yoga Flow', time: '2 minutes ago', type: 'booking' },
                  { action: 'Class created', class: 'Evening Meditation', time: '1 hour ago', type: 'create' },
                  { action: 'Booking cancelled', class: 'HIIT Power Hour', time: '3 hours ago', type: 'cancel' },
                  { action: 'Class updated', class: 'Sunset Pilates', time: '5 hours ago', type: 'update' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                    <div>
                      <p className="text-text-primary font-medium">{activity.action}</p>
                      <p className="text-text-secondary text-sm">{activity.class}</p>
                    </div>
                    <p className="text-text-tertiary text-xs">{activity.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Classes */}
            <Card className="card-fitness-elevated bg-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-text-primary">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Top Performing Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {classes
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 4)
                  .map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                      <div>
                        <p className="text-text-primary font-medium">{classItem.name}</p>
                        <p className="text-text-secondary text-sm">{classItem.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-success font-bold">${classItem.revenue}</p>
                        <p className="text-text-tertiary text-xs">revenue</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <Card className="card-fitness bg-surface p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-fitness-search focus-fitness"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'yoga', 'hiit', 'pilates', 'strength'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all capitalize ${
                        selectedFilter === filter
                          ? 'btn-fitness-primary'
                          : 'btn-fitness-ghost'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => (
                <Card key={classItem.id} className="card-fitness-elevated bg-surface group hover:shadow-fitness-glow-primary transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading text-heading-lg text-text-primary mb-2">{classItem.name}</h3>
                        <Badge className="badge-fitness-primary mb-3">{classItem.class_type}</Badge>
                        <p className="text-text-secondary text-sm line-clamp-2">{classItem.description}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClass(classItem)}
                          className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface-tertiary"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="p-2 text-text-secondary hover:text-error transition-colors rounded-lg hover:bg-surface-tertiary"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-text-tertiary">Duration</p>
                        <p className="text-text-primary font-medium">{classItem.duration} min</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">Capacity</p>
                        <p className="text-text-primary font-medium">{classItem.max_capacity} spots</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">Credits</p>
                        <p className="text-text-primary font-medium">{classItem.credit_cost} credits</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">Difficulty</p>
                        <p className="text-text-primary font-medium capitalize">{classItem.difficulty_level}</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Bookings</span>
                        <span className="text-text-primary font-medium">{classItem.current_bookings}/{classItem.max_capacity}</span>
                      </div>
                      <div className="w-full bg-surface-tertiary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((classItem.current_bookings || 0) / classItem.max_capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-success font-bold">${classItem.revenue}</p>
                        <p className="text-text-tertiary text-xs">Total Revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-primary font-medium">{classItem.bookings}</p>
                        <p className="text-text-tertiary text-xs">Total Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClasses.length === 0 && (
              <div className="card-fitness p-12 text-center">
                <Calendar className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <h3 className="font-heading text-heading-lg text-text-primary mb-2">No classes found</h3>
                <p className="text-text-secondary mb-6">Try adjusting your search or create a new class</p>
                <button
                  onClick={handleCreateClass}
                  className="btn-fitness-primary gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Class
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard classes={classes} />
        )}

        {activeTab === 'settings' && (
          <Card className="card-fitness-elevated bg-surface">
            <CardHeader>
              <CardTitle className="text-text-primary">Studio Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-8 text-text-secondary">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                  <h3 className="text-heading-lg text-text-primary mb-2">Studio Settings</h3>
                  <p>Manage your studio profile, amenities, and preferences</p>
                  <button className="btn-fitness-primary mt-4">
                    Configure Settings
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Class Management Modal */}
      <ClassManagementModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        onSave={handleClassSave}
        editingClass={editingClass}
        studio={studio!}
      />
    </div>
  )
}
