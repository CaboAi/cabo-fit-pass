import { ClassItem, Studio } from '@/types'

export const DEMO_STUDIOS: Studio[] = [
  {
    id: 'studio-1',
    name: 'Cabo Fitness Studio',
    owner_id: 'demo-owner',
    description: 'Premium fitness studio in the heart of Cabo San Lucas',
    location: {
      lat: 22.8905,
      lng: -109.9167,
      address: 'Calle Principal 123, Cabo San Lucas',
      neighborhood: 'Centro'
    },
    amenities: ['Yoga mats', 'Weights', 'Cardio equipment', 'Shower facilities'],
    rating: 4.8
  },
  {
    id: 'studio-2',
    name: 'Baja Wellness Center',
    owner_id: 'demo-owner',
    description: 'Holistic wellness and fitness center',
    location: {
      lat: 22.8910,
      lng: -109.9170,
      address: 'Avenida Marina 456, Cabo San Lucas',
      neighborhood: 'Marina'
    },
    amenities: ['Meditation room', 'Spa services', 'Fitness classes', 'Nutrition counseling'],
    rating: 4.9
  }
]

export const DEMO_CLASSES: Omit<ClassItem, 'id' | 'studio'>[] = [
  {
    studio_id: 'studio-1',
    name: 'Morning Yoga Flow',
    instructor_id: 'instructor-1',
    class_type: 'Yoga',
    description: 'Start your day with energizing yoga flow',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration: 60,
    max_capacity: 15,
    credit_cost: 2,
    difficulty_level: 'beginner',
    created_at: new Date().toISOString(),
    current_bookings: 0
  },
  {
    studio_id: 'studio-1',
    name: 'HIIT Cardio Blast',
    instructor_id: 'instructor-2',
    class_type: 'HIIT',
    description: 'High-intensity interval training for maximum results',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    duration: 45,
    max_capacity: 12,
    credit_cost: 3,
    difficulty_level: 'intermediate',
    created_at: new Date().toISOString(),
    current_bookings: 0
  },
  {
    studio_id: 'studio-2',
    name: 'Pilates Core',
    instructor_id: 'instructor-3',
    class_type: 'Pilates',
    description: 'Strengthen your core with Pilates fundamentals',
    start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    max_capacity: 10,
    credit_cost: 2,
    difficulty_level: 'beginner',
    created_at: new Date().toISOString(),
    current_bookings: 0
  },
  {
    studio_id: 'studio-2',
    name: 'Advanced Strength Training',
    instructor_id: 'instructor-4',
    class_type: 'Strength',
    description: 'Build muscle and increase strength',
    start_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 75,
    max_capacity: 8,
    credit_cost: 4,
    difficulty_level: 'advanced',
    created_at: new Date().toISOString(),
    current_bookings: 0
  }
  ,
  {
    studio_id: 'studio-1',
    name: 'Spin Power Ride',
    instructor_id: 'instructor-5',
    class_type: 'Cycling',
    description: 'High-energy spin ride to power up your cardio.',
    start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    max_capacity: 20,
    credit_cost: 3,
    difficulty_level: 'intermediate',
    created_at: new Date().toISOString(),
    current_bookings: 0
  },
  {
    studio_id: 'studio-2',
    name: 'Sunset Beach Yoga',
    instructor_id: 'instructor-6',
    class_type: 'Yoga',
    description: 'Relaxing vinyasa flow with ocean views at sunset.',
    start_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    max_capacity: 18,
    credit_cost: 2,
    difficulty_level: 'beginner',
    created_at: new Date().toISOString(),
    current_bookings: 0
  }
]

export async function seedDemoData() {
  // This function would be called to populate your database
  // For now, we'll use it to generate demo data for the frontend
  return {
    studios: DEMO_STUDIOS,
    classes: DEMO_CLASSES.map((cls, index) => ({
      ...cls,
      id: `class-${index + 1}`,
      studio: DEMO_STUDIOS.find(s => s.id === cls.studio_id)!
    }))
  }
}
