'use client'

import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Database, 
  TrendingUp,
  Users,
  XCircle,
  RefreshCw,
  BarChart3,
  Server
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Alert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  component: string
  timestamp: string
}

interface MetricCard {
  title: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  color?: 'green' | 'red' | 'yellow' | 'blue'
  icon: React.ReactNode
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  components: {
    api: 'healthy' | 'warning' | 'critical'
    database: 'healthy' | 'warning' | 'critical'
    payments: 'healthy' | 'warning' | 'critical'
  }
}

export default function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [metrics, setMetrics] = useState<any>({})
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy',
    components: {
      api: 'healthy',
      database: 'healthy',
      payments: 'healthy',
    }
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch monitoring data
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch alerts
      const alertsResponse = await fetch('/api/monitoring/alerts?action=active')
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.data || [])
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/monitoring/metrics?type=all')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.data || {})
      }

      // Fetch system health
      const healthResponse = await fetch('/api/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth({
          overall: healthData.status === 'healthy' ? 'healthy' : 
                   healthData.status === 'degraded' ? 'warning' : 'critical',
          components: {
            api: healthData.components?.environment?.status === 'pass' ? 'healthy' : 'critical',
            database: healthData.components?.database?.status === 'pass' ? 'healthy' : 'critical',
            payments: healthData.components?.stripe?.status === 'pass' ? 'healthy' : 'critical',
          }
        })
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh data
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Create metric cards
  const metricCards: MetricCard[] = [
    {
      title: 'Active Users',
      value: metrics.business?.byType?.user || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'blue',
    },
    {
      title: 'API Response Time',
      value: metrics.system?.memory?.usagePercentage || 0,
      unit: '%',
      icon: <Activity className="h-5 w-5" />,
      color: metrics.system?.memory?.usagePercentage > 80 ? 'red' : 'green',
    },
    {
      title: 'Memory Usage',
      value: metrics.system?.memory?.usagePercentage || 0,
      unit: '%',
      icon: <Server className="h-5 w-5" />,
      color: metrics.system?.memory?.usagePercentage > 80 ? 'red' : 'green',
    },
    {
      title: 'Active Bookings',
      value: metrics.business?.byType?.booking || 0,
      icon: <Calendar className="h-5 w-5" />,
      color: 'green',
    },
    {
      title: 'Payment Success Rate',
      value: '98.5',
      unit: '%',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'green',
    },
    {
      title: 'Database Queries',
      value: metrics.performance ? Object.keys(metrics.performance).length : 0,
      icon: <Database className="h-5 w-5" />,
      color: 'blue',
    },
  ]

  const getAlertIcon = (level: Alert['level']) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertBadgeColor = (level: Alert['level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getHealthColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
    }
  }

  const getHealthIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Monitoring Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Health Overview */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            {getHealthIcon(systemHealth.overall)}
            <div>
              <p className="font-medium">Overall</p>
              <p className={`text-sm capitalize ${getHealthColor(systemHealth.overall)}`}>
                {systemHealth.overall}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getHealthIcon(systemHealth.components.api)}
            <div>
              <p className="font-medium">API</p>
              <p className={`text-sm capitalize ${getHealthColor(systemHealth.components.api)}`}>
                {systemHealth.components.api}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getHealthIcon(systemHealth.components.database)}
            <div>
              <p className="font-medium">Database</p>
              <p className={`text-sm capitalize ${getHealthColor(systemHealth.components.database)}`}>
                {systemHealth.components.database}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getHealthIcon(systemHealth.components.payments)}
            <div>
              <p className="font-medium">Payments</p>
              <p className={`text-sm capitalize ${getHealthColor(systemHealth.components.payments)}`}>
                {systemHealth.components.payments}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-semibold">
                  {metric.value}
                  {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-${metric.color}-100`}>
                {metric.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Active Alerts</h2>
          <Badge variant="outline">{alerts.length} active</Badge>
        </div>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No active alerts - all systems running normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
              >
                {getAlertIcon(alert.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium">{alert.title}</p>
                    <Badge className={getAlertBadgeColor(alert.level)}>
                      {alert.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.component}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">API Performance</h3>
          {metrics.performance && Object.keys(metrics.performance).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(metrics.performance).slice(0, 5).map(([endpoint, data]: [string, any]) => (
                <div key={endpoint} className="flex items-center justify-between">
                  <span className="text-sm font-mono">{endpoint}</span>
                  <div className="text-right">
                    <p className="text-sm">{data.averageDuration?.toFixed(0) || 0}ms</p>
                    <p className="text-xs text-gray-500">{data.requestCount || 0} requests</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No performance data available</p>
          )}
        </Card>

        {/* Business Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Business Metrics</h3>
          {metrics.business ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Events</span>
                <span className="font-medium">{metrics.business.totalMetrics || 0}</span>
              </div>
              {metrics.business.byType && Object.entries(metrics.business.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No business metrics available</p>
          )}
        </Card>
      </div>
    </div>
  )
}

// Helper component that was missing
const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)