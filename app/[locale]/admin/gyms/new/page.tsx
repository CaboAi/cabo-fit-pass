'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function NewGymPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    email: '',
    phone: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/gyms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create gym')
      }

      const result = await response.json()
      console.log('Gym creation result:', result)

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      const gym = result.data
      console.log('Gym object:', gym)
      console.log('Gym ID:', gym.id)

      if (!gym.id) {
        throw new Error('Gym created but no ID returned')
      }

      // Show success message
      showSuccess(`Gym "${gym.name}" created successfully!`)
      
      // Navigate to the gym detail page with locale
      const currentLocale = window.location.pathname.split('/')[1]
      router.push(`/${currentLocale}/admin/gyms/${gym.id}`)
    } catch (err) {
      console.error('Error in form submission:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="../">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Gym</h1>
            <p className="text-gray-600 mt-1">Create a new gym and set up their account</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Gym Information</CardTitle>
            <CardDescription>
              Enter the details for the new gym. You can configure Stripe Connect after creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Gym Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter gym name"
                  required
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                  aria-describedby={error ? "name-error" : undefined}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="gym@example.com"
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the gym..."
                rows={4}
                disabled={isSubmitting}
                className="min-h-[44px]"
                aria-describedby="description-help"
              />
              <div id="description-help" className="sr-only">
                Optional brief description of the gym and its facilities
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="min-w-[44px] min-h-[44px]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[44px] min-h-[44px]">
                {isSubmitting ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Gym
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}