import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  
  // Hardcoded demo user for immediate access
  if (email === 'demo@cabofitpass.com') {
    return NextResponse.json({
      success: true,
      user: {
        id: 'demo-user-123',
        email: 'demo@cabofitpass.com',
        name: 'Demo User',
        credits: 25
      }
    })
  }
  
  return NextResponse.json({ success: false, error: 'Invalid demo credentials' })
}
