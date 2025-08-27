import { createClient } from '@/lib/supabase/server'
import { GymConnectSetup } from '@/components/admin/gym-connect-setup'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, DollarSign } from 'lucide-react'

export default async function GymPricingPage() {
  const supabase = createClient()
  
  const { data: gyms, error } = await supabase
    .from('gyms')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching gyms:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gym Pricing & Payouts</h1>
          <p className="text-gray-600 mt-1">Configure pricing, payouts, and Stripe Connect for gyms</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Gym
        </Button>
      </div>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout Configuration
          </CardTitle>
          <CardDescription>
            Set default payout percentages and pricing rules for all gyms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Payout %</label>
              <input 
                type="number" 
                defaultValue="70" 
                className="w-full px-3 py-2 border rounded-md"
                placeholder="70"
              />
              <p className="text-xs text-gray-500">Percentage gyms receive from bookings</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Fee %</label>
              <input 
                type="number" 
                defaultValue="30" 
                className="w-full px-3 py-2 border rounded-md"
                placeholder="30"
              />
              <p className="text-xs text-gray-500">Platform service fee</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Payout</label>
              <input 
                type="number" 
                defaultValue="50" 
                className="w-full px-3 py-2 border rounded-md"
                placeholder="50"
              />
              <p className="text-xs text-gray-500">Minimum amount before payout</p>
            </div>
          </div>
          <Button className="mt-4">
            <Settings className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Gym List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gym Management</h2>
        {gyms?.map((gym) => (
          <Card key={gym.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{gym.name}</span>
                <span className="text-sm font-normal text-gray-500">
                  {gym.location || 'No location'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GymConnectSetup gymId={gym.id} gymName={gym.name} />
            </CardContent>
          </Card>
        ))}
        
        {(!gyms || gyms.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">No gyms configured yet</div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Gym
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}