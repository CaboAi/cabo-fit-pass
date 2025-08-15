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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_60%)]" />
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-orange-400 to-pink-600 text-white p-3 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Cabo Fit Pass
          </h1>
        </div>

        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome back
            </CardTitle>
            <p className="text-purple-200 mt-1">
              Sign in to continue your Cabo Fit Pass journey
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder-purple-300"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder-purple-300"
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <Button 
                onClick={handleDemoLogin} 
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Member Demo Login'}
              </Button>
              <div className="text-xs text-purple-300">demo@cabofitpass.com - Member Experience</div>
              
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
                className="w-full border-orange-400/30 text-orange-300 hover:bg-orange-400/10"
                disabled={loading}
              >
                Studio Owner Demo
              </Button>
              <div className="text-xs text-orange-300">
                owner@cabofitness.com - Studio Management
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-purple-200 text-sm mt-6">
          One pass. Access top studios. Book in seconds.
        </div>
      </div>
    </div>
  )
}
