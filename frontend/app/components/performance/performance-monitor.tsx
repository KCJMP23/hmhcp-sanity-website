'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Database, 
  HardDrive, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { getPerformanceStats } from '@/lib/performance/memory-optimization'
import { getCacheMetrics } from '@/lib/performance/cache-strategy'
import { analyzeBundleSize, checkPerformanceBudget, routePreloadManager } from '@/lib/performance/route-optimization'

interface PerformanceMetrics {
  memory: any
  connections: any
  cache: any
  bundle: any
  budget: any
  routes: any
  webVitals: any
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchMetrics = async () => {
    try {
      // Get performance stats from various sources
      const perfStats = getPerformanceStats()
      const cacheStats = getCacheMetrics()
      const bundleStats = analyzeBundleSize()
      const budgetStats = checkPerformanceBudget()
      const routeStats = routePreloadManager.getStats()
      
      // Get Web Vitals if available
      let webVitals = null
      if (typeof window !== 'undefined' && 'web-vital' in window) {
        webVitals = await getWebVitals()
      }

      setMetrics({
        memory: perfStats.memory,
        connections: perfStats.connections,
        cache: cacheStats,
        bundle: bundleStats,
        budget: budgetStats,
        routes: routeStats,
        webVitals
      })
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 5000) // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getWebVitals = async () => {
    return new Promise((resolve) => {
      const webVitalsModuleName = 'web-vitals'
      import(webVitalsModuleName).then((webVitals: any) => {
        const vitals: any = {}
        
        if (webVitals?.getCLS) {
          webVitals.getCLS((metric: any) => { vitals.cls = metric.value })
          webVitals.getFID?.((metric: any) => { vitals.fid = metric.value })
          webVitals.getLCP?.((metric: any) => { vitals.lcp = metric.value })
          webVitals.getFCP?.((metric: any) => { vitals.fcp = metric.value })
          webVitals.getTTFB?.((metric: any) => { vitals.ttfb = metric.value })
        }
        
        setTimeout(() => resolve(vitals), 100)
      }).catch(() => {
        resolve({})
      })
    })
  }

  const getStatusBadge = (withinBudget: boolean) => {
    return withinBudget ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Over Budget
      </Badge>
    )
  }

  const getMemoryStatus = (utilization: number) => {
    if (utilization < 70) return 'text-green-600'
    if (utilization < 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">Real-time performance metrics and optimization status</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
          </Button>
          <Button onClick={fetchMetrics} size="sm">
            Refresh Now
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="bundle">Bundle</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Memory Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.memory?.current?.utilization || '0'}%
                </div>
                <Progress 
                  value={parseFloat(metrics?.memory?.current?.utilization || '0')} 
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-2">
                  {metrics?.memory?.current?.heapUsedMB || '0'} MB / {metrics?.memory?.current?.heapTotalMB || '0'} MB
                </p>
              </CardContent>
            </Card>

            {/* Connections Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  DB Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.connections?.activeConnections || 0}/{metrics?.connections?.maxConnections || 5}
                </div>
                <Progress 
                  value={metrics?.connections?.utilization || 0} 
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-2">
                  {metrics?.connections?.utilization?.toFixed(1) || '0'}% pool utilization
                </p>
              </CardContent>
            </Card>

            {/* Cache Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Cache Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.cache?.cacheSize || 0} entries
                </div>
                <Progress 
                  value={parseFloat(metrics?.cache?.cacheUtilization || '0')} 
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-2">
                  ~{metrics?.cache?.approximateSizeKB || '0'} KB cached
                </p>
              </CardContent>
            </Card>

            {/* Bundle Size Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Bundle Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.bundle?.totalKB || '0'} KB
                </div>
                <div className="mt-2">
                  {metrics?.bundle?.withinBudget ? (
                    <Badge className="bg-green-100 text-green-800">
                      Within Budget
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      Over Budget
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Target: &lt; 200 KB
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Alerts */}
          {metrics?.memory?.current?.utilization > 85 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">High Memory Usage</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Memory utilization is at {metrics?.memory?.current?.utilization || 0}%. Consider optimizing memory usage or increasing heap size.
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Details</CardTitle>
              <CardDescription>Detailed memory usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.memory?.current ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Heap Used</p>
                      <p className="text-xl font-bold">{metrics?.memory?.current.heapUsedMB} MB</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Heap Total</p>
                      <p className="text-xl font-bold">{metrics?.memory?.current.heapTotalMB} MB</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">External</p>
                      <p className="text-xl font-bold">{metrics?.memory?.current.externalMB} MB</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilization</p>
                      <p className={`text-xl font-bold ${getMemoryStatus(parseFloat(metrics?.memory?.current.utilization))}`}>
                        {metrics?.memory?.current.utilization}%
                      </p>
                    </div>
                  </div>
                  
                  {metrics?.memory?.average && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-600">Average Heap Usage</p>
                      <p className="text-lg font-semibold">{metrics?.memory?.average.heapUsedMB} MB</p>
                      <p className="text-xs text-gray-500">Based on {metrics?.memory?.average.measurements} measurements</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Memory metrics not available (client-side only)</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Cache utilization and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Entries</p>
                    <p className="text-xl font-bold">{metrics?.cache?.cacheSize || 0} / {metrics?.cache?.maxCacheSize || 1000}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Utilization</p>
                    <p className="text-xl font-bold">{metrics?.cache?.cacheUtilization || '0%'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expired Entries</p>
                    <p className="text-xl font-bold">{metrics?.cache?.expiredEntries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approximate Size</p>
                    <p className="text-xl font-bold">{metrics?.cache?.approximateSizeKB || '0'} KB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundle Tab */}
        <TabsContent value="bundle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Analysis</CardTitle>
              <CardDescription>JavaScript bundle size breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.bundle ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Main Bundle</p>
                      <p className="text-xl font-bold">{metrics?.bundle.mainBundleKB} KB</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Chunks</p>
                      <p className="text-xl font-bold">{metrics?.bundle.chunksKB} KB</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Other Scripts</p>
                      <p className="text-xl font-bold">{metrics?.bundle.otherKB} KB</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Size</p>
                      <p className="text-xl font-bold">{metrics?.bundle.totalKB} KB</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-600 mb-2">Budget Status</p>
                    {metrics?.budget && Object.entries(metrics?.budget).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <span className="text-sm capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{value.used}</span>
                          {getStatusBadge(value.withinBudget)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Bundle metrics not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>User experience metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.webVitals ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">LCP (Largest Contentful Paint)</p>
                      <p className="text-xl font-bold">{metrics?.webVitals.lcp?.toFixed(2) || 'N/A'} ms</p>
                      <p className="text-xs text-gray-500">Target: &lt; 2500ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">FID (First Input Delay)</p>
                      <p className="text-xl font-bold">{metrics?.webVitals.fid?.toFixed(2) || 'N/A'} ms</p>
                      <p className="text-xs text-gray-500">Target: &lt; 100ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">CLS (Cumulative Layout Shift)</p>
                      <p className="text-xl font-bold">{metrics?.webVitals.cls?.toFixed(3) || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Target: &lt; 0.1</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">FCP (First Contentful Paint)</p>
                      <p className="text-xl font-bold">{metrics?.webVitals.fcp?.toFixed(2) || 'N/A'} ms</p>
                      <p className="text-xs text-gray-500">Target: &lt; 1800ms</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Web Vitals data will be available after page interaction</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}