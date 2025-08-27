import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminNotFound() {
  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <FileQuestion className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription className="mt-2">
            The admin page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This might be because:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 text-left max-w-sm mx-auto">
            <li>• The URL is incorrect or has changed</li>
            <li>• The resource has been deleted</li>
            <li>• You don't have permission to access this page</li>
          </ul>
          
          <div className="flex gap-2 justify-center pt-2">
            <Button asChild variant="default">
              <Link href="/en/admin">
                Go to Admin Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}