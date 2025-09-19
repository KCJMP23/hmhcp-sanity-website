/**
 * Memory Monitor Dashboard Component
 * Real-time memory usage and pagination performance monitoring
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Activity,
  Database,
  HardDrive,
  Info,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemoryStatus {
  used: number
  total: number
  percentage: number
  rss: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
}

interface MemoryReport {
  status: MemoryStatus
  allocations: {
    active: number
    total: number
    byOperation: Record<string, number>
  }
  pressure: number
  strategy: string
  trends: {
    current: MemoryStatus
    average: number
    trend: 'increasing' | 'stable' | 'decreasing'
    prediction: number
  }
  recommendations: string[]
}

interface CursorStats {
  cacheSize: number
  cacheHitRate: number
  averageCursorSize: number
}

interface MemoryMonitorProps {
  className?: string
  refreshInterval?: number
  showAlerts?: boolean
  showRecommendations?: boolean
  onMemoryAlert?: (status: MemoryStatus) => void
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  className,
  refreshInterval = 5000,
  showAlerts = true,
  showRecommendations = true,
  onMemoryAlert
}) => {
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus | null>(null)
  const [memoryReport, setMemoryReport] = useState<MemoryReport | null>(null)
  const [cursorStats, setCursorStats] = useState<CursorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch memory status
  const fetchMemoryStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/memory?action=status')
      if (!response.ok) throw new Error('Failed to fetch memory status')
      
      const data = await response.json()
      setMemoryStatus(data.status)
      
      // Trigger alert if memory is high
      if (data.status.percentage > 70 && onMemoryAlert) {
        onMemoryAlert(data.status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memory status')
    }
  }, [onMemoryAlert])

  // Fetch detailed report
  const fetchMemoryReport = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/memory?action=report')
      if (!response.ok) throw new Error('Failed to fetch memory report')
      
      const data = await response.json()
      setMemoryReport(data)
    } catch (err) {
      console.error('Failed to fetch memory report:', err)
    }
  }, [])

  // Fetch cursor stats
  const fetchCursorStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/memory?action=cursor-stats')
      if (!response.ok) throw new Error('Failed to fetch cursor stats')
      
      const data = await response.json()
      setCursorStats(data)
    } catch (err) {
      console.error('Failed to fetch cursor stats:', err)
    }
  }, [])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchMemoryStatus(),
      fetchMemoryReport(),
      fetchCursorStats()
    ])
    setLoading(false)
  }, [fetchMemoryStatus, fetchMemoryReport, fetchCursorStats])

  // Trigger garbage collection
  const triggerGC = async () => {
    try {
      const response = await fetch('/api/admin/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'gc' })
      })
      
      if (!response.ok) throw new Error('Failed to trigger GC')
      
      const data = await response.json()
      alert(`Garbage collection completed. Freed ${data.freedMB} MB`)
      fetchAllData()
    } catch (err) {
      alert('Failed to trigger garbage collection')
    }
  }

  // Clear cursor cache
  const clearCursorCache = async () => {
    try {
      const response = await fetch('/api/admin/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cursor-cache' })
      })
      
      if (!response.ok) throw new Error('Failed to clear cursor cache')
      
      alert('Cursor cache cleared successfully')
      fetchAllData()
    } catch (err) {
      alert('Failed to clear cursor cache')
    }
  }

  // Setup auto-refresh
  useEffect(() => {
    fetchAllData()

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchAllData])

  // Get memory status color
  const getMemoryColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-600'
    if (percentage < 70) return 'text-yellow-600'
    if (percentage < 85) return 'text-orange-600'
    return 'text-red-600'
  }

  // Get strategy badge variant
  const getStrategyVariant = (strategy: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (strategy) {
      case 'none': return 'default'
      case 'reduce_batch_size': return 'secondary'
      case 'force_streaming': return 'outline'
      case 'reject_operations': return 'destructive'
      default: return 'default'
    }
  }

  // Format bytes
  const formatBytes = (bytes: number): string => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Memory Monitor</h2>
          <Badge variant={autoRefresh ? 'default' : 'secondary'}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Memory Status Alert */}
      {showAlerts && memoryStatus && memoryStatus.percentage > 70 && (
        <Alert variant={memoryStatus.percentage > 85 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Memory Usage</AlertTitle>
          <AlertDescription>
            Memory usage is at {memoryStatus.percentage.toFixed(1)}%. 
            Consider reducing batch sizes or clearing caches.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="cursors">Cursors</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Memory Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={getMemoryColor(memoryStatus?.percentage || 0)}>
                    {memoryStatus?.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={memoryStatus?.percentage || 0} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatBytes(memoryStatus?.used || 0)} / {formatBytes(memoryStatus?.total || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Heap Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Heap Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(memoryStatus?.heapUsed || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total: {formatBytes(memoryStatus?.heapTotal || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  External: {formatBytes(memoryStatus?.external || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Degradation Strategy Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Degradation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={getStrategyVariant(memoryReport?.strategy || 'none')}
                  className="text-xs"
                >
                  {memoryReport?.strategy || 'none'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Pressure: {(memoryReport?.pressure || 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {showRecommendations && memoryReport?.recommendations && memoryReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {memoryReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 text-blue-600" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Memory Allocations</CardTitle>
              <CardDescription>
                Current memory allocations by operation type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Allocations:</span>
                  <span className="font-medium">
                    {memoryReport?.allocations.active || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Allocations:</span>
                  <span className="font-medium">
                    {memoryReport?.allocations.total || 0}
                  </span>
                </div>
              </div>

              {memoryReport?.allocations.byOperation && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">By Operation:</h4>
                  {Object.entries(memoryReport.allocations.byOperation).map(([op, count]) => (
                    <div key={op} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{op}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Trends</CardTitle>
              <CardDescription>
                Memory usage patterns and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trend:</span>
                  <div className="flex items-center space-x-2">
                    {memoryReport?.trends.trend === 'increasing' ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : memoryReport?.trends.trend === 'decreasing' ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-600" />
                    )}
                    <Badge variant="outline">
                      {memoryReport?.trends.trend || 'stable'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage:</span>
                    <span className="font-medium">
                      {memoryReport?.trends.current.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Usage:</span>
                    <span className="font-medium">
                      {memoryReport?.trends.average.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Predicted Usage:</span>
                    <span className="font-medium">
                      {memoryReport?.trends.prediction.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cursors Tab */}
        <TabsContent value="cursors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursor Cache Statistics</CardTitle>
              <CardDescription>
                Performance metrics for cursor-based pagination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache Size:</span>
                  <span className="font-medium">
                    {cursorStats?.cacheSize || 0} cursors
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hit Rate:</span>
                  <span className="font-medium">
                    {((cursorStats?.cacheHitRate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Cursor Size:</span>
                  <span className="font-medium">
                    {cursorStats?.averageCursorSize.toFixed(0) || 0} bytes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Management Actions</CardTitle>
              <CardDescription>
                Manual memory optimization controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={triggerGC}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Trigger Garbage Collection
                </Button>
                <p className="text-xs text-muted-foreground ml-6">
                  Force garbage collection to free unused memory
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={clearCursorCache}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear Cursor Cache
                </Button>
                <p className="text-xs text-muted-foreground ml-6">
                  Remove all cached cursors to free memory
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  These actions require super admin privileges and may temporarily affect performance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MemoryMonitor