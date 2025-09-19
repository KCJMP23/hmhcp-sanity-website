'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Database, 
  Clock, 
  Zap, 
  RefreshCw, 
  TrendingUp,
  Server,
  Timer
} from 'lucide-react'
// Removed sonner dependency - using console.log for notifications
import { logger } from '@/lib/logger';

interface CacheStats {
  totalKeys: number
  memoryUsage: string
  hitRate?: number
}

interface PerformanceMetrics {
  averageLoadTime: number
  cacheHitRate: number
  totalRequests: number
  errorRate: number
}

interface NavigationMetrics {
  location: string
  requests: number
  averageLoadTime: number
  cacheHits: number
  lastAccessed: string
}

interface NavigationPerformanceMonitorProps {
  navigationId?: string
}

export function NavigationPerformanceMonitor({ navigationId }: NavigationPerformanceMonitorProps) {
  const [cacheStats, setCacheStats] = useState<CacheStats>({ totalKeys: 0, memoryUsage: '0B' })
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageLoadTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    errorRate: 0
  })
  const [navigationMetrics, setNavigationMetrics] = useState<NavigationMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPerformanceData()
    
    // Set up periodic refresh
    const interval = setInterval(fetchPerformanceData, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [navigationId])

  const fetchPerformanceData = async () => {
    try {
      // Fetch cache statistics
      const cacheResponse = await fetch('/api/admin/performance/navigation/cache')
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json()
        setCacheStats(cacheData)
      }

      // Fetch performance metrics
      const metricsResponse = await fetch('/api/admin/performance/navigation/metrics')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setPerformanceMetrics(metricsData.overall)
        setNavigationMetrics(metricsData.byLocation || [])
      }
    } catch (error) {
      logger.error('Failed to fetch performance data:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/performance/navigation/cache', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('Navigation cache cleared successfully')
        await fetchPerformanceData()
      } else {
        throw new Error('Failed to clear cache')
      }
    } catch (error) {
      console.error('Failed to clear cache')
    } finally {
      setRefreshing(false)
    }
  }

  const preloadCache = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/performance/navigation/preload', {
        method: 'POST'
      })
      
      if (response.ok) {
        console.log('Navigation cache preloaded successfully')
        await fetchPerformanceData()
      } else {
        throw new Error('Failed to preload cache')
      }
    } catch (error) {
      console.error('Failed to preload cache')
    } finally {
      setRefreshing(false)
    }
  }

  const getPerformanceColor = (value: number, type: 'loadTime' | 'hitRate' | 'errorRate') => {
    switch (type) {
      case 'loadTime':
        if (value < 100) return 'text-blue-600'
        if (value < 500) return 'text-blue-600'
        return 'text-red-600'
      case 'hitRate':
        if (value > 80) return 'text-blue-600'
        if (value > 60) return 'text-blue-600'
        return 'text-red-600'
      case 'errorRate':
        if (value < 1) return 'text-blue-600'
        if (value < 5) return 'text-blue-600'
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 w-3/4"></div>
                  <div className="h-8 bg-gray-200 w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor navigation performance and cache efficiency
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            disabled={refreshing}
          >
            <Database className="h-4 w-4" />
            Clear Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={preloadCache}
            disabled={refreshing}
          >
            <Zap className="h-4 w-4" />
            Preload
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Load Time</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.averageLoadTime, 'loadTime')}`}>
                  {performanceMetrics.averageLoadTime.toFixed(0)}ms
                </p>
              </div>
              <Timer className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.cacheHitRate, 'hitRate')}`}>
                  {performanceMetrics.cacheHitRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Progress value={performanceMetrics.cacheHitRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">
                  {performanceMetrics.totalRequests.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.errorRate, 'errorRate')}`}>
                  {performanceMetrics.errorRate.toFixed(2)}%
                </p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Statistics
          </CardTitle>
          <CardDescription>
            Redis cache performance and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cached Items</p>
              <p className="text-2xl font-bold">{cacheStats.totalKeys}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">{cacheStats.memoryUsage}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Hit Rate</p>
              <p className="text-2xl font-bold">
                {cacheStats.hitRate ? `${cacheStats.hitRate.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Performance by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Location</CardTitle>
          <CardDescription>
            Individual navigation performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {navigationMetrics.length > 0 ? (
              navigationMetrics.map((metric) => (
                <div key={metric.location} className="flex items-center justify-between p-3 border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {metric.location}
                    </Badge>
                    <div>
                      <p className="font-medium">{metric.requests} requests</p>
                      <p className="text-sm text-muted-foreground">
                        Last accessed: {new Date(metric.lastAccessed).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Avg Load</p>
                      <p className={`font-bold ${getPerformanceColor(metric.averageLoadTime, 'loadTime')}`}>
                        {metric.averageLoadTime.toFixed(0)}ms
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Cache Hits</p>
                      <p className="font-bold">{metric.cacheHits}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No performance data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}