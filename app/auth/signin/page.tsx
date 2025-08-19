'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/layout/loading-spinner'
import { Activity } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@cabofitpass.com', password: 'demo123' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store demo session in localStorage for demo purposes
        localStorage.setItem('demo-session', JSON.stringify(data.session))
        localStorage.setItem('demo-user', JSON.stringify(data.user))
        router.push('/dashboard')
      } else {
        setError(data.error || 'Demo login failed')
      }
    } catch {
      setError('Demo login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('demo-session', JSON.stringify(data.session))
        localStorage.setItem('demo-user', JSON.stringify(data.user))
        router.push('/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Cabo Fit Pass
          </h1>
        </div>

        <Card className="rounded-2xl border bg-card p-6 space-y-4">
          <CardHeader className="text-center p-0">
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome back
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Sign in to continue your Cabo Fit Pass journey
            </p>
          </CardHeader>
          <CardContent className="space-y-5 p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-lg"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="text-sm font-medium block mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg"
                  placeholder="Enter your password"
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base rounded-xl"
                data-cta="signin"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <Button 
                onClick={handleDemoLogin} 
                variant="outline" 
                className="w-full h-11 text-base rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Member Demo Login'}
              </Button>
              <div className="text-xs text-muted-foreground">demo@cabofitpass.com - Member Experience</div>
              
              <Button 
                onClick={() => {
                  // Studio owner demo login
                  localStorage.setItem('demo-session', 'true')
                  localStorage.setItem('demo-user', JSON.stringify({
                    email: 'owner@cabofitness.com',
                    credits: 0,
                    name: 'Maria Rodriguez (Studio Owner)',
                    user_type: 'studio_owner'
                  }))
                  router.push('/studio-management')
                }} 
                variant="outline"
                className="w-full h-11 text-base rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                Studio Owner Demo
              </Button>
              <div className="text-xs text-muted-foreground">Studio Management Experience</div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
              "Don&apos;t have an account? Sign up"{' '}
                <a href="#" className="text-primary underline-offset-4 hover:underline font-medium">
                  Sign up
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
