'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  Filter, 
  Search, 
  ArrowLeft,
  Dumbbell,
  Award,
  Wifi,
  Car,
  Heart,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavigationHeader } from '@/components/layout/navigation-header'

// Use the Studio type from types/index.ts
interface Studio {
  id: string
  name: string
  owner_id?: string
  description?: string
  location: {
    lat: number
    lng: number
    address: string
    neighborhood: string
  }
  amenities: string[]
  rating: number
  created_at?: string
  // Additional properties for UI
  specialties?: string[]
  featured?: boolean
  verified?: boolean
  priceRange?: string
  openingHours?: { [key: string]: string }
  contact?: {
    phone: string
    email: string
    website?: string
  }
  images?: string[]
  reviewCount?: number
}

// Mock studio data for Los Cabos
const STUDIOS: Studio[] = [
  {
    id: '1',
    owner_id: 'owner-1',
    name: 'Cabo Wellness Studio',
    description: 'Premium wellness center offering yoga, pilates, and meditation classes with breathtaking ocean views. Our experienced instructors guide you through transformative fitness journeys.',
    location: {
      address: 'Blvd. Marina 15, Centro',
      neighborhood: 'Marina District',
      lat: 22.8905,
      lng: -109.9167
    },
    rating: 4.9,
    reviewCount: 127,
    amenities: ['Ocean View', 'Yoga Mats', 'Meditation Room', 'Changing Rooms', 'Parking', 'AC'],
    contact: {
      phone: '+52 624 105 1234',
      email: 'info@cabowellness.com',
      website: 'cabowellness.com'
    },
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    specialties: ['Yoga', 'Pilates', 'Meditation', 'Breathwork'],
    priceRange: '$$$',
    openingHours: {
      'Monday': '6:00 AM - 9:00 PM',
      'Tuesday': '6:00 AM - 9:00 PM',
      'Wednesday': '6:00 AM - 9:00 PM',
      'Thursday': '6:00 AM - 9:00 PM',
      'Friday': '6:00 AM - 9:00 PM',
      'Saturday': '7:00 AM - 8:00 PM',
      'Sunday': '7:00 AM - 7:00 PM'
    },
    featured: true,
    verified: true
  },
  {
    id: '2',
    owner_id: 'owner-2',
    name: 'Iron Paradise Gym',
    description: 'State-of-the-art fitness facility with professional-grade equipment, personal training, and group fitness classes. Perfect for serious fitness enthusiasts.',
    location: {
      address: 'Carr. Transpeninsular Km 4.5',
      neighborhood: 'San José del Cabo',
      lat: 23.0545,
      lng: -109.6970
    },
    rating: 4.7,
    reviewCount: 89,
    amenities: ['Free Weights', 'Cardio Equipment', 'Personal Training', 'Locker Rooms', 'Protein Bar', 'AC'],
    contact: {
      phone: '+52 624 142 5678',
      email: 'contact@ironparadisecabo.com'
    },
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    specialties: ['Weight Training', 'CrossFit', 'HIIT', 'Personal Training'],
    priceRange: '$$',
    openingHours: {
      'Monday': '5:00 AM - 10:00 PM',
      'Tuesday': '5:00 AM - 10:00 PM',
      'Wednesday': '5:00 AM - 10:00 PM',
      'Thursday': '5:00 AM - 10:00 PM',
      'Friday': '5:00 AM - 10:00 PM',
      'Saturday': '6:00 AM - 9:00 PM',
      'Sunday': '6:00 AM - 8:00 PM'
    },
    featured: false,
    verified: true
  },
  {
    id: '3',
    owner_id: 'owner-3',
    name: 'Serenity Spa & Fitness',
    description: 'Luxury spa and fitness center combining wellness, beauty, and fitness. Enjoy our pool, spa services, and boutique fitness classes in an exclusive setting.',
    location: {
      address: 'Paseo de los Cabos, Zona Hotelera',
      neighborhood: 'Hotel Zone',
      lat: 22.8889,
      lng: -109.9081
    },
    rating: 4.8,
    reviewCount: 156,
    amenities: ['Pool', 'Spa Services', 'Sauna', 'Steam Room', 'Juice Bar', 'Valet Parking'],
    contact: {
      phone: '+52 624 163 9012',
      email: 'reservations@serenitycabo.com',
      website: 'serenitycabo.com'
    },
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    specialties: ['Aqua Fitness', 'Spa Yoga', 'Barre', 'Wellness Retreats'],
    priceRange: '$$$$',
    openingHours: {
      'Monday': '6:00 AM - 9:00 PM',
      'Tuesday': '6:00 AM - 9:00 PM',
      'Wednesday': '6:00 AM - 9:00 PM',
      'Thursday': '6:00 AM - 9:00 PM',
      'Friday': '6:00 AM - 9:00 PM',
      'Saturday': '7:00 AM - 8:00 PM',
      'Sunday': '7:00 AM - 8:00 PM'
    },
    featured: true,
    verified: true
  },
  {
    id: '4',
    owner_id: 'owner-4',
    name: 'Desert Fitness Hub',
    description: 'Community-focused fitness center offering functional training, group classes, and outdoor workouts. Embrace the desert landscape while achieving your fitness goals.',
    location: {
      address: 'Ave. Lázaro Cárdenas 1789',
      neighborhood: 'Centro',
      lat: 23.0644,
      lng: -109.6953
    },
    rating: 4.5,
    reviewCount: 73,
    amenities: ['Outdoor Training Area', 'Functional Training', 'Group Classes', 'Smoothie Bar', 'Bike Parking'],
    contact: {
      phone: '+52 624 128 3456',
      email: 'hello@desertfitnesshub.com'
    },
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    specialties: ['Functional Training', 'Bootcamp', 'Outdoor Workouts', 'TRX'],
    priceRange: '$',
    openingHours: {
      'Monday': '5:30 AM - 9:00 PM',
      'Tuesday': '5:30 AM - 9:00 PM',
      'Wednesday': '5:30 AM - 9:00 PM',
      'Thursday': '5:30 AM - 9:00 PM',
      'Friday': '5:30 AM - 9:00 PM',
      'Saturday': '6:00 AM - 8:00 PM',
      'Sunday': '7:00 AM - 7:00 PM'
    },
    featured: false,
    verified: true
  },
  {
    id: '5',
    owner_id: 'owner-5',
    name: 'Beachside Yoga Retreat',
    description: 'Tranquil beachfront yoga studio offering sunrise and sunset sessions with the sound of waves as your soundtrack. Connect with nature and find inner peace.',
    location: {
      address: 'Playa El Médano, Beachfront',
      neighborhood: 'El Médano',
      lat: 22.8908,
      lng: -109.9125
    },
    rating: 4.9,
    reviewCount: 94,
    amenities: ['Beachfront Location', 'Sunrise Classes', 'Sunset Sessions', 'Yoga Props', 'Meditation Garden'],
    contact: {
      phone: '+52 624 157 7890',
      email: 'namaste@beachsideyoga.com',
      website: 'beachsideyoga.com'
    },
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    specialties: ['Beach Yoga', 'Sunrise Yoga', 'Meditation', 'Sound Healing'],
    priceRange: '$$',
    openingHours: {
      'Monday': '6:00 AM - 8:00 PM',
      'Tuesday': '6:00 AM - 8:00 PM',
      'Wednesday': '6:00 AM - 8:00 PM',
      'Thursday': '6:00 AM - 8:00 PM',
      'Friday': '6:00 AM - 8:00 PM',
      'Saturday': '6:00 AM - 8:00 PM',
      'Sunday': '6:00 AM - 8:00 PM'
    },
    featured: true,
    verified: true
  }
]

