/**
 * Scheduling Dashboard Component
 * Timeline view and comprehensive dashboard for scheduled content management
 * Part of Story 1.4 Task 7 - Content Scheduling System
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO, isToday, isTomorrow, isAfter, isBefore, differenceInHours } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Play, 
  Pause, 
  RefreshCw,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Users,
  FileText,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ScheduledContent,
  SchedulingStatus,
  ContentType,
  SchedulingQueue
} from '@/lib/services/content-scheduler'
import { logger } from '@/lib/logger'

// ================================
// Types and Interfaces
// ================================

interface DashboardStats {
  total_scheduled: number
  publishing_today: number
  pending_approval: number
  failed_publications: number
  success_rate: number
  average_time_to_publish: number
  popular_content_types: Record<string, number>
  peak_scheduling_hours: number[]
}

interface TimelineGroup {
  date: string
  items: ScheduledContent[]
  isToday: boolean
  isTomorrow: boolean
  isPast: boolean
}

interface SchedulingDashboardProps {
  onScheduleContent?: () => void
  onUpdateSchedule?: (id: string) => void
  onCancelSchedule?: (id: string, reason?: string) => Promise<void>
  onViewContent?: (content: ScheduledContent) => void
  onRefresh?: () => Promise<void>
  className?: string
}

// ================================
// Main Dashboard Component
// ================================

export function SchedulingDashboard({
  onScheduleContent,
  onUpdateSchedule,
  onCancelSchedule,
  onViewContent,
  onRefresh,
  className = ''
}: SchedulingDashboardProps) {
  // State management
  const [queue, setQueue] = useState<SchedulingQueue | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [allScheduled, setAllScheduled] = useState<ScheduledContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SchedulingStatus | 'all'>('all')
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all')
  const [selectedContent, setSelectedContent] = useState<ScheduledContent | null>(null)
  const [showContentDialog, setShowContentDialog] = useState(false)

  // ================================
  // Data Processing
  // ================================

  const timelineGroups = useMemo(() => {
    const filtered = allScheduled.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content_type.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesType = contentTypeFilter === 'all' || item.content_type === contentTypeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    const grouped = filtered.reduce((groups, item) => {
      const date = format(parseISO(item.scheduled_for), 'yyyy-MM-dd')
      
      if (!groups[date]) {
        groups[date] = {
          date,
          items: [],
          isToday: isToday(parseISO(item.scheduled_for)),
          isTomorrow: isTomorrow(parseISO(item.scheduled_for)),
          isPast: isBefore(parseISO(item.scheduled_for), new Date())
        }
      }
      
      groups[date].items.push(item)
      return groups
    }, {} as Record<string, TimelineGroup>)

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [allScheduled, searchQuery, statusFilter, contentTypeFilter])

  // ================================
  // Data Fetching
  // ================================

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch scheduling queue
      const queueResponse = await fetch('/api/admin/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ action: 'get_queue' })
      })

      if (!queueResponse.ok) {
        throw new Error('Failed to fetch scheduling queue')
      }

      const queueResult = await queueResponse.json()
      setQueue(queueResult.data)

      // Fetch all scheduled content for timeline
      const allResponse = await fetch('/api/admin/scheduling?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (!allResponse.ok) {
        throw new Error('Failed to fetch scheduled content')
      }

      const allResult = await allResponse.json()
      setAllScheduled(allResult.data || [])

      // Calculate stats
      calculateStats(queueResult.data, allResult.data || [])

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard'
      setError(errorMessage)
      logger.error('Failed to fetch dashboard data', { error: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateStats = (queueData: SchedulingQueue, allData: ScheduledContent[]) => {
    const now = new Date()
    const publishedItems = allData.filter(item => item.status === SchedulingStatus.PUBLISHED)
    const failedItems = allData.filter(item => item.status === SchedulingStatus.FAILED)
    
    const contentTypeCounts = allData.reduce((acc, item) => {
      acc[item.content_type] = (acc[item.content_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const hourCounts = allData.reduce((acc, item) => {
      const hour = parseISO(item.scheduled_for).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    setStats({
      total_scheduled: allData.length,
      publishing_today: queueData.scheduled_today.length,
      pending_approval: queueData.pending.length,
      failed_publications: failedItems.length,
      success_rate: allData.length > 0 ? (publishedItems.length / allData.length) * 100 : 0,
      average_time_to_publish: 2.5, // This would be calculated from actual data
      popular_content_types: contentTypeCounts,
      peak_scheduling_hours: peakHours
    })
  }

  // ================================
  // Event Handlers
  // ================================

  const handleContentAction = async (action: string, content: ScheduledContent) => {
    try {
      switch (action) {
        case 'view':
          setSelectedContent(content)
          setShowContentDialog(true)
          break
        case 'edit':
          onUpdateSchedule?.(content.id)
          break
        case 'cancel':
          await onCancelSchedule?.(content.id, 'Cancelled from dashboard')
          await fetchDashboardData()
          break
        default:
          break
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed'
      setError(errorMessage)
    }
  }

  const getStatusColor = (status: SchedulingStatus) => {
    switch (status) {
      case SchedulingStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case SchedulingStatus.PROCESSING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case SchedulingStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 border-green-200'
      case SchedulingStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200'
      case SchedulingStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: SchedulingStatus) => {
    switch (status) {
      case SchedulingStatus.SCHEDULED:
        return <Clock className="w-4 h-4" />
      case SchedulingStatus.PROCESSING:
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case SchedulingStatus.PUBLISHED:
        return <CheckCircle2 className="w-4 h-4" />
      case SchedulingStatus.FAILED:
        return <AlertTriangle className="w-4 h-4" />
      case SchedulingStatus.CANCELLED:
        return <X className="w-4 h-4" />
      default:
        return null
    }
  }

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST:
        return <FileText className="w-4 h-4" />
      case ContentType.PAGE:
        return <Globe className="w-4 h-4" />
      case ContentType.PLATFORM:
        return <TrendingUp className="w-4 h-4" />
      case ContentType.SERVICE:
        return <Users className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getUrgencyColor = (scheduledFor: string) => {
    const hoursUntil = differenceInHours(parseISO(scheduledFor), new Date())
    
    if (hoursUntil < 0) return 'border-l-gray-400' // Past due
    if (hoursUntil < 2) return 'border-l-red-500' // Very urgent
    if (hoursUntil < 24) return 'border-l-yellow-500' // Urgent
    if (hoursUntil < 168) return 'border-l-blue-500' // This week
    return 'border-l-green-500' // Future
  }

  // ================================
  // Effects
  // ================================

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // ================================
  // Render
  // ================================

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin mr-2" />
            <span>Loading dashboard...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Scheduling Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your content publication schedule</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onScheduleContent} className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Content
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Scheduled</p>
                    <p className="text-2xl font-bold">{stats.total_scheduled}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Publishing Today</p>
                    <p className="text-2xl font-bold">{stats.publishing_today}</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{Math.round(stats.success_rate)}%</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={stats.success_rate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold">{stats.failed_publications}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="queue">Queue Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {queue && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Today's Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queue.scheduled_today.length === 0 ? (
                      <p className="text-gray-500">No content scheduled for today</p>
                    ) : (
                      <div className="space-y-2">
                        {queue.scheduled_today.slice(0, 5).map(item => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            {getStatusIcon(item.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-gray-500">
                                {format(parseISO(item.scheduled_for), 'HH:mm')}
                              </p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                        {queue.scheduled_today.length > 5 && (
                          <p className="text-sm text-gray-500">
                            +{queue.scheduled_today.length - 5} more items
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Processing Queue */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Processing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queue.processing.length === 0 ? (
                      <p className="text-gray-500">No content currently processing</p>
                    ) : (
                      <div className="space-y-2">
                        {queue.processing.map(item => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                            <RefreshCw className="w-4 h-4 animate-spin text-yellow-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-gray-500">
                                {format(parseISO(item.scheduled_for), 'MMM d, HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Failed Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queue.failed.length === 0 ? (
                      <p className="text-gray-500">No failed publications</p>
                    ) : (
                      <div className="space-y-2">
                        {queue.failed.slice(0, 5).map(item => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-gray-500">
                                {item.error_message || 'Unknown error'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContentAction('edit', item)}
                            >
                              Retry
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={SchedulingStatus.SCHEDULED}>Scheduled</SelectItem>
                  <SelectItem value={SchedulingStatus.PROCESSING}>Processing</SelectItem>
                  <SelectItem value={SchedulingStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem value={SchedulingStatus.FAILED}>Failed</SelectItem>
                  <SelectItem value={SchedulingStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentTypeFilter} onValueChange={(value) => setContentTypeFilter(value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ContentType.BLOG_POST}>Blog Post</SelectItem>
                  <SelectItem value={ContentType.PAGE}>Page</SelectItem>
                  <SelectItem value={ContentType.PLATFORM}>Platform</SelectItem>
                  <SelectItem value={ContentType.SERVICE}>Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {timelineGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No scheduled content found</p>
                  </CardContent>
                </Card>
              ) : (
                timelineGroups.map(group => (
                  <Card key={group.date}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${
                        group.isToday ? 'text-blue-600' : 
                        group.isTomorrow ? 'text-green-600' : 
                        group.isPast ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        <Calendar className="w-5 h-5" />
                        {format(new Date(group.date), 'EEEE, MMMM d, yyyy')}
                        {group.isToday && <Badge variant="secondary">Today</Badge>}
                        {group.isTomorrow && <Badge variant="outline">Tomorrow</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.items
                          .sort((a, b) => parseISO(a.scheduled_for).getTime() - parseISO(b.scheduled_for).getTime())
                          .map(item => (
                          <div key={item.id} className={`
                            flex items-center gap-4 p-3 border rounded-lg border-l-4 transition-colors
                            hover:bg-gray-50 ${getUrgencyColor(item.scheduled_for)}
                          `}>
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(item.content_type)}
                              <div className="text-sm text-gray-500">
                                {format(parseISO(item.scheduled_for), 'HH:mm')}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{item.title}</h4>
                                <Badge variant="outline" className={`${getStatusColor(item.status)} text-xs`}>
                                  {getStatusIcon(item.status)}
                                  <span className="ml-1">{item.status}</span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{item.content_type.replace('_', ' ')}</span>
                                <span>Priority: {item.priority}/10</span>
                                {item.retry_count > 0 && (
                                  <span>Retry: {item.retry_count}/{item.max_retries}</span>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleContentAction('view', item)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleContentAction('edit', item)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleContentAction('cancel', item)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Queue Management Tab */}
          <TabsContent value="queue" className="space-y-4">
            {queue && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Publications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Publications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {queue.upcoming.slice(0, 10).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            {getContentTypeIcon(item.content_type)}
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-gray-500">
                                {format(parseISO(item.scheduled_for), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Approval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queue.pending.length === 0 ? (
                      <p className="text-gray-500">No items pending approval</p>
                    ) : (
                      <div className="space-y-3">
                        {queue.pending.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              {getContentTypeIcon(item.content_type)}
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-gray-500">
                                  Scheduled for {format(parseISO(item.scheduled_for), 'MMM d, HH:mm')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Pause className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Content Details Dialog */}
        <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Content Details</DialogTitle>
            </DialogHeader>
            
            {selectedContent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Title</Label>
                    <p className="font-medium">{selectedContent.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={getStatusColor(selectedContent.status)}>
                      {getStatusIcon(selectedContent.status)}
                      <span className="ml-1">{selectedContent.status}</span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Content Type</Label>
                    <p>{selectedContent.content_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    <p>{selectedContent.priority}/10</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Scheduled For</Label>
                    <p>{format(parseISO(selectedContent.scheduled_for), 'PPP pp')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Timezone</Label>
                    <p>{selectedContent.timezone}</p>
                  </div>
                </div>

                {selectedContent.error_message && (
                  <div>
                    <Label className="text-sm font-medium text-red-600">Error Message</Label>
                    <p className="text-red-700 bg-red-50 p-2 rounded">
                      {selectedContent.error_message}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowContentDialog(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={() => handleContentAction('edit', selectedContent)}>
                    Edit Schedule
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default SchedulingDashboard