'use client'

import { AlertTriangle, RefreshCw, Home, Wifi, Server, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  error?: Error | null
  resetError?: () => void
  title?: string
  message?: string
  showHomeButton?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  title,
  message,
  showHomeButton = true
}: ErrorFallbackProps) {
  const getErrorIcon = (errorMessage: string) => {
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return <Wifi className="w-16 h-16 text-error" />
    }
    if (errorMessage.includes('server') || errorMessage.includes('503') || errorMessage.includes('500')) {
      return <Server className="w-16 h-16 text-error" />
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('slow')) {
      return <Clock className="w-16 h-16 text-error" />
    }
    return <AlertTriangle className="w-16 h-16 text-error" />
  }

  const errorMessage = error?.message || message || 'Something went wrong'
  const errorTitle = title || 'Oops! Something went wrong'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="card-fitness p-8 space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            {getErrorIcon(errorMessage)}
          </div>

          {/* Error Title */}
          <div>
            <h1 className="font-heading text-heading-xl text-text-primary mb-2">
              {errorTitle}
            </h1>
            <p className="text-text-secondary text-body-md leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-text-tertiary text-caption-md mb-2">
                Technical Details
              </summary>
              <pre className="text-xs bg-surface-secondary p-3 rounded overflow-auto text-error">
                {error.stack || error.toString()}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {resetError && (
              <Button
                onClick={resetError}
                className="btn-fitness-primary inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            )}
          </div>

          {/* Additional Help */}
          <div className="text-text-tertiary text-caption-md">
            <p>If this problem persists, please contact support</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Specific error fallbacks for different scenarios
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={new Error('Network connection failed')}
      resetError={onRetry}
      title="Connection Problem"
      message="Please check your internet connection and try again."
    />
  )
}

export function ServerErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={new Error('Server temporarily unavailable')}
      resetError={onRetry}
      title="Server Issue"
      message="Our servers are experiencing issues. Please try again in a few moments."
    />
  )
}

export function DataLoadErrorFallback({ 
  onRetry, 
  dataType = 'data' 
}: { 
  onRetry?: () => void
  dataType?: string 
}) {
  return (
    <div className="card-fitness p-8 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 text-error mx-auto" />
      <div>
        <h3 className="font-heading text-heading-lg text-text-primary mb-2">
          Failed to Load {dataType}
        </h3>
        <p className="text-text-secondary text-body-sm">
          Unable to fetch the latest information. Please try again.
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          className="btn-fitness-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function EmptyStateFallback({
  icon: Icon = AlertTriangle,
  title = "No Data Available",
  message = "There's nothing to show right now.",
  actionLabel,
  onAction
}: {
  icon?: React.ComponentType<any>
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="card-fitness p-12 text-center space-y-4">
      <Icon className="w-16 h-16 text-text-tertiary mx-auto" />
      <div>
        <h3 className="font-heading text-heading-lg text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-text-secondary text-body-md">
          {message}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="btn-fitness-primary"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}