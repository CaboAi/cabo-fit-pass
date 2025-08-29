import { Suspense } from 'react'
import MonitoringDashboard from '@/components/admin/monitoring-dashboard'
import { PageErrorBoundary } from '@/components/error-boundary-enhanced'

export default function MonitoringPage() {
  return (
    <PageErrorBoundary page="admin-monitoring">
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<MonitoringLoadingSkeleton />}>
          <MonitoringDashboard />
        </Suspense>
      </div>
    </PageErrorBoundary>
  )
}

function MonitoringLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>

      {/* System health skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="text-center py-8">
          <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}