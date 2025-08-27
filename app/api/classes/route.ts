import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClassItem, ApiResponse } from '@/types'
import { seedDemoData } from '@/lib/demo-data'
import { createComponentLogger } from '@/lib/logger'
import { cache, CACHE_TTL } from '@/lib/cache'

export async function GET(): Promise<NextResponse<ApiResponse<{ classes: ClassItem[] }>>> {
  const logger = createComponentLogger('classes')
  const startTime = Date.now()
  
  try {
    logger.info('Fetching classes started', {
      action: 'fetch-classes'
    })

    // Try to get data from cache first
    const cachedClasses = await cache.classes.list().get()
    if (cachedClasses) {
      const duration = Date.now() - startTime
      logger.info('Classes served from cache', {
        action: 'fetch-classes',
        duration,
        statusCode: 200,
        metadata: { classCount: cachedClasses.length, source: 'cache' }
      })
      
      return NextResponse.json({
        success: true,
        data: { classes: cachedClasses }
      })
    }
    
    const supabase = createClient()
    
    // Try to get real data from database
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
      logger.info('Real classes data found', {
        action: 'fetch-classes',
        resource: 'classes',
        metadata: { classCount: classes.length }
      })
      const transformedClasses: ClassItem[] = classes.map((classData: {
        id: string
        studio_id: string
        name: string
        instructor_id?: string
        class_type: string
        description?: string
        start_time: string
        duration: number
        max_capacity: number
        credit_cost: number
        difficulty_level: 'beginner' | 'intermediate' | 'advanced'
        created_at?: string
        studios?: { id: string; name: string; location: string | { lat: number; lng: number; address: string; neighborhood: string } }
        bookings?: { id: string }[]
      }) => ({
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

      // Cache the transformed classes data
      await cache.classes.list().set(transformedClasses, CACHE_TTL.MEDIUM)

      const duration = Date.now() - startTime
      logger.info('Classes fetched successfully from database and cached', {
        action: 'fetch-classes',
        duration,
        statusCode: 200,
        metadata: { classCount: transformedClasses.length, source: 'database' }
      })

      return NextResponse.json({
        success: true,
        data: { classes: transformedClasses }
      })
    }

    // Fallback to demo data if no real data exists
    logger.info('No real classes data found, using demo data', {
      action: 'fetch-classes',
      resource: 'demo-data',
      metadata: { reason: 'no_real_data' }
    })
    
    const demoData = await seedDemoData()
    
    // Cache demo data for a shorter period
    await cache.classes.list().set(demoData.classes, CACHE_TTL.SHORT)
    
    const duration = Date.now() - startTime
    logger.info('Demo classes data returned and cached', {
      action: 'fetch-classes',
      duration,
      statusCode: 200,
      metadata: { classCount: demoData.classes.length, source: 'demo' }
    })
    
    return NextResponse.json({
      success: true,
      data: { classes: demoData.classes },
      message: 'Using demo data - connect your database for real classes!'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Classes API error', {
      action: 'fetch-classes',
      duration,
      errorCode: 'CLASSES_FETCH_FAILED'
    }, error instanceof Error ? error : new Error('Unknown error'))
    
    // Even if everything fails, return demo data
    try {
      logger.info('Attempting to return demo data after error', {
        action: 'fetch-classes',
        metadata: { fallback: 'demo_data' }
      })
      
      const demoData = await seedDemoData()
      return NextResponse.json({
        success: true,
        data: { classes: demoData.classes },
        message: 'Using demo data due to server error'
      })
    } catch (fallbackError) {
      logger.error('Failed to return demo data as fallback', {
        action: 'fetch-classes',
        errorCode: 'DEMO_DATA_FALLBACK_FAILED',
        statusCode: 500
      }, fallbackError instanceof Error ? fallbackError : new Error('Unknown fallback error'))
      
      return NextResponse.json({
        success: false,
        error: 'Failed to load classes'
      }, { status: 500 })
    }
  }
}