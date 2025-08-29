'use client'

import { useState, useEffect } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load API docs:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-48"></div>
        </div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Failed to Load API Documentation
          </h2>
          <p className="text-gray-600">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Cabo Fit Pass API Documentation</h1>
          <p className="mt-2 text-orange-100">
            Complete API reference for integrating with our fitness booking platform
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <SwaggerUI 
          spec={spec}
          deepLinking={true}
          displayOperationId={false}
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          defaultModelRendering="example"
          displayRequestDuration={true}
          docExpansion="list"
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
        />
      </div>
    </div>
  )
}