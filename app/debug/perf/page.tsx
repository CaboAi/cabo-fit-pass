import Hero from '@/components/Hero'
import ServicesGrid from '@/components/ServicesGrid'
import Image from 'next/image'

// Mock studio data for performance testing
const mockStudios = [
  {
    id: '1',
    name: 'Cabo Wellness Studio',
    image: '/images/fitness/yoga1.jpg',
    rating: 4.8,
    reviewCount: 142,
    specialties: ['yoga', 'meditation'],
    location: { neighborhood: 'Centro' }
  },
  {
    id: '2', 
    name: 'Iron Gym Los Cabos',
    image: '/images/fitness/gym1.jpg',
    rating: 4.6,
    reviewCount: 89,
    specialties: ['strength', 'crossfit'],
    location: { neighborhood: 'Marina' }
  },
  {
    id: '3',
    name: 'Padel Paradise',
    image: '/images/fitness/padel1.jpg', 
    rating: 4.9,
    reviewCount: 76,
    specialties: ['padel'],
    location: { neighborhood: 'Medano' }
  }
]

export default function PerfTestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="mb-12">
        <Hero 
          heading="Performance Test Page"
          subheading="Testing image loading and layout stability"
        />
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h2 className="text-3xl font-bold mb-8">Services Grid Test</h2>
        <ServicesGrid />
      </div>

      {/* Studio Cards Test */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h2 className="text-3xl font-bold mb-8">Studio Cards Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockStudios.map((studio) => (
            <div key={studio.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* Studio Image with fixed aspect ratio */}
              <div className="relative w-full aspect-[16/9]">
                <Image 
                  src={studio.image}
                  alt={`${studio.name} cover`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              
              {/* Studio Info */}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{studio.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-medium">{studio.rating}</span>
                  </div>
                  <span className="text-gray-500">({studio.reviewCount} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {studio.specialties.map((specialty) => (
                    <span 
                      key={specialty}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mt-2">{studio.location.neighborhood}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Notes */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Optimizations Applied:</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ All images use aspect-ratio containers to prevent layout shift</li>
            <li>✅ Hero image uses priority loading for faster LCP</li>
            <li>✅ Service grid images load lazily by default</li>
            <li>✅ Root-relative image paths (no imports from @/public)</li>
            <li>✅ Server components where possible</li>
            <li>✅ Smooth scrolling enabled globally</li>
            <li>✅ Preconnect hints for external domains</li>
            <li>✅ Next.js font optimization with Inter</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
