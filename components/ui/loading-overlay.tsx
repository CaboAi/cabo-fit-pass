'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  className?: string
  children?: React.ReactNode
}

export function LoadingOverlay({ 
  isVisible, 
  text = 'Loading...', 
  className,
  children 
}: LoadingOverlayProps) {
  if (!isVisible) return <>{children}</>

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">{text}</p>
        </div>
      </div>
    </div>
  )
}