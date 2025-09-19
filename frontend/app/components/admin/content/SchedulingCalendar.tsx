/**
 * Scheduling Calendar Component
 * Interactive calendar interface for scheduling content publication
 * Part of Story 1.4 Task 7 - Content Scheduling System
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ScheduledContent,
  SchedulingStatus, 
  ContentType,
  ConflictDetection,
  NotificationSettings
} from '@/lib/services/content-scheduler'
import { logger } from '@/lib/logger'

// ================================
// Types and Interfaces
// ================================

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  scheduledItems: ScheduledContent[]
}

interface SchedulingFormData {
  contentType: ContentType
  contentId: string
  title: string
  scheduledFor: string
  timezone: string
  priority: number
  autoSocialShare: boolean
  notificationSettings: NotificationSettings
  metadata: Record<string, any>
}

interface SchedulingCalendarProps {
  onScheduleContent?: (data: SchedulingFormData) => Promise<void>
  onUpdateSchedule?: (id: string, data: Partial<SchedulingFormData>) => Promise<void>
  onCancelSchedule?: (id: string, reason?: string) => Promise<void>
  onRefresh?: () => Promise<void>
  className?: string
}

// ================================
// Calendar Component
// ================================

export function SchedulingCalendar({
  onScheduleContent,
  onUpdateSchedule,
  onCancelSchedule,
  onRefresh,
  className = ''
}: SchedulingCalendarProps) {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedContent, setSelectedContent] = useState<ScheduledContent | null>(null)
  const [availableContent, setAvailableContent] = useState<any[]>([])
  const [conflicts, setConflicts] = useState<ConflictDetection[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  // Form state
  const [formData, setFormData] = useState<SchedulingFormData>({
    contentType: ContentType.BLOG_POST,
    contentId: '',
    title: '',
    scheduledFor: '',
    timezone: 'America/New_York',
    priority: 5,
    autoSocialShare: false,
    notificationSettings: {
      channels: ['email'],
      recipients: [],
      send_on_success: true,
      send_on_failure: true,
      advance_notice_hours: [24, 2],
      custom_message: ''
    },
    metadata: {}
  })

  // ================================
  // Calendar Logic
  // ================================

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: CalendarDay[] = []
    let day = startDate

    while (day <= endDate) {
      const scheduledItems = scheduledContent.filter(item => 
        isSameDay(parseISO(item.scheduled_for), day)
      )

      days.push({
        date: new Date(day),
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isToday(day),
        isPast: isBefore(day, startOfDay(new Date())),
        scheduledItems
      })

      day = addDays(day, 1)
    }

    return days
  }, [currentDate, scheduledContent])

  // ================================
  // Data Fetching
  // ================================

  const fetchScheduledContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/admin/scheduling?date_from=${monthStart}&date_to=${monthEnd}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled content')
      }

      const result = await response.json()
      setScheduledContent(result.data || [])

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load calendar'
      setError(errorMessage)
      logger.error('Failed to fetch scheduled content for calendar', { error: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  const fetchAvailableContent = useCallback(async (contentType: ContentType) => {
    try {
      // This would fetch available content based on type
      // For now, we'll use a placeholder
      setAvailableContent([])
    } catch (error) {
      logger.error('Failed to fetch available content', { error })
    }
  }, [])

  const checkSchedulingConflicts = useCallback(async (scheduleData: any) => {
    try {
      setCheckingConflicts(true)
      setConflicts([])

      const response = await fetch('/api/admin/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          action: 'check_conflicts',
          data: scheduleData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to check conflicts')
      }

      const result = await response.json()
      setConflicts(result.data.conflicts || [])

    } catch (error) {
      logger.error('Failed to check scheduling conflicts', { error })
    } finally {
      setCheckingConflicts(false)
    }
  }, [])

  // ================================
  // Event Handlers
  // ================================

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const handleDayClick = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) {
      return // Can't schedule in the past
    }

    setSelectedDate(date)
    setFormData(prev => ({
      ...prev,
      scheduledFor: format(date, "yyyy-MM-dd'T'09:00")
    }))
    setShowScheduleDialog(true)
  }

  const handleContentItemClick = (content: ScheduledContent) => {
    setSelectedContent(content)
    setFormData({
      contentType: content.content_type,
      contentId: content.content_id,
      title: content.title,
      scheduledFor: format(parseISO(content.scheduled_for), "yyyy-MM-dd'T'HH:mm"),
      timezone: content.timezone,
      priority: content.priority,
      autoSocialShare: content.auto_social_share,
      notificationSettings: content.notification_settings,
      metadata: content.metadata
    })
    setShowScheduleDialog(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedContent) {
        // Update existing schedule
        await onUpdateSchedule?.(selectedContent.id, formData)
      } else {
        // Schedule new content
        await onScheduleContent?.(formData)
      }

      setShowScheduleDialog(false)
      setSelectedContent(null)
      setSelectedDate(null)
      await fetchScheduledContent()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scheduling failed'
      setError(errorMessage)
    }
  }

  const handleCancelSchedule = async (id: string) => {
    try {
      await onCancelSchedule?.(id, 'Cancelled from calendar')
      await fetchScheduledContent()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cancellation failed'
      setError(errorMessage)
    }
  }

  // ================================
  // Effects
  // ================================

  useEffect(() => {
    fetchScheduledContent()
  }, [fetchScheduledContent])

  useEffect(() => {
    if (formData.contentType) {
      fetchAvailableContent(formData.contentType)
    }
  }, [formData.contentType, fetchAvailableContent])

  useEffect(() => {
    if (formData.scheduledFor && formData.contentId) {
      checkSchedulingConflicts(formData)
    }
  }, [formData.scheduledFor, formData.contentId, checkSchedulingConflicts])

  // ================================
  // Utility Functions
  // ================================

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
        return <Clock className="w-3 h-3" />
      case SchedulingStatus.PROCESSING:
        return <Clock className="w-3 h-3 animate-spin" />
      case SchedulingStatus.PUBLISHED:
        return <CheckCircle2 className="w-3 h-3" />
      case SchedulingStatus.FAILED:
        return <AlertTriangle className="w-3 h-3" />
      case SchedulingStatus.CANCELLED:
        return <X className="w-3 h-3" />
      default:
        return null
    }
  }

  // ================================
  // Render
  // ================================

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading calendar...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className={className}>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Content Scheduling Calendar
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-lg font-medium min-w-[140px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-1 border rounded-md cursor-pointer transition-colors
                    ${day.isCurrentMonth 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'bg-gray-50'
                    }
                    ${day.isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    ${day.isPast ? 'cursor-not-allowed opacity-60' : ''}
                  `}
                  onClick={() => !day.isPast && handleDayClick(day.date)}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isToday ? 'text-blue-600' : ''}
                  `}>
                    {format(day.date, 'd')}
                  </div>

                  {/* Scheduled Items */}
                  <div className="space-y-1">
                    {day.scheduledItems.slice(0, 3).map(item => (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              px-2 py-1 rounded text-xs cursor-pointer
                              border ${getStatusColor(item.status)}
                              hover:shadow-sm
                            `}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleContentItemClick(item)
                            }}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              <span className="truncate">{item.title}</span>
                            </div>
                            <div className="text-xs opacity-70">
                              {format(parseISO(item.scheduled_for), 'HH:mm')}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm opacity-80">
                              {format(parseISO(item.scheduled_for), 'MMM d, yyyy HH:mm')}
                            </div>
                            <div className="text-sm opacity-80">
                              Status: {item.status}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}

                    {day.scheduledItems.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{day.scheduledItems.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Add Button for Empty Days */}
                  {day.scheduledItems.length === 0 && !day.isPast && (
                    <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedContent ? 'Update Schedule' : 'Schedule Content'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Content Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, contentType: value as ContentType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ContentType.BLOG_POST}>Blog Post</SelectItem>
                      <SelectItem value={ContentType.PAGE}>Page</SelectItem>
                      <SelectItem value={ContentType.PLATFORM}>Platform</SelectItem>
                      <SelectItem value={ContentType.SERVICE}>Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>

              {/* Title and Scheduling Time */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Content title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledFor">Scheduled Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conflict Detection */}
              {checkingConflicts && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Checking for conflicts...
                </div>
              )}

              {conflicts.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Scheduling conflicts detected:</div>
                      {conflicts.map((conflict, index) => (
                        <div key={index} className={`
                          text-sm p-2 rounded border-l-4
                          ${conflict.severity === 'high' ? 'border-red-500 bg-red-50' :
                            conflict.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-blue-500 bg-blue-50'
                          }
                        `}>
                          <div className="font-medium">{conflict.description}</div>
                          {conflict.suggestions.length > 0 && (
                            <div className="text-xs mt-1">
                              Suggestions: {conflict.suggestions.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleDialog(false)}
                >
                  Cancel
                </Button>
                
                {selectedContent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      handleCancelSchedule(selectedContent.id)
                      setShowScheduleDialog(false)
                    }}
                  >
                    Cancel Schedule
                  </Button>
                )}
                
                <Button type="submit">
                  {selectedContent ? 'Update Schedule' : 'Schedule Content'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default SchedulingCalendar