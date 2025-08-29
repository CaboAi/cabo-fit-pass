'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from './button'
import { cn } from '@/lib/utils'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        className={cn(className)}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? loadingText || children : children}
      </Button>
    )
  }
)
LoadingButton.displayName = 'LoadingButton'

export { LoadingButton }