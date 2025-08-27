import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClassItem, ApiResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ class: ClassItem }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const classData = await request.json()

    // Validate required fields
    if (!classData.name || !classData.class_type || !classData.start_time) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, class_type, start_time'
      }, { status: 400 })
    }

    // For demo purposes, we'll simulate creating a class
    const newClass: ClassItem = {
      id: `class-${Date.now()}`,
      studio_id: classData.studio_id || 'studio-1',
      name: classData.name,
      instructor_id: classData.instructor_id || 'instructor-1',
      class_type: classData.class_type,
      description: classData.description || '',
      start_time: classData.start_time,
      duration: classData.duration || 60,
      max_capacity: classData.max_capacity || 15,
      credit_cost: classData.credit_cost || 2,
      difficulty_level: classData.difficulty_level || 'beginner',
      created_at: new Date().toISOString(),
      current_bookings: 0
    }

    return NextResponse.json({
      success: true,
      data: { class: newClass },
      message: 'Class created successfully'
    })

  } catch (error) {
    console.error('Studio management API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<{ class: ClassItem }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { classId, ...updateData } = await request.json()

    if (!classId) {
      return NextResponse.json({
        success: false,
        error: 'Class ID is required'
      }, { status: 400 })
    }

    // For demo purposes, we'll simulate updating a class
    const updatedClass: ClassItem = {
      id: classId,
      studio_id: updateData.studio_id || 'studio-1',
      name: updateData.name,
      instructor_id: updateData.instructor_id || 'instructor-1',
      class_type: updateData.class_type,
      description: updateData.description || '',
      start_time: updateData.start_time,
      duration: updateData.duration || 60,
      max_capacity: updateData.max_capacity || 15,
      credit_cost: updateData.credit_cost || 2,
      difficulty_level: updateData.difficulty_level || 'beginner',
      created_at: updateData.created_at || new Date().toISOString(),
      current_bookings: updateData.current_bookings || 0
    }

    return NextResponse.json({
      success: true,
      data: { class: updatedClass },
      message: 'Class updated successfully'
    })

  } catch (error) {
    console.error('Studio management API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<Record<string, never>>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({
        success: false,
        error: 'Class ID is required'
      }, { status: 400 })
    }

    // For demo purposes, we'll simulate deleting a class
    // In a real app, you would delete from the database here

    return NextResponse.json({
      success: true,
      data: {},
      message: 'Class deleted successfully'
    })

  } catch (error) {
    console.error('Studio management API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
