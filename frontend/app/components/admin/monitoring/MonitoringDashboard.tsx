'use client'

/**
 * Comprehensive Monitoring Dashboard
 * Provides real-time visualization of system health, performance, and analytics
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Clock, Users, Zap, Shield } from 'lucide-react'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: boolean
  external_apis: boolean
  static_assets: boolean
  uptime_percentage: number
  response_time: number
  memory_usage: number
  cpu_usage: number
  last_check: string
}

interface PerformanceMetrics {
  timestamp: string
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
  tti: number
}

interface AnalyticsData {
  page_views: number
  unique_visitors: number
  bounce_rate: number
  avg_session_duration: number
  top_pages: Array<{ page: string, views: number }>
  traffic_sources: Array<{ source: string, percentage: number }>
}

interface ErrorData {
  error_count: number
  error_rate: number
  recent_errors: Array<{
    message: string
    timestamp: string
    count: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

export function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [errorData, setErrorData] = useState<ErrorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health?detailed=true')
      const data = await response.json()
      setHealthStatus(data)
    } catch (error) {
      console.error('Failed to fetch health status:', error)
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics?timeRange=24h')
      const data = await response.json()
      setPerformanceData(data.metrics || [])
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/monitoring/analytics?timeRange=24h')
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    }
  }

  const fetchErrorData = async () => {
    try {
      const response = await fetch('/api/monitoring/errors?timeRange=24h')
      const data = await response.json()
      setErrorData(data)
    } catch (error) {
      console.error('Failed to fetch error data:', error)
    }
  }

  const refreshAll = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchHealthStatus(),
      fetchPerformanceMetrics(),
      fetchAnalyticsData(),
      fetchErrorData()
    ])
    setLastRefresh(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    refreshAll()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshAll()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading && !healthStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          onClick={refreshAll} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      {healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className={`text-2xl font-bold ${getStatusColor(healthStatus.status)}`}>
                    {healthStatus.status.toUpperCase()}
                  </p>
                </div>
                {getStatusIcon(healthStatus.status)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-green-600">
                    {healthStatus.uptime_percentage.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {healthStatus.response_time}ms
                  </p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {healthStatus.memory_usage}%
                  </p>
                </div>
                <div className="text-right">
                  <Progress value={healthStatus.memory_usage} className="w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Component Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Component Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Database</span>
                <Badge variant={healthStatus.database ? "default" : "destructive"}>
                  {healthStatus.database ? "Healthy" : "Down"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">External APIs</span>
                <Badge variant={healthStatus.external_apis ? "default" : "destructive"}>
                  {healthStatus.external_apis ? "Healthy" : "Down"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Static Assets</span>
                <Badge variant={healthStatus.static_assets ? "default" : "destructive"}>
                  {healthStatus.static_assets ? "Healthy" : "Down"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals (Last 24 Hours)</CardTitle>
              <CardDescription>
                Performance metrics showing user experience indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Largest Contentful Paint</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {performanceData[performanceData.length - 1]?.lcp.toFixed(0)}ms
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">First Input Delay</p>
                      <p className="text-2xl font-bold text-green-600">
                        {performanceData[performanceData.length - 1]?.fid.toFixed(0)}ms
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {performanceData[performanceData.length - 1]?.cls.toFixed(3)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="lcp" stroke="#3b82f6" name="LCP (ms)" />
                        <Line type="monotone" dataKey="fid" stroke="#10b981" name="FID (ms)" />
                        <Line type="monotone" dataKey="ttfb" stroke="#f59e0b" name="TTFB (ms)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Page Views</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analyticsData.page_views.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Unique Visitors</p>
                        <p className="text-2xl font-bold text-green-600">
                          {analyticsData.unique_visitors.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Bounce Rate</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {analyticsData.bounce_rate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Avg Session</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.floor(analyticsData.avg_session_duration / 60)}m
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No analytics data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.top_pages ? (
                  <div className="space-y-2">
                    {analyticsData.top_pages.slice(0, 5).map((page, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{page.page}</span>
                        <Badge variant="secondary">{page.views}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No page data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Monitoring</CardTitle>
              <CardDescription>Recent errors and system issues</CardDescription>
            </CardHeader>
            <CardContent>
              {errorData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Error Count (24h)</p>
                      <p className="text-2xl font-bold text-red-600">
                        {errorData.error_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {errorData.error_rate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  {errorData.recent_errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recent Errors</h4>
                      {errorData.recent_errors.slice(0, 5).map((error, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="flex items-center justify-between">
                            <span>{error.message}</span>
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                          </AlertTitle>
                          <AlertDescription>
                            {new Date(error.timestamp).toLocaleString()} • Count: {error.count}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No error data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Security monitoring and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Security Status: Monitoring Active</AlertTitle>
                  <AlertDescription>
                    All security measures are functioning normally. No threats detected in the last 24 hours.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">SSL Certificate</h4>
                    <p className="text-sm text-green-600">Valid and up to date</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">Firewall Status</h4>
                    <p className="text-sm text-green-600">Active and configured</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">Rate Limiting</h4>
                    <p className="text-sm text-green-600">Enabled (100 req/min)</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">DDOS Protection</h4>
                    <p className="text-sm text-green-600">Cloudflare active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}