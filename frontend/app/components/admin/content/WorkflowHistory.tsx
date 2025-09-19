/**
 * Workflow History Component
 * Displays workflow transition history and timeline
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  User,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ================================
// Types
// ================================

interface WorkflowTransitionLog {
  id: string
  workflowInstanceId: string
  fromState: string
  toState: string
  action: string
  performedBy: string
  performedByRole: string
  comment?: string
  metadata?: Record<string, any>
  timestamp: string
  durationMs?: number
}

interface WorkflowHistoryProps {
  workflowId?: string
  contentType?: string
  contentId?: string
  userId?: string
  showFilters?: boolean
  maxItems?: number
  onTransitionClick?: (transition: WorkflowTransitionLog) => void
}

// ================================
// State Badge Component
// ================================

const StateBadge: React.FC<{ state: string; size?: 'sm' | 'md' }> = ({ 
  state, 
  size = 'sm' 
}) => {
  const getStateConfig = (state: string) => {
    switch (state.toLowerCase()) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', icon: FileText }
      case 'review':
        return { color: 'bg-blue-100 text-blue-800', icon: Eye }
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: X }
      case 'published':
        return { color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
      case 'archived':
        return { color: 'bg-gray-100 text-gray-600', icon: FileText }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: FileText }
    }
  }

  const config = getStateConfig(state)
  const Icon = config.icon
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <Badge className={cn(config.color, sizeClass)}>
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4', 'mr-1')} />
      {state.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}

// ================================
// Action Badge Component
// ================================

const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  const getActionConfig = (action: string) => {
    switch (action.toLowerCase()) {
      case 'submit_for_review':
        return { color: 'bg-blue-50 text-blue-700', label: 'Submitted for Review' }
      case 'approve':
        return { color: 'bg-green-50 text-green-700', label: 'Approved' }
      case 'reject':
        return { color: 'bg-red-50 text-red-700', label: 'Rejected' }
      case 'request_changes':
        return { color: 'bg-orange-50 text-orange-700', label: 'Changes Requested' }
      case 'publish':
        return { color: 'bg-purple-50 text-purple-700', label: 'Published' }
      case 'archive':
        return { color: 'bg-gray-50 text-gray-700', label: 'Archived' }
      case 'force_approve':
        return { color: 'bg-red-50 text-red-700', label: 'Force Approved' }
      default:
        return { color: 'bg-gray-50 text-gray-700', label: action.replace('_', ' ') }
    }
  }

  const config = getActionConfig(action)

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  )
}

// ================================
// Timeline Item Component
// ================================

const TimelineItem: React.FC<{
  transition: WorkflowTransitionLog
  isLast: boolean
  onClick?: () => void
}> = ({ transition, isLast, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return null
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return '<1m'
    }
  }

  return (
    <div className="relative flex items-start space-x-3">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />
      )}
      
      {/* Timeline Dot */}
      <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center">
        <ArrowRight className="w-3 h-3 text-blue-500" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <Card 
          className={cn(
            "transition-all duration-200 hover:shadow-md",
            onClick && "cursor-pointer hover:border-blue-300"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ActionBadge action={transition.action} />
                {transition.durationMs && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(transition.durationMs)}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(transition.timestamp)}
              </span>
            </div>
            
            {/* State Transition */}
            <div className="flex items-center space-x-2 mb-3">
              <StateBadge state={transition.fromState} />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <StateBadge state={transition.toState} />
            </div>
            
            {/* Performer */}
            <div className="flex items-center space-x-1 mb-2">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-600">
                {transition.performedBy}
              </span>
              <Badge variant="outline" className="text-xs">
                {transition.performedByRole}
              </Badge>
            </div>
            
            {/* Comment */}
            {transition.comment && (
              <div className="flex items-start space-x-2 mt-3 p-2 bg-gray-50 rounded-md">
                <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{transition.comment}</p>
              </div>
            )}
            
            {/* Metadata */}
            {transition.metadata && Object.keys(transition.metadata).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Additional details available
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ================================
// Transition Detail Dialog
// ================================

const TransitionDetailDialog: React.FC<{
  transition: WorkflowTransitionLog | null
  isOpen: boolean
  onClose: () => void
}> = ({ transition, isOpen, onClose }) => {
  if (!transition) return null

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Workflow Transition Details</DialogTitle>
          <DialogDescription>
            Complete information about this workflow transition
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Action</label>
              <div className="mt-1">
                <ActionBadge action={transition.action} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Timestamp</label>
              <p className="mt-1 text-sm">{formatTimestamp(transition.timestamp)}</p>
            </div>
          </div>
          
          {/* State Transition */}
          <div>
            <label className="text-sm font-medium text-gray-500">State Transition</label>
            <div className="mt-1 flex items-center space-x-2">
              <StateBadge state={transition.fromState} size="md" />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <StateBadge state={transition.toState} size="md" />
            </div>
          </div>
          
          {/* Performer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Performed By</label>
              <p className="mt-1 text-sm">{transition.performedBy}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="mt-1">
                <Badge variant="outline">{transition.performedByRole}</Badge>
              </div>
            </div>
          </div>
          
          {/* Duration */}
          {transition.durationMs && (
            <div>
              <label className="text-sm font-medium text-gray-500">Time in Previous State</label>
              <p className="mt-1 text-sm">
                {Math.floor(transition.durationMs / (1000 * 60 * 60))} hours and{' '}
                {Math.floor((transition.durationMs % (1000 * 60 * 60)) / (1000 * 60))} minutes
              </p>
            </div>
          )}
          
          {/* Comment */}
          {transition.comment && (
            <div>
              <label className="text-sm font-medium text-gray-500">Comment</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-sm">{transition.comment}</p>
              </div>
            </div>
          )}
          
          {/* Metadata */}
          {transition.metadata && Object.keys(transition.metadata).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Metadata</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <pre className="text-xs font-mono">
                  {JSON.stringify(transition.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {/* Technical Details */}
          <div className="pt-3 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-500">Technical Information</label>
            <div className="mt-1 grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Transition ID:</span>
                <br />
                {transition.id}
              </div>
              <div>
                <span className="font-medium">Workflow Instance:</span>
                <br />
                {transition.workflowInstanceId}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ================================
// Main WorkflowHistory Component
// ================================

export const WorkflowHistory: React.FC<WorkflowHistoryProps> = ({
  workflowId,
  contentType,
  contentId,
  userId,
  showFilters = true,
  maxItems,
  onTransitionClick
}) => {
  const [transitions, setTransitions] = useState<WorkflowTransitionLog[]>([])
  const [filteredTransitions, setFilteredTransitions] = useState<WorkflowTransitionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransitionLog | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    user: '',
    fromState: '',
    toState: ''
  })

  // Load transition history
  useEffect(() => {
    loadTransitionHistory()
  }, [workflowId, contentType, contentId, userId])

  // Apply filters
  useEffect(() => {
    let filtered = [...transitions]

    if (filters.search) {
      filtered = filtered.filter(t => 
        t.comment?.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.performedBy.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.action) {
      filtered = filtered.filter(t => t.action === filters.action)
    }

    if (filters.user) {
      filtered = filtered.filter(t => t.performedBy === filters.user)
    }

    if (filters.fromState) {
      filtered = filtered.filter(t => t.fromState === filters.fromState)
    }

    if (filters.toState) {
      filtered = filtered.filter(t => t.toState === filters.toState)
    }

    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }

    setFilteredTransitions(filtered)
  }, [transitions, filters, maxItems])

  const loadTransitionHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let url = '/api/admin/workflow/transitions'
      const params = new URLSearchParams()

      if (workflowId) params.append('workflowId', workflowId)
      if (contentType) params.append('contentType', contentType)
      if (contentId) params.append('contentId', contentId)
      if (userId) params.append('userId', userId)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          'x-user-id': 'admin-user', // This would come from auth context
          'x-user-role': 'admin'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load transition history: ${response.statusText}`)
      }

      const data = await response.json()
      setTransitions(data.data.transitions || data.data || [])

    } catch (err) {
      console.error('Failed to load transition history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transition history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransitionClick = (transition: WorkflowTransitionLog) => {
    if (onTransitionClick) {
      onTransitionClick(transition)
    } else {
      setSelectedTransition(transition)
      setDetailDialogOpen(true)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading workflow history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <X className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-red-600">Error Loading History</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadTransitionHistory} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Workflow History</span>
              {filteredTransitions.length > 0 && (
                <Badge variant="outline">
                  {filteredTransitions.length} transition{filteredTransitions.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button onClick={loadTransitionHistory} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-b">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
              
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="submit_for_review">Submit for Review</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.user} onValueChange={(value) => setFilters({ ...filters, user: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {/* Dynamic user options would be loaded from API */}
                  <SelectItem value="admin-user">Admin User</SelectItem>
                  <SelectItem value="reviewer-1">John Smith</SelectItem>
                  <SelectItem value="author-1">Sarah Johnson</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.fromState} onValueChange={(value) => setFilters({ ...filters, fromState: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="From state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any state</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.toState} onValueChange={(value) => setFilters({ ...filters, toState: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="To state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any state</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}

        <CardContent className="p-6">
          {filteredTransitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No workflow transitions found</p>
              {Object.values(filters).some(f => f) && (
                <Button 
                  variant="ghost" 
                  onClick={() => setFilters({ search: '', action: '', user: '', fromState: '', toState: '' })}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransitions.map((transition, index) => (
                <TimelineItem
                  key={transition.id}
                  transition={transition}
                  isLast={index === filteredTransitions.length - 1}
                  onClick={() => handleTransitionClick(transition)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransitionDetailDialog
        transition={selectedTransition}
        isOpen={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false)
          setSelectedTransition(null)
        }}
      />
    </>
  )
}

export default WorkflowHistory