'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity, Users, Eye, Clock, MapPin, Smartphone, Monitor, Tablet,
  Zap, AlertCircle, CheckCircle, TrendingUp, Globe
} from 'lucide-react'
import { format } from 'date-fns'

interface RealTimeMonitoringWidgetProps {
  data: {
    realTime: {
      activeUsers: number
      activePages: Array<{
        page: string
        users: number
      }>
    }
    deviceBreakdown: Array<{
      device: string
      percentage: number
      sessions: number
      color: string
    }>
    lastUpdated: string
  }
}

export const RealTimeMonitoringWidget: React.FC<RealTimeMonitoringWidgetProps> = ({ data }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: data.realTime.activeUsers,
    pageLoadTime: 1.2,
    serverResponse: 98.5,
    errorRate: 0.02
  })

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate live metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: Math.max(1, prev.activeUsers + (Math.random() - 0.5) * 4),
        pageLoadTime: Math.max(0.5, Math.min(3.0, prev.pageLoadTime + (Math.random() - 0.5) * 0.2)),
        serverResponse: Math.max(95, Math.min(100, prev.serverResponse + (Math.random() - 0.5) * 2)),
        errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() - 0.5) * 0.01))
      }))
    }, 3000) // Update every 3 seconds
    return () => clearInterval(interval)
  }, [])

  // Mock real-time data
  const realtimeData = {
    currentEvents: [
      { id: 1, type: 'page_view', page: '/platforms/ehr', user: 'HCP-Boston', timestamp: new Date(Date.now() - 5000) },
      { id: 2, type: 'demo_request', page: '/services/consulting', user: 'Patient-NYC', timestamp: new Date(Date.now() - 12000) },
      { id: 3, type: 'research_download', page: '/research/publications', user: 'HCP-SF', timestamp: new Date(Date.now() - 18000) },
      { id: 4, type: 'page_view', page: '/patient-portal', user: 'Patient-LA', timestamp: new Date(Date.now() - 25000) }
    ],
    geographicData: [
      { location: 'New York, NY', users: 8, percentage: 22 },
      { location: 'Los Angeles, CA', users: 6, percentage: 17 },
      { location: 'Chicago, IL', users: 5, percentage: 14 },
      { location: 'Boston, MA', users: 4, percentage: 11 },
      { location: 'San Francisco, CA', users: 4, percentage: 11 },
      { location: 'Other', users: 9, percentage: 25 }
    ],
    systemMetrics: [
      { name: 'Server Uptime', value: '99.9%', status: 'healthy', color: 'text-green-600' },
      { name: 'CDN Response', value: '45ms', status: 'healthy', color: 'text-green-600' },
      { name: 'Database Load', value: '23%', status: 'healthy', color: 'text-green-600' },
      { name: 'Error Rate', value: '0.02%', status: 'healthy', color: 'text-green-600' }
    ]
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return Eye
      case 'demo_request': return Users
      case 'research_download': return Clock
      default: return Activity
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'page_view': return 'text-blue-600'
      case 'demo_request': return 'text-green-600'
      case 'research_download': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const formatEventType = (type: string) => {
    switch (type) {
      case 'page_view': return 'Page View'
      case 'demo_request': return 'Demo Request'
      case 'research_download': return 'Research Download'
      default: return type
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'desktop': return Monitor
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              Live Monitoring Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700">
                Live • {format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
          </div>
          <CardDescription className="text-green-700">
            Real-time website activity and system performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round(liveMetrics.activeUsers)}
              </div>
              <div className="text-sm text-green-700">Active Users</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {liveMetrics.pageLoadTime.toFixed(1)}s
              </div>
              <div className="text-sm text-green-700">Page Load Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {liveMetrics.serverResponse.toFixed(1)}%
              </div>
              <div className="text-sm text-green-700">Server Health</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {liveMetrics.errorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-green-700">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {realtimeData.currentEvents.map(event => {
                const Icon = getEventIcon(event.type)
                const timeAgo = Math.floor((Date.now() - event.timestamp.getTime()) / 1000)
                
                return (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${getEventColor(event.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {formatEventType(event.type)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.user.includes('HCP') ? 'HCP' : 'Patient'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {event.page}
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo/60)}m ago`} • {event.user}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realtimeData.geographicData.map((location, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{location.location}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{location.users} users</span>
                      <span className="text-xs text-gray-500">({location.percentage}%)</span>
                    </div>
                  </div>
                  <Progress value={location.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              Active Sessions by Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceBreakdown.map((device, index) => {
                const DeviceIcon = getDeviceIcon(device.device)
                const activeSessionsEstimate = Math.round((device.percentage / 100) * liveMetrics.activeUsers)
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <DeviceIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{device.device}</div>
                        <div className="text-xs text-gray-500">
                          {device.percentage.toFixed(1)}% of total sessions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {activeSessionsEstimate}
                      </div>
                      <div className="text-xs text-gray-500">active now</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              System Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realtimeData.systemMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${metric.color}`} />
                    <span className="font-medium text-gray-900">{metric.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${metric.color}`}>
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
              <div className="text-xs text-green-700 mt-1">
                Last updated: {format(new Date(data.lastUpdated), 'MMM dd, HH:mm:ss')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <div className="font-medium text-yellow-900">Peak Traffic Detected</div>
                <div className="text-yellow-700">25% above average for this time of day</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div>
                <div className="font-medium text-yellow-900">Mobile Traffic Surge</div>
                <div className="text-yellow-700">Mobile users up 40% in the last hour</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <div>
                <div className="font-medium text-yellow-900">High HCP Engagement</div>
                <div className="text-yellow-700">Research content views trending upward</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}