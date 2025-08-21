import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // Hardcoded demo credentials
  if (email === 'demo@cabofitpass.com' && password === 'demo123') {
    return NextResponse.json({
      success: true,
      user: {
        id: 'demo-user-123',
        email: 'demo@cabofitpass.com',
        name: 'Demo User',
        credits: 25
      },
      session: {
        user: {
          id: 'demo-user-123',
          email: 'demo@cabofitpass.com',
          name: 'Demo User'
        }
      }
    })
  }
  
  return NextResponse.json({ 
    success: false, 
    error: 'Invalid demo credentials. Use: demo@cabofitpass.com / demo123' 
  })
}
