'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-gray-300 bg-gray-50', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon && (
          <div className="w-16 h-16 text-gray-400 mb-4">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 max-w-sm mb-6">
          {description}
        </p>
        
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