export default function StudioPage() {
  const router = useRouter()
  const studios = STUDIOS
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>(STUDIOS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [profile, setProfile] = useState<{ email: string; credits: number; name?: string } | null>(null)

  useEffect(() => {
    // Check for demo session and load profile
    const demoUser = localStorage.getItem('demo-user')
    
    if (demoUser) {
      setProfile(JSON.parse(demoUser))
    }
    // Filter studios based on search and filter
    let filtered = studios

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(studio =>
        studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        studio.location.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        studio.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(studio => {
        switch (selectedFilter) {
          case 'featured':
            return studio.featured
          case 'verified':
            return studio.verified
          case 'yoga':
            return studio.specialties?.some(s => s.toLowerCase().includes('yoga'))
          case 'gym':
            return studio.specialties?.some(s => s.toLowerCase().includes('training') || s.toLowerCase().includes('crossfit'))
          case 'wellness':
            return studio.specialties?.some(s => s.toLowerCase().includes('spa') || s.toLowerCase().includes('wellness'))
          default:
            return true
        }
      })
    }

    setFilteredStudios(filtered)
  }, [searchQuery, selectedFilter, studios])

  const getPriceRangeColor = (priceRange?: string) => {
    switch (priceRange) {
      case '$': return 'text-success'
      case '$$': return 'text-warning'
      case '$$$': return 'text-primary'
      case '$$$$': return 'text-error'
      default: return 'text-text-tertiary'
    }
  }

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase()
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-4 h-4" />
    if (lower.includes('parking') || lower.includes('car')) return <Car className="w-4 h-4" />
    if (lower.includes('equipment') || lower.includes('weights')) return <Dumbbell className="w-4 h-4" />
    if (lower.includes('spa') || lower.includes('sauna')) return <Heart className="w-4 h-4" />
    if (lower.includes('pool') || lower.includes('water')) return <Users className="w-4 h-4" />
    return <Award className="w-4 h-4" />
  }

  const handleSignOut = () => {
    localStorage.removeItem('demo-session')
    localStorage.removeItem('demo-user')
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      <NavigationHeader profile={profile || undefined} onSignOut={handleSignOut} />
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
                  <Dumbbell className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h1 className="font-heading text-display-lg gradient-fitness-text">
                  Fitness Studios
                </h1>
                <p className="text-text-secondary text-body-lg">Discover premium fitness experiences in Los Cabos</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-fitness-stats p-6 text-center animate-fade-in">
              <p className="text-display-sm font-bold text-text-primary">{studios.length}</p>
              <p className="text-caption-md text-text-secondary">Total Studios</p>
            </div>
            <div className="card-fitness-stats p-6 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <p className="text-display-sm font-bold text-text-primary">{studios.filter(s => s.verified).length}</p>
              <p className="text-caption-md text-text-secondary">Verified Partners</p>
            </div>
            <div className="card-fitness-stats p-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-display-sm font-bold text-text-primary">4.8</p>
              <p className="text-caption-md text-text-secondary">Avg Rating</p>
            </div>
            <div className="card-fitness-stats p-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <p className="text-display-sm font-bold text-text-primary">500+</p>
              <p className="text-caption-md text-text-secondary">Weekly Classes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filter Bar */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-fitness p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search studios, neighborhoods, or specialties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-fitness-search focus-fitness"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'featured', 'verified', 'yoga', 'gym', 'wellness'].map((filter) => (
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
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-text-secondary">
                {filteredStudios.length} studio{filteredStudios.length !== 1 ? 's' : ''} found
              </p>
              <div className="flex items-center gap-2 text-text-tertiary">
                <Filter className="w-4 h-4" />
                <span>Sorted by rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Studios Section */}
        {selectedFilter === 'all' && (
          <div className="mb-12">
            <h2 className="font-heading text-heading-xl text-text-primary mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-warning" />
              Featured Studios
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {studios.filter(s => s.featured).slice(0, 2).map((studio) => (
                <div key={studio.id} className="group relative">
                  <div className="absolute inset-0 gradient-fitness-primary rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity -z-10"></div>
                  <Card className="relative card-fitness-elevated bg-surface hover:border-primary/50 transition-all duration-300 overflow-hidden z-10">
                    {/* Featured Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <Badge className="badge-fitness-primary">
                        FEATURED
                      </Badge>
                    </div>

                    <div className="p-6">
                      <div className="flex gap-6">
                        {/* Studio Image */}
                        <div className="w-48 h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-border">
                          <Dumbbell className="w-8 h-8 text-primary" />
                          <span className="sr-only">Studio photo</span>
                        </div>

                        {/* Studio Info */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-heading text-heading-xl text-text-primary">{studio.name}</h3>
                              {studio.verified && (
                                <div className="badge-fitness-success text-xs">
                                  <Award className="w-3 h-3" />
                                  Verified
                                </div>
                              )}
                            </div>
                            <p className="text-text-secondary line-clamp-2">{studio.description}</p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(studio.rating) ? 'text-warning fill-current' : 'text-text-disabled'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-text-primary font-medium">{studio.rating}</span>
                              <span className="text-text-secondary text-sm">({studio.reviewCount} reviews)</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{studio.location.neighborhood}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {studio.specialties?.slice(0, 3).map((specialty) => (
                              <Badge key={specialty} variant="outline" className="badge-fitness text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Studios Grid */}
        <div className="mb-8">
          <h2 className="font-heading text-heading-xl text-text-primary mb-6">
            All Studios {selectedFilter !== 'all' && `- ${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}`}
          </h2>
          
          {filteredStudios.length === 0 ? (
            <div className="card-fitness p-12 text-center">
              <Dumbbell className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="font-heading text-heading-lg text-text-primary mb-2">No studios found</h3>
              <p className="text-text-secondary">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudios.map((studio) => (
                <div key={studio.id} className="group transform hover:scale-105 transition-transform duration-300">
                  <Card className="card-fitness-elevated bg-surface hover:border-primary/50 transition-all duration-300 overflow-hidden h-full">
                    {/* Studio Image */}
                    <div className="relative h-48 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center border-b border-border">
                      <Dumbbell className="w-12 h-12 text-primary" />
                      {studio.featured && (
                        <Badge className="absolute top-4 right-4 badge-fitness-primary">
                          FEATURED
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-heading text-heading-lg text-text-primary mb-1 flex items-center gap-2">
                              {studio.name}
                              {studio.verified && (
                                <Award className="w-4 h-4 text-success" />
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                              <MapPin className="w-3 h-3" />
                              <span>{studio.location.neighborhood}</span>
                            </div>
                          </div>
                          <span className={`text-lg font-bold ${getPriceRangeColor(studio.priceRange || '')}`}>
                            {studio.priceRange}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(studio.rating) ? 'text-warning fill-current' : 'text-text-disabled'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-text-primary font-medium">{studio.rating}</span>
                          <span className="text-text-secondary text-sm">({studio.reviewCount})</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      <p className="text-text-secondary text-sm line-clamp-2">{studio.description}</p>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1">
                        {studio.specialties?.slice(0, 3).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="badge-fitness text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      {/* Amenities */}
                      <div className="space-y-2">
                        <p className="text-caption-md font-medium text-text-tertiary">Top Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {studio.amenities.slice(0, 4).map((amenity) => (
                            <div key={amenity} className="flex items-center gap-1 text-caption-sm text-text-secondary">
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Contact & Hours */}
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                            <Phone className="w-4 h-4" />
                            <span>{studio.contact?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                            <Clock className="w-4 h-4" />
                            <span>Open today: {studio.openingHours?.Monday}</span>
                          </div>
                          {studio.contact?.website && (
                            <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
                              <Globe className="w-4 h-4" />
                              <span>{studio.contact.website}</span>
                            </div>
                          )}
                        </div>

                        <button className="btn-fitness-primary w-full">
                          View Classes & Book
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}