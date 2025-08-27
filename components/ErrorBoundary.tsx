'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { reportError, addBreadcrumb, recordMetric } from '@/lib/monitoring/sentry-integration'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  context?: {
    component?: string
    userId?: string
    page?: string
    feature?: string
  }
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)

    // Add breadcrumb for error context
    addBreadcrumb(
      `Error caught by ErrorBoundary in ${this.props.context?.component || 'unknown component'}`,
      'error',
      'error',
      {
        componentStack: errorInfo.componentStack.substring(0, 200),
        page: this.props.context?.page,
        feature: this.props.context?.feature,
      }
    )

    // Report error to monitoring with enhanced context
    reportError(error, {
      component: this.props.context?.component || 'react-component',
      userId: this.props.context?.userId,
      metadata: {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
        page: this.props.context?.page,
        feature: this.props.context?.feature,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
      }
    }, 'error')

    // Record error metrics
    recordMetric('react.errors', 1, 'count', {
      component: this.props.context?.component || 'unknown',
      page: this.props.context?.page || 'unknown',
      error_type: error.name,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined })
    
    // Record recovery attempt
    recordMetric('react.error_recovery', 1, 'count', {
      component: this.props.context?.component || 'unknown',
      page: this.props.context?.page || 'unknown',
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-red-200 shadow-sm max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
              
              <button
                onClick={this.resetError}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}