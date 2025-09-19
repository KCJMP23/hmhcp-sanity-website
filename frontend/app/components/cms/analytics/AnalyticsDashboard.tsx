'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  Clock,
  Calendar,
  Activity,
  Download,
  RefreshCw,
  Filter,
  ChevronUp,
  ChevronDown,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger';

interface AnalyticsData {
  overview: {
    totalPages: number
    totalViews: number
    totalUsers: number
    avgSessionDuration: number
    bounceRate: number
    conversionRate: number
  }
  trends: {
    viewsTrend: number
    usersTrend: number
    sessionTrend: number
    bounceTrend: number
  }
  topPages: Array<{
    id: string
    title: string
    slug: string
    views: number
    uniqueViews: number
    avgTime: number
    bounceRate: number
    conversionRate: number
  }>
  contentPerformance: {
    publishing: {
      totalPublished: number
      drafts: number
      scheduled: number
      archived: number
    }
    engagement: {
      avgViewsPerPage: number
      avgTimeOnPage: number
      totalComments: number
      totalShares: number
    }
  }
  userActivity: Array<{
    date: string
    views: number
    uniqueUsers: number
    sessions: number
    newUsers: number
  }>
  realtimeStats: {
    activeUsers: number
    currentSessions: number
    liveViews: number
  }
  seoMetrics: {
    avgLoadTime: number
    coreWebVitals: {
      lcp: number
      fid: number
      cls: number
    }
    searchVisibility: number
    organicTraffic: number
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    title: string
    message: string
    timestamp: string
  }>
}

interface AnalyticsDashboardProps {
  className?: string
}

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '1y', label: 'Last year' }
]

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedTab, setSelectedTab] = useState<'overview' | 'content' | 'users' | 'performance'>('overview')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cms/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData.data)
      }
    } catch (error) {
      logger.error('Error loading analytics:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await fetch('/api/cms/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          timeRange,
          format: 'pdf',
          sections: ['overview', 'content', 'users', 'performance']
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      logger.error('Error exporting report:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-blue-600" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <span className="w-4 h-4" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-blue-600 dark:text-blue-400'
    if (trend < 0) return 'text-red-600 dark:text-blue-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Analytics data is not available yet. Check your configuration or try again later.
          </p>
          <Button onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your content performance and user engagement
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'p-4  border flex items-start gap-3',
                alert.type === 'error' && 'bg-red-50 border-red-200 dark:bg-blue-900/20 dark:border-blue-800',
                alert.type === 'warning' && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                alert.type === 'info' && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              )}
            >
              <AlertTriangle className={cn(
                'w-5 h-5 mt-0.5',
                alert.type === 'error' && 'text-red-500',
                alert.type === 'warning' && 'text-blue-500',
                alert.type === 'info' && 'text-blue-500'
              )} />
              <div className="flex-1">
                <h4 className="font-medium">{alert.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(alert.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Real-time Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Real-time Activity
          </h3>
          <Badge variant="outline" className="animate-pulse">
            <div className="w-2 h-2 bg-blue-500 mr-2"></div>
            Live
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.realtimeStats.activeUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.realtimeStats.currentSessions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.realtimeStats.liveViews}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Live Views</div>
          </div>
        </div>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{formatNumber(data.overview.totalViews)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
              <div className={cn('text-xs flex items-center gap-1 mt-1', getTrendColor(data.trends.viewsTrend))}>
                {getTrendIcon(data.trends.viewsTrend)}
                {Math.abs(data.trends.viewsTrend)}%
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
              <div className={cn('text-xs flex items-center gap-1 mt-1', getTrendColor(data.trends.usersTrend))}>
                {getTrendIcon(data.trends.usersTrend)}
                {Math.abs(data.trends.usersTrend)}%
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{formatDuration(data.overview.avgSessionDuration)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session</div>
              <div className={cn('text-xs flex items-center gap-1 mt-1', getTrendColor(data.trends.sessionTrend))}>
                {getTrendIcon(data.trends.sessionTrend)}
                {Math.abs(data.trends.sessionTrend)}%
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{data.overview.bounceRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</div>
              <div className={cn('text-xs flex items-center gap-1 mt-1', getTrendColor(-data.trends.bounceTrend))}>
                {getTrendIcon(-data.trends.bounceTrend)}
                {Math.abs(data.trends.bounceTrend)}%
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'content', label: 'Content Performance' },
            { id: 'users', label: 'User Behavior' },
            { id: 'performance', label: 'Site Performance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Top Performing Pages</h3>
            <div className="space-y-3">
              {data.topPages.slice(0, 5).map((page, index) => (
                <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{page.title}</div>
                    <div className="text-xs text-gray-500">/{page.slug}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(page.views)}</div>
                    <div className="text-xs text-gray-500">views</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-medium mb-4">Content Status Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.contentPerformance.publishing.totalPublished}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.contentPerformance.publishing.drafts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.contentPerformance.publishing.scheduled}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {data.contentPerformance.publishing.archived}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Archived</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'content' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Content Engagement Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.contentPerformance.engagement.avgViewsPerPage}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Views per Page</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatDuration(data.contentPerformance.engagement.avgTimeOnPage)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Time on Page</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.contentPerformance.engagement.totalComments}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.contentPerformance.engagement.totalShares}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Shares</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-medium mb-4">Detailed Page Performance</h3>
            <div className="overflow-x-hidden">
              <div className="w-full overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2">Page</th>
                    <th className="text-right p-2">Views</th>
                    <th className="text-right p-2">Unique Views</th>
                    <th className="text-right p-2">Avg Time</th>
                    <th className="text-right p-2">Bounce Rate</th>
                    <th className="text-right p-2">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map(page => (
                    <tr key={page.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-2">
                        <div className="font-medium">{page.title}</div>
                        <div className="text-xs text-gray-500">/{page.slug}</div>
                      </td>
                      <td className="text-right p-2">{formatNumber(page.views)}</td>
                      <td className="text-right p-2">{formatNumber(page.uniqueViews)}</td>
                      <td className="text-right p-2">{formatDuration(page.avgTime)}</td>
                      <td className="text-right p-2">{page.bounceRate.toFixed(1)}%</td>
                      <td className="text-right p-2">{page.conversionRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Site Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Load Time</span>
                <span className="font-medium">{data.seoMetrics.avgLoadTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Search Visibility</span>
                <span className="font-medium">{data.seoMetrics.searchVisibility}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Organic Traffic</span>
                <span className="font-medium">{formatNumber(data.seoMetrics.organicTraffic)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-medium mb-4">Core Web Vitals</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">LCP (Largest Contentful Paint)</span>
                <Badge variant={data.seoMetrics.coreWebVitals.lcp < 2.5 ? 'default' : 'destructive'}>
                  {data.seoMetrics.coreWebVitals.lcp.toFixed(1)}s
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">FID (First Input Delay)</span>
                <Badge variant={data.seoMetrics.coreWebVitals.fid < 100 ? 'default' : 'destructive'}>
                  {data.seoMetrics.coreWebVitals.fid}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">CLS (Cumulative Layout Shift)</span>
                <Badge variant={data.seoMetrics.coreWebVitals.cls < 0.1 ? 'default' : 'destructive'}>
                  {data.seoMetrics.coreWebVitals.cls.toFixed(3)}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}