import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClassItem, ApiResponse } from '@/types'
import { seedDemoData } from '@/lib/demo-data'

export async function GET(): Promise<NextResponse<ApiResponse<{ classes: ClassItem[] }>>> {
  try {
    const supabase = createClient()
    
    // Try to get real data first
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        *,
        studios (
          id,
          name,
          location
        ),
        bookings (
          id
        )
      `)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(50)

    // If we have real data, use it
    if (classes && classes.length > 0 && !error) {
      const transformedClasses: ClassItem[] = classes.map((classData: any) => ({
        id: classData.id,
        studio_id: classData.studio_id,
        name: classData.name,
        instructor_id: classData.instructor_id,
        class_type: classData.class_type,
        description: classData.description,
        start_time: classData.start_time,
        duration: classData.duration,
        max_capacity: classData.max_capacity,
        credit_cost: classData.credit_cost,
        difficulty_level: classData.difficulty_level,
        created_at: classData.created_at,
        studio: classData.studios ? {
          id: classData.studios.id,
          name: classData.studios.name,
          owner_id: '',
          description: '',
          location: typeof classData.studios.location === 'string' 
            ? { lat: 0, lng: 0, address: classData.studios.location, neighborhood: '' }
            : classData.studios.location,
          amenities: [],
          rating: 0
        } : undefined,
        current_bookings: classData.bookings?.length || 0
      }))

      return NextResponse.json({
        success: true,
        data: { classes: transformedClasses }
      })
    }

    // Fallback to demo data if no real data exists
    const demoData = await seedDemoData()
    
    return NextResponse.json({
      success: true,
      data: { classes: demoData.classes },
      message: 'Using demo data - connect your database for real classes!'
    })

  } catch (error) {
    console.error('Classes API error:', error)
    
    // Even if everything fails, return demo data
    try {
      const demoData = await seedDemoData()
      return NextResponse.json({
        success: true,
        data: { classes: demoData.classes },
        message: 'Using demo data due to server error'
      })
    } catch (demoError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load classes'
      }, { status: 500 })
    }
  }
}