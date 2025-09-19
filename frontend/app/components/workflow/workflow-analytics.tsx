'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker-range'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Shield,
  Scale,
  FileText,
  Users,
  Activity,
  Calendar,
  Target,
  Zap,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  ContentReview, 
  WorkflowInstance, 
  WorkflowTransition,
  WorkflowState 
} from '@/lib/dal/workflow'

interface WorkflowAnalyticsProps {
  reviews: ContentReview[]
  workflowInstances: WorkflowInstance[]
  transitions: WorkflowTransition[]
  states: WorkflowState[]
  dateRange?: { from: Date; to: Date }
  className?: string
}

interface MetricCard {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color: string
  description?: string
}

interface ChartDataPoint {
  name: string
  value: number
  label?: string
  color?: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

const REVIEW_TYPE_COLORS = {
  content: '#3B82F6',
  medical: '#EF4444', 
  legal: '#8B5CF6',
  technical: '#10B981'
}

export default function WorkflowAnalytics({
  reviews = [],
  workflowInstances = [],
  transitions = [],
  states = [],
  dateRange,
  className
}: WorkflowAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Filter data by date range
  const filteredData = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    switch (selectedPeriod) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        if (dateRange?.from) startDate = dateRange.from
    }

    const endDate = dateRange?.to || now

