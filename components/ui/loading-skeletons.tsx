'use client'

import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  )
}

export function ClassCardSkeleton() {
  return (
    <div className="card-fitness-workout p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-lg" />

      {/* Time and Duration */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Capacity bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Credit cost */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-8" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="card-fitness p-6">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function AnalyticsChartSkeleton() {
  return (
    <div className="card-fitness p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Chart bars */}
      <div className="grid grid-cols-8 items-end gap-2 h-40 mb-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton 
              className="w-full rounded-t" 
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
      
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function TopGymsSkeleton() {
  return (
    <div className="card-fitness p-6">
      <Skeleton className="h-6 w-40 mb-6" />
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UserListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(10).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b">
        {Array(columns).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          {Array(columns).fill(0).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}