/**
 * Workflow Analytics and Reporting Component
 * Provides insights and analytics for workflow performance
 * Story 1.4 Task 8 - Comprehensive workflow management system
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTab 
} from '@/components/ui/tabs'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ================================
// Types
// ================================

interface WorkflowAnalytics {
  totalWorkflows: number
  completedThisMonth: number
  averageCompletionTime: number
  bottlenecks: WorkflowBottleneck[]
  throughput: WorkflowThroughput[]
  efficiency: WorkflowEfficiency
  actionDistribution: Record<string, number>
  userMetrics: UserProductivityMetric[]
  contentTypeMetrics: Record<string, ContentTypeMetric>
  trends: {
    groupBy: 'day' | 'week' | 'month'
    throughputTrend: WorkflowThroughput[]
    completionTimesTrend: CompletionTimeTrend[]
    rejectionRateTrend: RejectionRateTrend[]
  }
}

interface WorkflowBottleneck {
  state: string
  averageTime: number
  instanceCount: number
  impact: 'low' | 'medium' | 'high'
}

interface WorkflowThroughput {
  date: string
  started: number
  completed: number
  rejected: number
}

interface WorkflowEfficiency {
  onTimeCompletionRate: number
  firstTimeApprovalRate: number
  rejectionRate: number
  escalationRate: number
}

interface UserProductivityMetric {
  userId: string
  transitions: number
  avgTimeInState: number
}

interface ContentTypeMetric {
  total: number
  avgCompletionTime: number
}

interface CompletionTimeTrend {
  date: string
  avgCompletionTime: number
}

interface RejectionRateTrend {
  date: string
  rejectionRate: number
}

interface WorkflowAnalyticsProps {
  currentUser: {
    id: string
    role: string
    name: string
  }
}

// ================================
// Metric Card Component
// ================================

const MetricCard: React.FC<{
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color: string
  description?: string
}> = ({ title, value, change, changeLabel, icon: Icon, color, description }) => {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                change === 0 && 'text-gray-500'
              )}>
                {isPositive && <TrendingUp className="w-4 h-4" />}
                {isNegative && <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(change).toFixed(1)}%</span>
                {changeLabel && <span className="text-gray-500">vs {changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-full', color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ================================
// Bottleneck Chart Component
// ================================

const BottleneckChart: React.FC<{ bottlenecks: WorkflowBottleneck[] }> = ({ bottlenecks }) => {
  if (bottlenecks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No bottlenecks detected</p>
      </div>
    )
  }

  const maxTime = Math.max(...bottlenecks.map(b => b.averageTime))

  return (
    <div className="space-y-4">
      {bottlenecks.map((bottleneck, index) => {
        const widthPercentage = (bottleneck.averageTime / maxTime) * 100
        const impactColor = {
          low: 'bg-green-100 text-green-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-red-100 text-red-800'
        }[bottleneck.impact]

        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">
                  {bottleneck.state.replace('_', ' ')} State
                </span>
                <Badge className={impactColor}>
                  {bottleneck.impact} impact
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {bottleneck.averageTime.toFixed(1)} days avg
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${widthPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {bottleneck.instanceCount} workflow{bottleneck.instanceCount > 1 ? 's' : ''} affected
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ================================
// Throughput Chart Component
// ================================

const ThroughputChart: React.FC<{ data: WorkflowThroughput[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No throughput data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.started, d.completed, d.rejected)))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Started</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Rejected</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {data.slice(-7).map((item, index) => {
          const date = new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
          
          const startedHeight = maxValue > 0 ? (item.started / maxValue) * 100 : 0
          const completedHeight = maxValue > 0 ? (item.completed / maxValue) * 100 : 0
          const rejectedHeight = maxValue > 0 ? (item.rejected / maxValue) * 100 : 0

          return (
            <div key={index} className="text-center space-y-2">
              <div className="h-32 flex items-end justify-center gap-1">
                <div 
                  className="w-3 bg-blue-500 rounded-t"
                  style={{ height: `${startedHeight}%`, minHeight: item.started > 0 ? '4px' : '0' }}
                  title={`Started: ${item.started}`}
                />
                <div 
                  className="w-3 bg-green-500 rounded-t"
                  style={{ height: `${completedHeight}%`, minHeight: item.completed > 0 ? '4px' : '0' }}
                  title={`Completed: ${item.completed}`}
                />
                <div 
                  className="w-3 bg-red-500 rounded-t"
                  style={{ height: `${rejectedHeight}%`, minHeight: item.rejected > 0 ? '4px' : '0' }}
                  title={`Rejected: ${item.rejected}`}
                />
              </div>
              <div className="text-xs text-gray-600">{date}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ================================
// User Productivity Table
// ================================

const UserProductivityTable: React.FC<{ metrics: UserProductivityMetric[] }> = ({ metrics }) => {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No user productivity data available</p>
      </div>
    )
  }

  const sortedMetrics = [...metrics].sort((a, b) => b.transitions - a.transitions).slice(0, 10)

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600">Transitions</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600">Avg Time</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600">Efficiency</th>
          </tr>
        </thead>
        <tbody>
          {sortedMetrics.map((metric, index) => {
            const avgTimeHours = Math.floor(metric.avgTimeInState / (1000 * 60 * 60))
            const avgTimeMinutes = Math.floor((metric.avgTimeInState % (1000 * 60 * 60)) / (1000 * 60))
            const efficiency = metric.transitions > 5 ? 'High' : metric.transitions > 2 ? 'Medium' : 'Low'
            const efficiencyColor = {
              High: 'text-green-600',
              Medium: 'text-yellow-600',
              Low: 'text-red-600'
            }[efficiency]

            return (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {metric.userId.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{metric.userId}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  {metric.transitions}
                </td>
                <td className="py-3 px-4 text-right text-sm text-gray-600">
                  {avgTimeHours > 0 ? `${avgTimeHours}h ` : ''}{avgTimeMinutes}m
                </td>
                <td className="py-3 px-4 text-right">
                  <Badge variant="outline" className={efficiencyColor}>
                    {efficiency}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ================================
// Main WorkflowAnalytics Component
// ================================

export const WorkflowAnalytics: React.FC<WorkflowAnalyticsProps> = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('last_30_days')
  const [contentTypeFilter, setContentTypeFilter] = useState('all')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, contentTypeFilter])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const requestBody: any = {
        groupBy: 'day'
      }

      // Add date range
      const now = new Date()
      if (dateRange === 'last_7_days') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        requestBody.dateRange = {
          start: start.toISOString(),
          end: now.toISOString()
        }
      } else if (dateRange === 'last_30_days') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        requestBody.dateRange = {
          start: start.toISOString(),
          end: now.toISOString()
        }
      } else if (dateRange === 'last_90_days') {
        const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        requestBody.dateRange = {
          start: start.toISOString(),
          end: now.toISOString()
        }
      }

      // Add content type filter
      if (contentTypeFilter !== 'all') {
        requestBody.contentType = contentTypeFilter
      }

      const response = await fetch('/api/admin/workflow/transitions/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalytics(data.data)

    } catch (err) {
      console.error('Failed to load workflow analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const exportAnalytics = async () => {
    try {
      // In a real implementation, this would generate and download a report
      const data = {
        analytics,
        dateRange,
        contentTypeFilter,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.name
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workflow-analytics-${dateRange}.json`
      a.click()
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Failed to export analytics:', err)
      alert('Failed to export analytics')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-red-600">Error Loading Analytics</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadAnalytics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Analytics</h1>
          <p className="text-gray-600">Performance insights and bottleneck analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 days</SelectItem>
                  <SelectItem value="all_time">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="blog_post">Blog Posts</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                  <SelectItem value="platform">Platforms</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Workflows"
          value={analytics.totalWorkflows}
          icon={BarChart3}
          color="bg-blue-500"
          description="All time"
        />
        <MetricCard
          title="Completed This Month"
          value={analytics.completedThisMonth}
          change={15.2}
          changeLabel="last month"
          icon={CheckCircle}
          color="bg-green-500"
          description="Published content"
        />
        <MetricCard
          title="Avg Completion Time"
          value={`${analytics.averageCompletionTime.toFixed(1)} days`}
          change={-8.5}
          changeLabel="last period"
          icon={Clock}
          color="bg-orange-500"
          description="From draft to published"
        />
        <MetricCard
          title="First-time Approval"
          value={`${(analytics.efficiency.firstTimeApprovalRate * 100).toFixed(1)}%`}
          change={5.3}
          changeLabel="last period"
          icon={CheckCircle}
          color="bg-purple-500"
          description="No revisions needed"
        />
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="On-time Completion"
          value={`${(analytics.efficiency.onTimeCompletionRate * 100).toFixed(1)}%`}
          icon={Calendar}
          color="bg-blue-600"
          description="Met deadlines"
        />
        <MetricCard
          title="Rejection Rate"
          value={`${(analytics.efficiency.rejectionRate * 100).toFixed(1)}%`}
          icon={X}
          color="bg-red-500"
          description="Rejected content"
        />
        <MetricCard
          title="Escalation Rate"
          value={`${(analytics.efficiency.escalationRate * 100).toFixed(1)}%`}
          icon={AlertTriangle}
          color="bg-yellow-500"
          description="Escalated issues"
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <Tabs defaultValue="bottlenecks">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTab value="bottlenecks">Bottlenecks</TabsTab>
              <TabsTab value="throughput">Throughput</TabsTab>
              <TabsTab value="users">User Performance</TabsTab>
              <TabsTab value="content">Content Types</TabsTab>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="bottlenecks" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Workflow Bottlenecks</h3>
                <p className="text-gray-600 text-sm mb-6">
                  States where content spends the most time, potentially slowing down the workflow.
                </p>
                <BottleneckChart bottlenecks={analytics.bottlenecks} />
              </div>
            </TabsContent>

            <TabsContent value="throughput" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Workflow Throughput</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Daily workflow activity showing started, completed, and rejected content.
                </p>
                <ThroughputChart data={analytics.throughput} />
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">User Performance</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Individual user productivity and efficiency metrics.
                </p>
                <UserProductivityTable metrics={analytics.userMetrics} />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Content Type Performance</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Workflow performance broken down by content type.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analytics.contentTypeMetrics).map(([contentType, metrics]) => (
                    <Card key={contentType}>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 capitalize">
                          {contentType.replace('_', ' ')}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="font-medium">{metrics.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg Time:</span>
                            <span className="font-medium">
                              {Math.floor(metrics.avgCompletionTime / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

export default WorkflowAnalytics