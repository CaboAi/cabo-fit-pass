import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Calendar } from 'lucide-react'

interface GymsPageProps {
  params: { locale: string }
}

export default async function GymsPage({ params }: GymsPageProps) {
  const supabase = createClient()
  
  const { data: gyms, error } = await supabase
    .from('gyms')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching gyms:', error)
  }

  const locale = params.locale

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gym Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all gyms and their Stripe Connect accounts</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/${locale}/admin/gyms/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Gym
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {gyms?.map((gym) => (
          <Card key={gym.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">{gym.name}</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {gym.location || 'Location not specified'}
                  </CardDescription>
                </div>
                <Badge 
                  variant={gym.stripe_connect_id ? "default" : "outline"}
                  className="self-start sm:self-center flex-shrink-0"
                >
                  {gym.stripe_connect_id ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{gym.location || 'No location'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Created {new Date(gym.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="pt-2">
                <Button asChild size="sm" className="w-full min-h-[44px]">
                  <Link href={`/${locale}/admin/gyms/${gym.id}`}>
                    Manage Gym
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!gyms || gyms.length === 0) && (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <div className="text-gray-500 mb-4 text-sm sm:text-base">No gyms found</div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/${locale}/admin/gyms/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Gym
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}