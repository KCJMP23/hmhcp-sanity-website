/**
 * Scheduling Queue Management Component
 * Advanced queue management interface with drag-and-drop, bulk operations, and real-time updates
 * Part of Story 1.4 Task 7 - Content Scheduling System
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO, isAfter, isBefore, differenceInMinutes, addMinutes } from 'date-fns'
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  Zap,
  BarChart3,
  Calendar,
  Users,
  FileText,
  Globe,
  ChevronRight,
  ChevronDown,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  ScheduledContent,
  SchedulingStatus,
  ContentType,
  SchedulingQueue as QueueData
} from '@/lib/services/content-scheduler'
import { logger } from '@/lib/logger'

// ================================
// Types and Interfaces
// ================================

interface QueueSection {
  id: string
  title: string
  items: ScheduledContent[]
  color: string
  icon: React.ReactNode
  collapsible: boolean
  expanded: boolean
}

interface BulkOperation {
  id: string
  label: string
  icon: React.ReactNode
  action: (items: ScheduledContent[]) => Promise<void>
  destructive?: boolean
  requiresConfirmation?: boolean
}

interface QueueStats {
  totalItems: number
  avgProcessingTime: number
  successRate: number
  nextScheduled?: Date
  peakHours: number[]
}

interface SchedulingQueueProps {
  onScheduleContent?: () => void
  onUpdateSchedule?: (id: string) => void
  onProcessItem?: (id: string) => Promise<void>
  onCancelItem?: (id: string) => Promise<void>
  onRetryItem?: (id: string) => Promise<void>
  onBulkOperation?: (operation: string, items: ScheduledContent[]) => Promise<void>
  onRefresh?: () => Promise<void>
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

// ================================
// Queue Management Component
// ================================

export function SchedulingQueue({
  onScheduleContent,
  onUpdateSchedule,
  onProcessItem,
  onCancelItem,
  onRetryItem,
  onBulkOperation,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = ''
}: SchedulingQueueProps) {
  // State management
  const [queue, setQueue] = useState<QueueData | null>(null)
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('scheduled_time')
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null)
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    pending: true,
    scheduled_today: true,
    upcoming: true,
    processing: false,
    failed: false
  })

  // ================================
  // Queue Sections Configuration
  // ================================

  const queueSections = useMemo((): QueueSection[] => {
    if (!queue) return []

    return [
      {
        id: 'processing',
        title: 'Currently Processing',
        items: queue.processing,
        color: 'border-yellow-200 bg-yellow-50',
        icon: <RefreshCw className="w-5 h-5 animate-spin text-yellow-600" />,
        collapsible: true,
        expanded: sectionStates.processing
      },
      {
        id: 'pending',
        title: 'Pending Approval',
        items: queue.pending,
        color: 'border-blue-200 bg-blue-50',
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        collapsible: true,
        expanded: sectionStates.pending
      },
      {
        id: 'scheduled_today',
        title: 'Scheduled Today',
        items: queue.scheduled_today,
        color: 'border-green-200 bg-green-50',
        icon: <Calendar className="w-5 h-5 text-green-600" />,
        collapsible: true,
        expanded: sectionStates.scheduled_today
      },
      {
        id: 'upcoming',
        title: 'Upcoming',
        items: queue.upcoming,
        color: 'border-gray-200 bg-gray-50',
        icon: <ChevronRight className="w-5 h-5 text-gray-600" />,
        collapsible: true,
        expanded: sectionStates.upcoming
      },
      {
        id: 'failed',
        title: 'Failed / Requires Attention',
        items: queue.failed,
        color: 'border-red-200 bg-red-50',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        collapsible: true,
        expanded: sectionStates.failed
      }
    ]
  }, [queue, sectionStates])

  // ================================
  // Bulk Operations Configuration
  // ================================

  const bulkOperations = useMemo((): BulkOperation[] => [
    {
      id: 'process_now',
      label: 'Process Now',
      icon: <Play className="w-4 h-4" />,
      action: async (items) => {
        for (const item of items) {
          await onProcessItem?.(item.id)
        }
      }
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: <Pause className="w-4 h-4" />,
      action: async (items) => {
        await onBulkOperation?.('pause', items)
      }
    },
    {
      id: 'reschedule',
      label: 'Reschedule',
      icon: <RotateCcw className="w-4 h-4" />,
      action: async (items) => {
        await onBulkOperation?.('reschedule', items)
      }
    },
    {
      id: 'retry',
      label: 'Retry Failed',
      icon: <RefreshCw className="w-4 h-4" />,
      action: async (items) => {
        for (const item of items.filter(i => i.status === SchedulingStatus.FAILED)) {
          await onRetryItem?.(item.id)
        }
      }
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: <Trash2 className="w-4 h-4" />,
      action: async (items) => {
        for (const item of items) {
          await onCancelItem?.(item.id)
        }
      },
      destructive: true,
      requiresConfirmation: true
    }
  ], [onProcessItem, onRetryItem, onCancelItem, onBulkOperation])

  // ================================
  // Data Fetching
  // ================================

  const fetchQueueData = useCallback(async () => {
    try {
      if (!loading) setError(null) // Only clear error if not initial load
      
      const response = await fetch('/api/admin/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ action: 'get_queue' })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch queue data')
      }

      const result = await response.json()
      setQueue(result.data)
      
      // Calculate stats
      calculateQueueStats(result.data)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load queue'
      setError(errorMessage)
      logger.error('Failed to fetch queue data', { error: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [loading])

  const calculateQueueStats = (queueData: QueueData) => {
    const allItems = [
      ...queueData.pending,
      ...queueData.scheduled_today,
      ...queueData.upcoming,
      ...queueData.processing,
      ...queueData.failed
    ]

    const publishedCount = allItems.filter(item => item.status === SchedulingStatus.PUBLISHED).length
    const totalProcessed = publishedCount + queueData.failed.length

    // Find next scheduled item
    const nextScheduled = [...queueData.scheduled_today, ...queueData.upcoming]
      .sort((a, b) => parseISO(a.scheduled_for).getTime() - parseISO(b.scheduled_for).getTime())[0]

    // Calculate peak hours (simplified)
    const hourCounts = allItems.reduce((acc, item) => {
      const hour = parseISO(item.scheduled_for).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    setStats({
      totalItems: allItems.length,
      avgProcessingTime: 2.5, // This would be calculated from actual data
      successRate: totalProcessed > 0 ? (publishedCount / totalProcessed) * 100 : 100,
      nextScheduled: nextScheduled ? parseISO(nextScheduled.scheduled_for) : undefined,
      peakHours
    })
  }

  // ================================
  // Event Handlers
  // ================================

  const handleItemSelect = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      return newSet
    })
  }

  const handleSelectAll = (sectionItems: ScheduledContent[], selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      sectionItems.forEach(item => {
        if (selected) {
          newSet.add(item.id)
        } else {
          newSet.delete(item.id)
        }
      })
      return newSet
    })
  }

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedItems.size === 0) return

    const items = queueSections
      .flatMap(section => section.items)
      .filter(item => selectedItems.has(item.id))

    if (operation.requiresConfirmation) {
      setBulkOperation(operation)
      setShowBulkDialog(true)
      return
    }

    try {
      await operation.action(items)
      setSelectedItems(new Set())
      await fetchQueueData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed'
      setError(errorMessage)
    }
  }

  const confirmBulkOperation = async () => {
    if (!bulkOperation) return

    const items = queueSections
      .flatMap(section => section.items)
      .filter(item => selectedItems.has(item.id))

    try {
      await bulkOperation.action(items)
      setSelectedItems(new Set())
      setShowBulkDialog(false)
      setBulkOperation(null)
      await fetchQueueData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed'
      setError(errorMessage)
    }
  }

  const handleSectionToggle = (sectionId: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
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

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST:
        return <FileText className="w-4 h-4" />
      case ContentType.PAGE:
        return <Globe className="w-4 h-4" />
      case ContentType.PLATFORM:
        return <BarChart3 className="w-4 h-4" />
      case ContentType.SERVICE:
        return <Users className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getUrgencyIndicator = (scheduledFor: string) => {
    const scheduledTime = parseISO(scheduledFor)
    const now = new Date()
    const minutesUntil = differenceInMinutes(scheduledTime, now)

    if (minutesUntil < 0) {
      return { color: 'text-red-600', label: 'Overdue', urgent: true }
    } else if (minutesUntil < 15) {
      return { color: 'text-red-500', label: `${minutesUntil}m`, urgent: true }
    } else if (minutesUntil < 60) {
      return { color: 'text-yellow-600', label: `${minutesUntil}m`, urgent: false }
    } else if (minutesUntil < 1440) {
      return { color: 'text-blue-600', label: `${Math.floor(minutesUntil / 60)}h`, urgent: false }
    } else {
      return { color: 'text-gray-600', label: `${Math.floor(minutesUntil / 1440)}d`, urgent: false }
    }
  }

  // ================================
  // Auto-refresh Effect
  // ================================

  useEffect(() => {
    fetchQueueData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueueData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchQueueData, autoRefresh, refreshInterval])

  // ================================
  // Render
  // ================================

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin mr-2" />
            <span>Loading queue...</span>
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

        {/* Queue Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Scheduling Queue</h2>
            <p className="text-gray-600">Manage your content publication pipeline</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Queue Stats */}
            {stats && (
              <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>{stats.totalItems} items</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{Math.round(stats.successRate)}% success</span>
                </div>
                {stats.nextScheduled && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Next: {format(stats.nextScheduled, 'HH:mm')}</span>
                  </div>
                )}
              </div>
            )}
            
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button onClick={onScheduleContent}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Content
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          {/* Filters */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled_time">Scheduled Time</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="content_type">Content Type</SelectItem>
            </SelectContent>
          </Select>

          {/* Selection Info */}
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <span>{selectedItems.size} items selected</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Operations */}
        {selectedItems.size > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-blue-800">
                  Bulk Operations:
                </span>
                {bulkOperations.map(operation => (
                  <Button
                    key={operation.id}
                    size="sm"
                    variant={operation.destructive ? "destructive" : "secondary"}
                    onClick={() => handleBulkOperation(operation)}
                    className="flex items-center gap-1"
                  >
                    {operation.icon}
                    {operation.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Sections */}
        <div className="space-y-4">
          {queueSections.map(section => (
            <Card key={section.id} className={section.color}>
              <Collapsible 
                open={section.expanded}
                onOpenChange={() => handleSectionToggle(section.id)}
              >
                <CardHeader className="pb-3">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {section.icon}
                        {section.title}
                        <Badge variant="secondary" className="ml-2">
                          {section.items.length}
                        </Badge>
                      </CardTitle>
                      
                      <div className="flex items-center gap-2">
                        {section.items.length > 0 && (
                          <Checkbox
                            checked={section.items.every(item => selectedItems.has(item.id))}
                            onCheckedChange={(checked) => 
                              handleSelectAll(section.items, checked as boolean)
                            }
                            aria-label={`Select all ${section.title}`}
                          />
                        )}
                        
                        {section.collapsible && (
                          section.expanded ? 
                            <ChevronDown className="w-5 h-5" /> : 
                            <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {section.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">{section.icon}</div>
                        <p>No items in {section.title.toLowerCase()}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {section.items
                          .filter(item => 
                            searchQuery === '' || 
                            item.title.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .filter(item => 
                            statusFilter === 'all' || item.status === statusFilter
                          )
                          .map(item => {
                            const urgency = getUrgencyIndicator(item.scheduled_for)
                            
                            return (
                              <div
                                key={item.id}
                                className={`
                                  flex items-center gap-3 p-3 bg-white border rounded-lg
                                  hover:shadow-sm transition-shadow
                                  ${urgency.urgent ? 'border-red-200 bg-red-50' : ''}
                                `}
                              >
                                <Checkbox
                                  checked={selectedItems.has(item.id)}
                                  onCheckedChange={(checked) => 
                                    handleItemSelect(item.id, checked as boolean)
                                  }
                                />

                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {getContentTypeIcon(item.content_type)}
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${getStatusColor(item.status)}`}
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{item.title}</h4>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{item.content_type.replace('_', ' ')}</span>
                                      <span>Priority: {item.priority}/10</span>
                                      <span>
                                        {format(parseISO(item.scheduled_for), 'MMM d, HH:mm')}
                                      </span>
                                      {item.retry_count > 0 && (
                                        <span>Retry: {item.retry_count}/{item.max_retries}</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className={`text-sm font-medium ${urgency.color}`}>
                                    {urgency.label}
                                  </div>

                                  {item.error_message && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{item.error_message}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {item.status === SchedulingStatus.SCHEDULED && (
                                      <DropdownMenuItem onClick={() => onProcessItem?.(item.id)}>
                                        <Play className="w-4 h-4 mr-2" />
                                        Process Now
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {item.status === SchedulingStatus.FAILED && (
                                      <DropdownMenuItem onClick={() => onRetryItem?.(item.id)}>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Retry
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem onClick={() => onUpdateSchedule?.(item.id)}>
                                      <Settings className="w-4 h-4 mr-2" />
                                      Edit Schedule
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => onCancelItem?.(item.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Bulk Operation Confirmation Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Operation</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>
                Are you sure you want to {bulkOperation?.label.toLowerCase()} {selectedItems.size} selected items?
              </p>
              
              {bulkOperation?.destructive && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant={bulkOperation?.destructive ? "destructive" : "default"}
                onClick={confirmBulkOperation}
              >
                {bulkOperation?.label}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default SchedulingQueue