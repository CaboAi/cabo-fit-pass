'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, CreditCard, Calendar, TrendingUp, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('demo-admin-session') === 'true')
    }
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          System overview and management{isDemoMode ? ' (Demo Mode)' : ''}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Manage Gyms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Add new gyms, manage pricing, and set up Stripe Connect accounts
            </p>
            {isDemoMode ? (
              <Button 
                onClick={() => {
                  const demoGyms = [
                    { name: 'Iron Paradise Gym', location: 'Cabo San Lucas', status: 'Active', members: 89 },
                    { name: 'Oceanview Fitness', location: 'San José del Cabo', status: 'Active', members: 156 },
                    { name: 'Desert Strength', location: 'Corridor', status: 'Pending Setup', members: 45 }
                  ]
                  alert(`Demo Gym List:\n\n${demoGyms.map(g => `${g.name} (${g.location})\nStatus: ${g.status}\nMembers: ${g.members}\n`).join('\n')}`)
                }}
                className="w-full"
              >
                Go to Gyms
              </Button>
            ) : (
              <Link 
                href="/en/admin/gyms" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Gyms
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gym Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure pricing tiers and credit costs for gym classes
            </p>
            {isDemoMode ? (
              <Button 
                onClick={() => {
                  const demoPricing = [
                    { package: 'Single Drop-in', credits: 3, price: '$12 USD' },
                    { package: '10-Class Pack', credits: 25, price: '$40 USD' },
                    { package: 'Monthly Pass', credits: 50, price: '$75 USD' },
                    { package: 'Premium Monthly', credits: 100, price: '$140 USD' }
                  ]
                  alert(`Demo Pricing Tiers:\n\n${demoPricing.map(p => `${p.package}\n${p.credits} credits - ${p.price}\n`).join('\n')}`)
                }}
                className="w-full"
              >
                Manage Pricing
              </Button>
            ) : (
              <Link 
                href="/en/admin/gym-pricing" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Manage Pricing
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Monitor and manage gym payouts and revenue distribution
            </p>
            {isDemoMode ? (
              <Button 
                onClick={() => {
                  const demoPayouts = [
                    { gym: 'Iron Paradise', amount: '$2,450', status: 'Paid', date: '2025-02-15' },
                    { gym: 'Oceanview Fitness', amount: '$3,890', status: 'Pending', date: '2025-02-20' },
                    { gym: 'Desert Strength', amount: '$1,230', status: 'Processing', date: '2025-02-18' }
                  ]
                  alert(`Demo Payouts:\n\n${demoPayouts.map(p => `${p.gym}: ${p.amount}\nStatus: ${p.status} | Date: ${p.date}\n`).join('\n')}`)
                }}
                className="w-full"
              >
                View Payouts
              </Button>
            ) : (
              <Link 
                href="/en/admin/payouts" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Payouts
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View user accounts, manage credits, and monitor activity
            </p>
            {isDemoMode ? (
              <Button 
                onClick={() => {
                  const demoUsers = [
                    { name: 'Sarah Martinez', email: 'sarah@example.com', credits: 45, plan: 'Monthly', joined: '2025-01-15' },
                    { name: 'Mike Thompson', email: 'mike@example.com', credits: 12, plan: '10-Class Pack', joined: '2025-02-01' },
                    { name: 'Lisa Chen', email: 'lisa@example.com', credits: 89, plan: 'Premium Monthly', joined: '2024-12-20' },
                    { name: 'David Rodriguez', email: 'david@example.com', credits: 3, plan: 'Single Drop-in', joined: '2025-02-10' }
                  ]
                  alert(`Demo User List:\n\n${demoUsers.map(u => `${u.name} (${u.email})\nCredits: ${u.credits} | Plan: ${u.plan}\nJoined: ${u.joined}\n`).join('\n')}`)
                }}
                className="w-full"
              >
                Manage Users
              </Button>
            ) : (
              <Link 
                href="/en/admin/users" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Manage Users
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demo Stats */}
      {isDemoMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">1,247</div>
              <div className="text-xs text-green-600">+12% from last month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Gyms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">23</div>
              <div className="text-xs text-green-600">+2 new this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$28,450</div>
              <div className="text-xs text-green-600">+18% from last month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Classes Booked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">3,891</div>
              <div className="text-xs text-green-600">+25% from last month</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Status */}
      <Card>
        <CardHeader>
          <CardTitle>Test Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 mb-4">
              ✅ Admin{isDemoMode ? ' Demo' : ''} is working!
            </div>
            <p className="text-gray-600">
              {isDemoMode 
                ? 'You can now test admin features without authentication. Click any button above to see demo interactions.'
                : 'If you can see this, the basic admin routing is working.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
