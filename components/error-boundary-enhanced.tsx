'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { addBreadcrumb, recordMetric } from '@/lib/monitoring/sentry-integration'

/**
 * Enhanced error boundary components and utilities
 */

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  context?: string
  action?: string
}

/**
 * Simple error fallback component
 */
export const SimpleErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  context = 'application',
  action = 'retry'
}) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <h3 className="text-red-800 font-medium mb-2">Something went wrong</h3>
    <p className="text-red-600 text-sm mb-3">
      {error.message || 'An unexpected error occurred'}
    </p>
    <button
      onClick={resetError}
      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
    >
      {action}
    </button>
  </div>
)

/**
 * Card-style error fallback
 */
export const CardErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  context = 'component' 
}) => (
  <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
    <div className="flex items-center mb-4">
      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">Error in {context}</h3>
        <p className="text-sm text-gray-600">This component encountered an error</p>
      </div>
    </div>
    
    <p className="text-gray-700 mb-4">{error.message}</p>
    
    <div className="flex space-x-3">
      <button
        onClick={resetError}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        Retry
      </button>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
      >
        Reload Page
      </button>
    </div>
  </div>
)

/**
 * Hook for programmatic error reporting
 */
export const useErrorReporting = (context?: { component?: string; page?: string }) => {
  return React.useCallback((error: Error, additionalContext?: Record<string, any>) => {
    // Add breadcrumb
    addBreadcrumb(
      `Manual error report from ${context?.component || 'component'}`,
      'error',
      'error',
      additionalContext
    )

    // Record metric
    recordMetric('react.manual_errors', 1, 'count', {
      component: context?.component || 'unknown',
      page: context?.page || 'unknown',
      error_type: error.name,
    })

    // Re-throw to be caught by error boundary
    throw error
  }, [context])
}

/**
 * Hook for error boundary state management
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = React.useCallback(() => {
    setError(null)
  }, [])
  
  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])
  
  return { error, resetError, captureError }
}

/**
 * Higher-order component for adding error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<React.ComponentProps<typeof ErrorBoundary>>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      context={{
        component: Component.displayName || Component.name,
        ...errorBoundaryProps?.context,
      }}
      fallback={SimpleErrorFallback}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Error boundary for specific features
 */
export const FeatureErrorBoundary: React.FC<{
  children: React.ReactNode
  feature: string
  fallback?: React.ComponentType<ErrorFallbackProps>
}> = ({ children, feature, fallback = SimpleErrorFallback }) => (
  <ErrorBoundary
    context={{
      component: `feature-${feature}`,
      feature,
    }}
    fallback={fallback}
    onError={(error, errorInfo) => {
      addBreadcrumb(
        `Feature error in ${feature}`,
        'feature',
        'error',
        { errorInfo: errorInfo.componentStack.substring(0, 100) }
      )
    }}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Error boundary for API-related components
 */
export const ApiErrorBoundary: React.FC<{
  children: React.ReactNode
  endpoint?: string
  fallback?: React.ComponentType<ErrorFallbackProps>
}> = ({ children, endpoint, fallback = CardErrorFallback }) => (
  <ErrorBoundary
    context={{
      component: 'api-component',
      feature: `api-${endpoint}`,
    }}
    fallback={fallback}
    onError={(error) => {
      recordMetric('api.frontend_errors', 1, 'count', {
        endpoint: endpoint || 'unknown',
        error_type: error.name,
      })
    }}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Error boundary for page components
 */
export const PageErrorBoundary: React.FC<{
  children: React.ReactNode
  page: string
}> = ({ children, page }) => (
  <ErrorBoundary
    context={{
      component: 'page',
      page,
    }}
    onError={(error) => {
      recordMetric('page.errors', 1, 'count', {
        page,
        error_type: error.name,
      })
    }}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      addBreadcrumb(
        'Unhandled promise rejection',
        'error',
        'error',
        { reason: event.reason?.toString() }
      )

      recordMetric('js.unhandled_rejections', 1, 'count', {
        reason: event.reason?.name || 'unknown',
      })
    })

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      addBreadcrumb(
        'Uncaught JavaScript error',
        'error',
        'error',
        { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      )

      recordMetric('js.uncaught_errors', 1, 'count', {
        error_type: event.error?.name || 'unknown',
      })
    })
  }
}

export default {
  SimpleErrorFallback,
  CardErrorFallback,
  useErrorReporting,
  useErrorBoundary,
  withErrorBoundary,
  FeatureErrorBoundary,
  ApiErrorBoundary,
  PageErrorBoundary,
  setupGlobalErrorHandling,
}