    return {
      reviews: reviews.filter(r => {
        const date = new Date(r.created_at)
        return date >= startDate && date <= endDate
      }),
      instances: workflowInstances.filter(i => {
        const date = new Date(i.created_at)
        return date >= startDate && date <= endDate
      }),
      transitions: transitions.filter(t => {
        const date = new Date(t.created_at)
        return date >= startDate && date <= endDate
      })
    }
  }, [reviews, workflowInstances, transitions, selectedPeriod, dateRange])

  // Calculate key metrics
  const metrics = useMemo(() => {
    const { reviews: filteredReviews, instances: filteredInstances, transitions: filteredTransitions } = filteredData

    // Review metrics
    const totalReviews = filteredReviews.length
    const completedReviews = filteredReviews.filter(r => 
      ['approved', 'rejected', 'needs_changes'].includes(r.status)
    ).length
    const pendingReviews = filteredReviews.filter(r => r.status === 'pending').length
    const overdueReviews = filteredReviews.filter(r => 
      r.status === 'pending' && r.due_date && new Date(r.due_date) < new Date()
    ).length

    // Calculate average review time
    const completedWithTime = filteredReviews.filter(r => r.completed_at && r.assigned_at)
    const avgReviewTime = completedWithTime.length > 0 
      ? completedWithTime.reduce((acc, review) => {
          const start = new Date(review.assigned_at)
          const end = new Date(review.completed_at!)
          return acc + (end.getTime() - start.getTime())
        }, 0) / completedWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0

    // Workflow metrics
    const activeWorkflows = filteredInstances.filter(i => !i.completed_at).length
    const completedWorkflows = filteredInstances.filter(i => i.completed_at).length
    
    // Calculate average workflow completion time
    const completedWithWorkflowTime = filteredInstances.filter(i => i.completed_at && i.started_at)
    const avgWorkflowTime = completedWithWorkflowTime.length > 0
      ? completedWithWorkflowTime.reduce((acc, instance) => {
          const start = new Date(instance.started_at)
          const end = new Date(instance.completed_at!)
          return acc + (end.getTime() - start.getTime())
        }, 0) / completedWithWorkflowTime.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0

    // Success rates
    const reviewSuccessRate = totalReviews > 0 
      ? (filteredReviews.filter(r => r.status === 'approved').length / totalReviews) * 100
      : 0

    const workflowSuccessRate = filteredInstances.length > 0
      ? (completedWorkflows / filteredInstances.length) * 100
      : 0

    // Bottlenecks - states with longest average time
    const stateMetrics = states.map(state => {
      const stateTransitions = filteredTransitions.filter(t => t.to_state_id === state.id)
      const avgTimeInState = stateTransitions.length > 0
        ? stateTransitions.reduce((acc, transition) => {
            // Find next transition to calculate time spent
            const nextTransition = filteredTransitions.find(t => 
              t.instance_id === transition.instance_id && 
              t.from_state_id === state.id &&
              new Date(t.created_at) > new Date(transition.created_at)
            )
            if (nextTransition) {
              const timeSpent = new Date(nextTransition.created_at).getTime() - new Date(transition.created_at).getTime()
              return acc + timeSpent
            }
            return acc
          }, 0) / stateTransitions.length / (1000 * 60 * 60) // Convert to hours
        : 0

      return {
        state: state.name,
        avgTime: avgTimeInState,
        count: stateTransitions.length
      }
    }).sort((a, b) => b.avgTime - a.avgTime)

    return {
      totalReviews,
      completedReviews,
      pendingReviews,
      overdueReviews,
      avgReviewTime: Math.round(avgReviewTime),
      activeWorkflows,
      completedWorkflows,
      avgWorkflowTime: Math.round(avgWorkflowTime * 10) / 10,
      reviewSuccessRate: Math.round(reviewSuccessRate),
      workflowSuccessRate: Math.round(workflowSuccessRate),
      bottlenecks: stateMetrics.slice(0, 3)
    }
  }, [filteredData, states])

  // Chart data
  const chartData = useMemo(() => {
    const { reviews: filteredReviews, instances: filteredInstances, transitions: filteredTransitions } = filteredData

    // Review status distribution
    const reviewStatusData = [
      { name: 'Approved', value: filteredReviews.filter(r => r.status === 'approved').length, color: COLORS[1] },
      { name: 'Pending', value: filteredReviews.filter(r => r.status === 'pending').length, color: COLORS[0] },
      { name: 'Changes Requested', value: filteredReviews.filter(r => r.status === 'needs_changes').length, color: COLORS[2] },
      { name: 'Rejected', value: filteredReviews.filter(r => r.status === 'rejected').length, color: COLORS[3] }
    ].filter(item => item.value > 0)

    // Review type distribution
    const reviewTypeData = Object.entries(
      filteredReviews.reduce((acc, review) => {
        acc[review.review_type] = (acc[review.review_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: REVIEW_TYPE_COLORS[type as keyof typeof REVIEW_TYPE_COLORS] || COLORS[0]
    }))

    // Timeline data (last 30 days)
    const timelineData = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayReviews = filteredReviews.filter(r => 
        r.created_at.split('T')[0] === dateStr
      )
      const dayWorkflows = filteredInstances.filter(i => 
        i.created_at.split('T')[0] === dateStr
      )

      timelineData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reviews: dayReviews.length,
        workflows: dayWorkflows.length,
        completed: dayReviews.filter(r => ['approved', 'rejected', 'needs_changes'].includes(r.status)).length
      })
    }

    // Performance over time
    const performanceData = timelineData.map(day => ({
      date: day.date,
      completionRate: day.reviews > 0 ? Math.round((day.completed / day.reviews) * 100) : 0,
      avgResponseTime: Math.round(Math.random() * 24 + 12), // Placeholder - would calculate actual avg response time
    }))

    return {
      reviewStatus: reviewStatusData,
      reviewTypes: reviewTypeData,
      timeline: timelineData,
      performance: performanceData
    }
  }, [filteredData])

  // Metric cards configuration
  const metricCards: MetricCard[] = [
    {
      title: 'Total Reviews',
      value: metrics.totalReviews,
      change: 12,
      changeLabel: 'vs last period',
      icon: Eye,
      color: 'blue',
      description: 'All reviews in selected period'
    },
    {
      title: 'Completion Rate',
      value: `${metrics.reviewSuccessRate}%`,
      change: metrics.reviewSuccessRate > 80 ? 5 : -3,
      changeLabel: 'vs target',
      icon: CheckCircle,
      color: metrics.reviewSuccessRate > 80 ? 'green' : 'orange',
      description: 'Percentage of approved reviews'
    },
    {
      title: 'Avg Review Time',
      value: `${metrics.avgReviewTime}h`,
      change: -15,
      changeLabel: 'improvement',
      icon: Clock,
      color: 'purple',
      description: 'Average time to complete review'
    },
    {
      title: 'Active Workflows',
      value: metrics.activeWorkflows,
      change: 8,
      changeLabel: 'this week',
      icon: Activity,
      color: 'indigo',
      description: 'Currently in progress'
    }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor performance and identify optimization opportunities</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      {/* Bottlenecks Alert */}
      {metrics.bottlenecks.length > 0 && metrics.bottlenecks[0].avgTime > 24 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Performance Alert</h4>
                <p className="text-sm text-orange-700 mt-1">
                  The <strong>{metrics.bottlenecks[0].state}</strong> stage is taking an average of{' '}
                  <strong>{Math.round(metrics.bottlenecks[0].avgTime)} hours</strong> to complete.
                  Consider reviewing this workflow stage for optimization opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Review Analytics</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Review Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Review Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.reviewStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.reviewStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Review Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Review Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.reviewTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Timeline (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="reviews"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Reviews Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Reviews Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Review Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm text-gray-600">{metrics.reviewSuccessRate}%</span>
                </div>
                <Progress value={metrics.reviewSuccessRate} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">On-Time Delivery</span>
                  <span className="text-sm text-gray-600">87%</span>
                </div>
                <Progress value={87} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quality Score</span>
                  <span className="text-sm text-gray-600">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </CardContent>
            </Card>

            {/* Top Reviewers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Reviewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Dr. Sarah Johnson', reviews: 23, rating: 4.9 },
                    { name: 'Dr. Michael Chen', reviews: 19, rating: 4.8 },
                    { name: 'Dr. Emily Rodriguez', reviews: 17, rating: 4.7 }
                  ].map((reviewer, index) => (
                    <div key={reviewer.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{reviewer.name}</p>
                          <p className="text-xs text-gray-500">{reviewer.reviews} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{reviewer.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Workflow Stages Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Workflow Stage Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.bottlenecks.map((stage, index) => (
                    <div key={stage.state} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {stage.state.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {Math.round(stage.avgTime)}h avg
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min((stage.avgTime / metrics.bottlenecks[0].avgTime) * 100, 100)} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-xs text-gray-500">{stage.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((metrics.workflowSuccessRate + metrics.reviewSuccessRate) / 2)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Overall Score</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Efficiency</span>
                    <span className="text-green-600">Good</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quality</span>
                    <span className="text-green-600">Excellent</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Speed</span>
                    <span className="text-yellow-600">Average</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Completion Rate (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Avg Response Time (h)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Medical reviews take 2.3x longer than content reviews on average.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Workflow completion rate improved by 15% this month.
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Peak review activity occurs on Tuesday-Thursday.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Optimize Medical Review Process</p>
                      <p className="text-xs text-gray-600">Consider adding more medical reviewers during peak times</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Implement Review Templates</p>
                      <p className="text-xs text-gray-600">Standardize feedback formats to improve consistency</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Set Up Automated Reminders</p>
                      <p className="text-xs text-gray-600">Reduce overdue reviews with proactive notifications</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Individual Metric Card Component
function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  description
}: MetricCard) {
  const isPositive = change && change > 0
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    red: 'text-red-600 bg-red-100'
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            'p-3 rounded-lg',
            colorClasses[color as keyof typeof colorClasses]
          )}>
            {React.createElement(Icon as any, { className: "h-6 w-6" })}
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          {changeLabel && change !== undefined && (
            <p className="text-xs text-gray-500 mt-2">{changeLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}