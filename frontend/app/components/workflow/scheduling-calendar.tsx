'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Repeat,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Share2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScheduledPublication } from '@/lib/dal/workflow'

// Timezone list (commonly used timezones)
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)', offset: 'UTC+10/+11' }
]

const RECURRING_PATTERNS = [
  { value: 'none', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
]

const STATUS_COLORS = {
  scheduled: 'text-blue-600 bg-blue-50 border-blue-200',
  published: 'text-green-600 bg-green-50 border-green-200',
  failed: 'text-red-600 bg-red-50 border-red-200',
  cancelled: 'text-gray-600 bg-gray-50 border-gray-200'
}

const STATUS_ICONS = {
  scheduled: Clock,
  published: CheckCircle,
  failed: XCircle,
  cancelled: PauseCircle
}

interface SchedulingCalendarProps {
  publications: ScheduledPublication[]
  onCreatePublication?: (publication: Omit<ScheduledPublication, 'id' | 'created_at' | 'updated_at'>) => Promise<ScheduledPublication>
  onUpdatePublication?: (id: string, updates: Partial<ScheduledPublication>) => Promise<ScheduledPublication>
  onDeletePublication?: (id: string) => Promise<void>
  onRetryPublication?: (id: string) => Promise<void>
  timezone?: string
  className?: string
}

interface CalendarViewState {
  currentDate: Date
  viewMode: 'month' | 'week' | 'day'
  filterStatus: string[]
}

export function SchedulingCalendar({
  publications = [],
  onCreatePublication,
  onUpdatePublication,
  onDeletePublication,
  onRetryPublication,
  timezone = 'UTC',
  className
}: SchedulingCalendarProps) {
  const [viewState, setViewState] = useState<CalendarViewState>({
    currentDate: new Date(),
    viewMode: 'month',
    filterStatus: []
  })
  
  const [isCreating, setIsCreating] = useState(false)
  const [editingPublication, setEditingPublication] = useState<ScheduledPublication | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Filter publications based on status filter
  const filteredPublications = useMemo(() => {
    if (viewState.filterStatus.length === 0) return publications
    return publications.filter(pub => viewState.filterStatus.includes(pub.status))
  }, [publications, viewState.filterStatus])

  // Get publications for current view
  const getPublicationsForPeriod = useCallback((startDate: Date, endDate: Date) => {
    return filteredPublications.filter(pub => {
      const pubDate = new Date(pub.scheduled_for)
      return pubDate >= startDate && pubDate <= endDate
    })
  }, [filteredPublications])

  // Navigation functions
  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    setViewState(prev => {
      const newDate = new Date(prev.currentDate)
      
      switch (prev.viewMode) {
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
          break
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
          break
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
          break
      }
      
      return { ...prev, currentDate: newDate }
    })
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Publishing Schedule</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {TIMEZONES.find(tz => tz.value === timezone)?.label || timezone}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {viewState.filterStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {viewState.filterStatus.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter by Status</Label>
                {Object.keys(STATUS_COLORS).map(status => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={viewState.filterStatus.includes(status)}
                      onChange={(e) => {
                        setViewState(prev => ({
                          ...prev,
                          filterStatus: e.target.checked
                            ? [...prev.filterStatus, status]
                            : prev.filterStatus.filter(s => s !== status)
                        }))
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            {(['month', 'week', 'day'] as const).map(mode => (
              <Button
                key={mode}
                variant={viewState.viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewState(prev => ({ ...prev, viewMode: mode }))}
                className="rounded-none border-0"
              >
                {mode}
              </Button>
            ))}
          </div>

          {/* Create Publication */}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Publication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Publication</DialogTitle>
              </DialogHeader>
              <SchedulePublicationForm
                onSubmit={async (data) => {
                  if (onCreatePublication) {
                    await onCreatePublication(data)
                    setIsCreating(false)
                  }
                }}
                onCancel={() => setIsCreating(false)}
                timezone={timezone}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium ml-4">
            {viewState.viewMode === 'month' && 
              viewState.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewState.viewMode === 'week' && 
              `Week of ${viewState.currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewState.viewMode === 'day' && 
              viewState.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewState(prev => ({ ...prev, currentDate: new Date() }))}
        >
          Today
        </Button>
      </div>

      {/* Calendar View */}
      <div className="bg-white border rounded-lg">
        {viewState.viewMode === 'month' && (
          <MonthView
            currentDate={viewState.currentDate}
            publications={filteredPublications}
            onEditPublication={setEditingPublication}
            onDeletePublication={onDeletePublication}
            onRetryPublication={onRetryPublication}
            timezone={timezone}
          />
        )}
        
        {viewState.viewMode === 'week' && (
          <WeekView
            currentDate={viewState.currentDate}
            publications={filteredPublications}
            onEditPublication={setEditingPublication}
            onDeletePublication={onDeletePublication}
            onRetryPublication={onRetryPublication}
            timezone={timezone}
          />
        )}
        
        {viewState.viewMode === 'day' && (
          <DayView
            currentDate={viewState.currentDate}
            publications={filteredPublications}
            onEditPublication={setEditingPublication}
            onDeletePublication={onDeletePublication}
            onRetryPublication={onRetryPublication}
            timezone={timezone}
          />
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">
                  {publications.filter(p => p.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">
                  {publications.filter(p => p.status === 'published').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold">
                  {publications.filter(p => p.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {publications.length > 0 
                    ? Math.round((publications.filter(p => p.status === 'published').length / publications.length) * 100)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Publication Dialog */}
      <Dialog open={!!editingPublication} onOpenChange={() => setEditingPublication(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Publication</DialogTitle>
          </DialogHeader>
          {editingPublication && (
            <SchedulePublicationForm
              initialData={editingPublication}
              onSubmit={async (data) => {
                if (onUpdatePublication && editingPublication) {
                  await onUpdatePublication(editingPublication.id, data)
                  setEditingPublication(null)
                }
              }}
              onCancel={() => setEditingPublication(null)}
              timezone={timezone}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Month Calendar View
function MonthView({
  currentDate,
  publications,
  onEditPublication,
  onDeletePublication,
  onRetryPublication,
  timezone
}: {
  currentDate: Date
  publications: ScheduledPublication[]
  onEditPublication: (pub: ScheduledPublication) => void
  onDeletePublication?: (id: string) => Promise<void>
  onRetryPublication?: (id: string) => Promise<void>
  timezone: string
}) {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startOfCalendar = new Date(startOfMonth)
  startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay())
  
  const days = []
  const current = new Date(startOfCalendar)
  
  while (current <= endOfMonth || current.getDay() !== 0) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map(day => {
        const dayPublications = publications.filter(pub => {
          const pubDate = new Date(pub.scheduled_for)
          return pubDate.toDateString() === day.toDateString()
        })
        
        const isCurrentMonth = day.getMonth() === currentDate.getMonth()
        const isToday = day.toDateString() === new Date().toDateString()
        
        return (
          <div
            key={day.toISOString()}
            className={cn(
              'bg-white p-2 min-h-24 border-b border-r',
              !isCurrentMonth && 'bg-gray-50 text-gray-400'
            )}
          >
            <div className={cn(
              'text-sm font-medium mb-1',
              isToday && 'text-blue-600 font-bold'
            )}>
              {day.getDate()}
            </div>
            
            <div className="space-y-1">
              {dayPublications.slice(0, 3).map(pub => (
                <PublicationItem
                  key={pub.id}
                  publication={pub}
                  variant="compact"
                  onEdit={() => onEditPublication(pub)}
                  onDelete={onDeletePublication}
                  onRetry={onRetryPublication}
                />
              ))}
              
              {dayPublications.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{dayPublications.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Week Calendar View
function WeekView({
  currentDate,
  publications,
  onEditPublication,
  onDeletePublication,
  onRetryPublication,
  timezone
}: {
  currentDate: Date
  publications: ScheduledPublication[]
  onEditPublication: (pub: ScheduledPublication) => void
  onDeletePublication?: (id: string) => Promise<void>
  onRetryPublication?: (id: string) => Promise<void>
  timezone: string
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {weekDays.map(day => {
        const dayPublications = publications.filter(pub => {
          const pubDate = new Date(pub.scheduled_for)
          return pubDate.toDateString() === day.toDateString()
        })
        
        const isToday = day.toDateString() === new Date().toDateString()
        
        return (
          <div key={day.toISOString()} className="bg-white p-4 min-h-96">
            <div className={cn(
              'font-medium mb-3 pb-2 border-b',
              isToday && 'text-blue-600 border-blue-200'
            )}>
              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
            
            <div className="space-y-2">
              {dayPublications.map(pub => (
                <PublicationItem
                  key={pub.id}
                  publication={pub}
                  variant="detailed"
                  onEdit={() => onEditPublication(pub)}
                  onDelete={onDeletePublication}
                  onRetry={onRetryPublication}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Day Calendar View  
function DayView({
  currentDate,
  publications,
  onEditPublication,
  onDeletePublication,
  onRetryPublication,
  timezone
}: {
  currentDate: Date
  publications: ScheduledPublication[]
  onEditPublication: (pub: ScheduledPublication) => void
  onDeletePublication?: (id: string) => Promise<void>
  onRetryPublication?: (id: string) => Promise<void>
  timezone: string
}) {
  const dayPublications = publications.filter(pub => {
    const pubDate = new Date(pub.scheduled_for)
    return pubDate.toDateString() === currentDate.toDateString()
  }).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())

  return (
    <div className="p-6">
      <div className="space-y-4">
        {dayPublications.length > 0 ? (
          dayPublications.map(pub => (
            <PublicationItem
              key={pub.id}
              publication={pub}
              variant="full"
              onEdit={() => onEditPublication(pub)}
              onDelete={onDeletePublication}
              onRetry={onRetryPublication}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No publications scheduled</h3>
            <p>No publications are scheduled for this day.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Publication Item Component
function PublicationItem({
  publication,
  variant = 'detailed',
  onEdit,
  onDelete,
  onRetry
}: {
  publication: ScheduledPublication
  variant?: 'compact' | 'detailed' | 'full'
  onEdit: () => void
  onDelete?: (id: string) => Promise<void>
  onRetry?: (id: string) => Promise<void>
}) {
  const StatusIcon = STATUS_ICONS[publication.status]
  const scheduledTime = new Date(publication.scheduled_for)

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          'p-1.5 rounded text-xs border cursor-pointer',
          STATUS_COLORS[publication.status]
        )}
        onClick={onEdit}
      >
        <div className="flex items-center gap-1">
          <StatusIcon className="h-3 w-3" />
          <span className="truncate">{scheduledTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })}</span>
        </div>
      </motion.div>
    )
  }

  if (variant === 'detailed') {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onEdit}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className={STATUS_COLORS[publication.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {publication.status}
            </Badge>
            <span className="text-xs text-gray-500">
              {scheduledTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          {publication.recurring_pattern && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Repeat className="h-3 w-3" />
              Recurring
            </div>
          )}
          
          {publication.social_media_config && Object.keys(publication.social_media_config).length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Share2 className="h-3 w-3" />
              Social Media
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              STATUS_COLORS[publication.status]
            )}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Publication #{publication.id.slice(-8)}</h3>
              <p className="text-sm text-gray-600">
                Scheduled for {scheduledTime.toLocaleString('en-US')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {publication.status === 'failed' && onRetry && (
              <Button variant="outline" size="sm" onClick={() => onRetry(publication.id)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(publication.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={STATUS_COLORS[publication.status]}>
              {publication.status}
            </Badge>
            
            {publication.recurring_pattern && (
              <Badge variant="outline">
                <Repeat className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
            
            <Badge variant="outline">
              <Globe className="h-3 w-3 mr-1" />
              {publication.timezone}
            </Badge>
          </div>
          
          {publication.status === 'failed' && publication.failure_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Publication Failed</p>
                  <p className="text-sm text-red-700">{publication.failure_reason}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Retry attempt {publication.retry_count} of {publication.max_retries}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {publication.social_media_config && Object.keys(publication.social_media_config).length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Social Media Configuration</h4>
              <div className="text-xs text-gray-600">
                {Object.keys(publication.social_media_config).join(', ')} platforms configured
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Schedule Publication Form
function SchedulePublicationForm({
  initialData,
  onSubmit,
  onCancel,
  timezone
}: {
  initialData?: Partial<ScheduledPublication>
  onSubmit: (data: Omit<ScheduledPublication, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
  timezone: string
}) {
  const [formData, setFormData] = useState({
    content_id: initialData?.content_id || '',
    scheduled_for: initialData?.scheduled_for || new Date().toISOString().slice(0, 16),
    timezone: initialData?.timezone || timezone,
    recurring_pattern: initialData?.recurring_pattern || null,
    social_media_config: initialData?.social_media_config || {},
    max_retries: initialData?.max_retries || 3
  })

  const [recurringType, setRecurringType] = useState(
    initialData?.recurring_pattern?.type || 'none'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      status: 'scheduled' as const,
      retry_count: 0,
      recurring_pattern: recurringType !== 'none' ? {
        type: recurringType,
        ...formData.recurring_pattern
      } : null,
      created_by: 'current-user-id' // This should come from auth context
    }

    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_for">Schedule Date & Time</Label>
          <Input
            id="scheduled_for"
            type="datetime-local"
            value={formData.scheduled_for}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring">Recurring Pattern</Label>
        <Select value={recurringType} onValueChange={setRecurringType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECURRING_PATTERNS.map(pattern => (
              <SelectItem key={pattern.value} value={pattern.value}>
                {pattern.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_retries">Maximum Retry Attempts</Label>
        <Input
          id="max_retries"
          type="number"
          min="0"
          max="10"
          value={formData.max_retries}
          onChange={(e) => setFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Schedule' : 'Schedule Publication'}
        </Button>
      </div>
    </form>
  )
}