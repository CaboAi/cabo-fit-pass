'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GymPricing {
  gym_id: string
  gym_name: string
  active: boolean
  base_price: number
  payout_percentage: number
  created_at: string
  updated_at: string
}

interface Studio {
  id: string
  name: string
  location: string
}

export default function GymPricingPage() {
  const [gymPricing, setGymPricing] = useState<GymPricing[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingGym, setEditingGym] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch gym pricing and studios
      const [pricingResponse, studiosResponse] = await Promise.all([
        fetch('/api/admin/gym-pricing'),
        fetch('/api/admin/studios')
      ])

      if (!pricingResponse.ok || !studiosResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [pricingData, studiosData] = await Promise.all([
        pricingResponse.json(),
        studiosResponse.json()
      ])

      setGymPricing(pricingData.data || [])
      setStudios(studiosData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const updatePricing = async (gymId: string, updates: Partial<GymPricing>) => {
    try {
      const response = await fetch('/api/admin/gym-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: gymId, ...updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update pricing')
      }

      await fetchData()
      setEditingGym(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing')
    }
  }

  const createPricing = async (gymId: string) => {
    try {
      const response = await fetch('/api/admin/gym-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          base_price: 15.00,
          payout_percentage: 0.70,
          active: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create pricing')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pricing')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading gym pricing...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  // Create a map of existing pricing
  const pricingMap = new Map(gymPricing.map(p => [p.gym_id, p]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gym Pricing Management</h1>
        <p className="text-gray-600">Configure payout percentages and base prices for each gym</p>
      </div>

      <div className="grid gap-6">
        {studios.map((studio) => {
          const pricing = pricingMap.get(studio.id)
          const isEditing = editingGym === studio.id

          return (
            <Card key={studio.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="text-lg">{studio.name}</div>
                    <div className="text-sm text-gray-600 font-normal">{studio.location}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pricing && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        pricing.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pricing.active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!pricing ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">No pricing configuration set</p>
                    <Button onClick={() => createPricing(studio.id)}>
                      Create Pricing
                    </Button>
                  </div>
                ) : isEditing ? (
                  <PricingForm
                    pricing={pricing}
                    onSave={(updates) => updatePricing(studio.id, updates)}
                    onCancel={() => setEditingGym(null)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Base Price</Label>
                        <div className="text-lg">${pricing.base_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payout Percentage</Label>
                        <div className="text-lg">{(pricing.payout_percentage * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payout per Class</Label>
                        <div className="text-lg">${(pricing.base_price * pricing.payout_percentage).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setEditingGym(studio.id)}>
                        Edit Pricing
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function PricingForm({ 
  pricing, 
  onSave, 
  onCancel 
}: { 
  pricing: GymPricing
  onSave: (updates: Partial<GymPricing>) => void
  onCancel: () => void
}) {
  const [basePrice, setBasePrice] = useState(pricing.base_price.toString())
  const [payoutPercentage, setPayoutPercentage] = useState((pricing.payout_percentage * 100).toString())
  const [active, setActive] = useState(pricing.active)

  const handleSave = () => {
    const updates = {
      base_price: parseFloat(basePrice),
      payout_percentage: parseFloat(payoutPercentage) / 100,
      active
    }
    onSave(updates)
  }

  const calculatedPayout = (parseFloat(basePrice) || 0) * (parseFloat(payoutPercentage) || 0) / 100

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="basePrice">Base Price ($)</Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="payoutPercentage">Payout Percentage (%)</Label>
          <Input
            id="payoutPercentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={payoutPercentage}
            onChange={(e) => setPayoutPercentage(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="p-4 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Preview:</div>
        <div className="text-lg font-medium">
          Payout per class: ${calculatedPayout.toFixed(2)}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}