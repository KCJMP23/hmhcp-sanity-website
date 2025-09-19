'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  Activity,
  Eye,
  Users,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { AnalyticsDashboardData, AnalyticsMetric } from '@/lib/google-analytics/types'

interface AnalyticsWidgetsProps {
  data?: AnalyticsDashboardData
  loading?: boolean
  onRefresh?: () => void
}

function MetricCard({ 
  metric, 
  icon: Icon, 
  color 
}: { 
  metric: AnalyticsMetric
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card className="rounded-xl hover:shadow-md transition-shadowrounded-xl ">
      <CardContent className="rounded-xl p-6rounded-xl ">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{metric.name}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</p>
            {metric.changePercent !== undefined && (
              <div className="flex items-center">
                {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}% vs last period
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-md ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RealTimeWidget({ data }: { data?: AnalyticsDashboardData }) {
  const [activeUsers, setActiveUsers] = useState(data?.realTime.activeUsers || 0)
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (data?.realTime.activeUsers) {
        const variation = Math.floor(Math.random() * 10) - 5 // ±5 users
        setActiveUsers(Math.max(1, data.realTime.activeUsers + variation))
      }
    }, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [data?.realTime.activeUsers])
  
  return (
    <Card>
      <CardHeader className="rounded-xl flex flex-row items-center justify-between space-y-0 pb-2rounded-xl ">
        <CardTitle className="rounded-xl text-sm font-mediumrounded-xl ">Real-time Users</CardTitle>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-green-600 mb-4">{activeUsers}</div>
        
        {data?.realTime.activePages && data.realTime.activePages.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Active Pages</h4>
            {data.realTime.activePages.slice(0, 3).map((page: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">
                  {page.page === '/' ? 'Home' : page.page}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {page.views} users
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrafficSourcesWidget({ data }: { data?: AnalyticsDashboardData }) {
  if (!data?.trafficSources) return null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="rounded-xl text-sm font-mediumrounded-xl ">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.trafficSources.slice(0, 5).map((source: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{source.source}</span>
                <span className="text-gray-500">{source.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={source.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{source.sessions.toLocaleString()} sessions</span>
                <span>{source.users.toLocaleString()} users</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TopPagesWidget({ data }: { data?: AnalyticsDashboardData }) {
  if (!data?.topPages) return null
  
  return (
    <Card>
      <CardHeader className="rounded-xl flex flex-row items-center justify-between space-y-0 pb-2rounded-xl ">
        <CardTitle className="rounded-xl text-sm font-mediumrounded-xl ">Top Pages</CardTitle>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.topPages.slice(0, 6).map((page: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{page.page}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-medium">{page.views.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{Math.round(page.avgTimeOnPage)}s avg</span>
                <span>{page.bounceRate.toFixed(1)}% bounce</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DeviceBreakdownWidget({ data }: { data?: AnalyticsDashboardData }) {
  if (!data?.deviceBreakdown) return null
  
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'desktop':
        return Monitor
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Monitor
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="rounded-xl text-sm font-mediumrounded-xl ">Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.deviceBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="percentage"
              >
                {data.deviceBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          {data.deviceBreakdown.map((device: any, index: number) => {
            const DeviceIcon = getDeviceIcon(device.device)
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3" 
                    style={{ backgroundColor: device.color }}
                  />
                  <DeviceIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{device.device}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{device.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">{device.sessions.toLocaleString()}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TrafficTrendsWidget({ data }: { data?: AnalyticsDashboardData }) {
  if (!data?.timeSeries) return null
  
  // Format data for the chart
  const chartData = data.timeSeries.map((day: any) => ({
    date: format(new Date(day.date), 'MMM dd'),
    users: day.users,
    sessions: day.sessions,
    pageViews: day.pageViews
  }))
  
  return (
    <Card className="rounded-xl col-span-2rounded-xl ">
      <CardHeader className="rounded-xl flex flex-row items-center justify-between space-y-0 pb-2rounded-xl ">
        <CardTitle className="rounded-xl text-sm font-mediumrounded-xl ">Traffic Trends (30 Days)</CardTitle>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Users"
              />
              <Area 
                type="monotone" 
                dataKey="sessions" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Sessions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsWidgets({ data, loading, onRefresh }: AnalyticsWidgetsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Real-time insights into your website performance</p>
          </div>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl animate-pulserounded-xl ">
              <CardContent className="rounded-xl p-6rounded-xl ">
                <div className="h-20 bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
          {onRefresh && (
            <Button onClick={onRefresh} className="rounded-full mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Real-time insights into your website performance
            {data.lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated {format(new Date(data.lastUpdated), 'MMM dd, yyyy HH:mm')}
              </span>
            )}
          </p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
      
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={data.overview.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          metric={data.overview.totalSessions}
          icon={Activity}
          color="bg-green-500"
        />
        <MetricCard
          metric={data.overview.totalPageViews}
          icon={Eye}
          color="bg-purple-500"
        />
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={data.overview.avgSessionDuration}
          icon={Clock}
          color="bg-orange-500"
        />
        <MetricCard
          metric={data.overview.bounceRate}
          icon={TrendingDown}
          color="bg-red-500"
        />
        {data.overview.conversionRate && (
          <MetricCard
            metric={data.overview.conversionRate}
            icon={TrendingUp}
            color="bg-indigo-500"
          />
        )}
      </div>
      
      {/* Charts and detailed widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TrafficTrendsWidget data={data} />
        <RealTimeWidget data={data} />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TopPagesWidget data={data} />
        <DeviceBreakdownWidget data={data} />
        <TrafficSourcesWidget data={data} />
      </div>
    </div>
  )
}