'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CheckCircle, RefreshCw, Trash2, Activity, Database, Clock, Zap } from 'lucide-react'

interface CacheMetrics {
  hitRate: number
  missRate: number
  avgLoadTime: number
  p99LoadTime: number
  errorRate: number
}

interface CacheStatus {
  redisConnected: boolean
  memoryCacheSize: number
  metrics: CacheMetrics
}

interface CacheHealth {
  hitRateOk: boolean
  loadTimeOk: boolean
  p99LoadTimeOk: boolean
  errorRateOk: boolean
  redisOk: boolean
}

interface CacheResponse {
  cache: CacheStatus
  targets: {
    hitRate: number
    avgLoadTime: number
    p99LoadTime: number
    errorRate: number
  }
  health: CacheHealth
  timestamp: string
}

export function NavigationCacheMonitor() {
  const [cacheData, setCacheData] = useState<CacheResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [warming, setWarming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCacheStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/navigations/cache/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch cache status')
      }
      
      const data = await response.json()
      setCacheData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const warmCache = async () => {
    try {
      setWarming(true)
      setError(null)
      
      const response = await fetch('/api/admin/navigations/cache/warm', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to warm cache')
      }
      
      // Refresh status after warming
      await fetchCacheStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setWarming(false)
    }
  }

  const clearCache = async () => {
    try {
      setClearing(true)
      setError(null)
      
      const response = await fetch('/api/admin/navigations/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Clear all
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear cache')
      }
      
      // Refresh status after clearing
      await fetchCacheStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    fetchCacheStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCacheStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getHealthIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle className="h-4 w-4 text-blue-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    )
  }

  const getHealthColor = (healthy: boolean) => {
    return healthy ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Navigation Cache Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Navigation Cache Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchCacheStatus} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!cacheData) {
    return null
  }

  const { cache, targets, health } = cacheData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Navigation Cache Monitor
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={warmCache}
              disabled={warming}
            >
              {warming ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Warm Cache
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearCache}
              disabled={clearing}
            >
              {clearing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Cache
            </Button>
            <Button size="sm" variant="ghost" onClick={fetchCacheStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Health */}
        <div>
          <h3 className="text-sm font-semibold mb-3">System Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              {getHealthIcon(health.redisOk)}
              <span className="text-sm">Redis Connection</span>
              <Badge className={getHealthColor(health.redisOk)}>
                {health.redisOk ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getHealthIcon(health.hitRateOk)}
              <span className="text-sm">Hit Rate</span>
              <Badge className={getHealthColor(health.hitRateOk)}>
                {health.hitRateOk ? 'Good' : 'Poor'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getHealthIcon(health.loadTimeOk)}
              <span className="text-sm">Load Time</span>
              <Badge className={getHealthColor(health.loadTimeOk)}>
                {health.loadTimeOk ? 'Fast' : 'Slow'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Metrics */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Performance Metrics</h3>
          <div className="space-y-4">
            {/* Hit Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Cache Hit Rate</span>
                <span className="text-sm text-muted-foreground">
                  {cache.metrics.hitRate.toFixed(1)}% / {targets.hitRate}%
                </span>
              </div>
              <Progress 
                value={cache.metrics.hitRate} 
                className="h-2"
              />
            </div>

            {/* Average Load Time */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Avg Load Time</span>
                <span className="text-sm text-muted-foreground">
                  {cache.metrics.avgLoadTime.toFixed(1)}ms / {targets.avgLoadTime}ms
                </span>
              </div>
              <Progress 
                value={Math.min((cache.metrics.avgLoadTime / targets.avgLoadTime) * 100, 100)} 
                className="h-2"
              />
            </div>

            {/* P99 Load Time */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">P99 Load Time</span>
                <span className="text-sm text-muted-foreground">
                  {cache.metrics.p99LoadTime.toFixed(1)}ms / {targets.p99LoadTime}ms
                </span>
              </div>
              <Progress 
                value={Math.min((cache.metrics.p99LoadTime / targets.p99LoadTime) * 100, 100)} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Cache Statistics */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Cache Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cache.metrics.hitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cache.metrics.avgLoadTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Load</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cache.metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cache.memoryCacheSize}
              </div>
              <div className="text-xs text-muted-foreground">Memory Cache</div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(cacheData.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}