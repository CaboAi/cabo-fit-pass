'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, AlertCircle, CreditCard, Users, Calendar, DollarSign } from 'lucide-react'

export default function QAPage() {
  const [results, setResults] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  const runTest = async (testName: string, endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(prev => ({ ...prev, [testName]: true }))
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      })
      
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: response.ok,
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleTimeString()
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }))
    }
  }

  const TestCard = ({ title, testName, description, endpoint, method = 'GET', body }: any) => {
    const result = results[testName]
    const isLoading = loading[testName]

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">{title}</span>
            {result && (
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Pass' : 'Fail'}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {method} {endpoint}
              </code>
              <Button
                onClick={() => runTest(testName, endpoint, method, body)}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            
            {result && (
              <div className="border rounded p-3 bg-gray-50">
                <div className="flex items-center space-x-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    Status: {result.status || 'Error'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {result.timestamp}
                  </span>
                </div>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QA Testing Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Test all credit system functionality without Stripe integration
          </p>
        </div>

        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="credits">Credit System</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TestCard
                title="Credit Breakdown"
                testName="credit-breakdown"
                description="Test fetching detailed credit breakdown with expiration info"
                endpoint="/api/credits/breakdown"
              />
              
              <TestCard
                title="Tourist Pass Status"
                testName="tourist-pass-status"
                description="Test fetching active tourist pass status"
                endpoint="/api/tourist-pass/status"
              />
              
              <TestCard
                title="Monthly Credit Grant"
                testName="monthly-grant"
                description="Test monthly credit granting (development mode)"
                endpoint="/api/cron/grant-monthly"
                method="POST"
                body={{ secret: 'dev-secret' }}
              />
              
              <TestCard
                title="User Credits"
                testName="user-credits"
                description="Test fetching user credit balance"
                endpoint="/api/credits"
              />
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TestCard
                title="Available Classes"
                testName="available-classes"
                description="Test fetching available classes for booking"
                endpoint="/api/classes"
              />
              
              <TestCard
                title="User Bookings"
                testName="user-bookings"
                description="Test fetching user's current bookings"
                endpoint="/api/bookings"
              />
              
              <TestCard
                title="Book Class"
                testName="book-class"
                description="Test booking a class (requires class ID)"
                endpoint="/api/bookings"
                method="POST"
                body={{ class_id: 'test-class-id' }}
              />
              
              <TestCard
                title="Cancel Booking"
                testName="cancel-booking"
                description="Test canceling a booking (requires booking ID)"
                endpoint="/api/bookings/cancel"
                method="POST"
                body={{ booking_id: 'test-booking-id' }}
              />
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TestCard
                title="Create Checkout Session"
                testName="create-checkout"
                description="Test creating mock payment checkout session"
                endpoint="/api/create-payment-intent"
                method="POST"
                body={{ credits: 10 }}
              />
              
              <TestCard
                title="Complete Mock Payment"
                testName="complete-payment"
                description="Test completing mock payment (development only)"
                endpoint="/api/dev/complete-checkout"
                method="POST"
                body={{ sessionId: 'mock-session-123' }}
              />
              
              <TestCard
                title="Payment Provider Status"
                testName="payment-provider"
                description="Check which payment provider is active"
                endpoint="/api/dev/payment-provider"
              />
              
              <TestCard
                title="Confirm Payment"
                testName="confirm-payment"
                description="Test payment confirmation endpoint"
                endpoint="/api/confirm-payment"
                method="POST"
                body={{ payment_intent_id: 'mock-payment-123' }}
              />
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TestCard
                title="Gym Pricing"
                testName="gym-pricing"
                description="Test fetching gym pricing configuration"
                endpoint="/api/admin/gym-pricing"
              />
              
              <TestCard
                title="Payout Snapshots"
                testName="payout-snapshots"
                description="Test fetching payout snapshots"
                endpoint="/api/admin/payout-snapshots"
              />
              
              <TestCard
                title="Generate Payouts"
                testName="generate-payouts"
                description="Test generating payout report for last 14 days"
                endpoint="/api/reports/payouts"
              />
              
              <TestCard
                title="Studios List"
                testName="studios-list"
                description="Test fetching all studios for admin"
                endpoint="/api/admin/studios"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>Quick Development Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => runTest('run-all-credits', '/api/credits/breakdown')}
                className="flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Test All Credit APIs</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => runTest('health-check', '/api/health')}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>API Health Check</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Summary */}
        {Object.keys(results).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(results).filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(results).filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(results).length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {Math.round((Object.values(results).filter(r => r.success).length / Object.keys(results).length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}