import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient()

    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        services: {
          database: 'down',
          api: 'up'
        },
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      status: 'healthy',
      services: {
        database: 'up',
        api: 'up'
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      services: {
        database: 'unknown',
        api: 'up'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}