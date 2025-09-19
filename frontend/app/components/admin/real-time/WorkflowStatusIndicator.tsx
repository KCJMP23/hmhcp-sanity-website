/**
 * Real-time Workflow Status Indicator Component
 * 
 * Shows live workflow status updates with animations and notifications
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Eye,
  Loader2,
  Zap,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { WorkflowState, WorkflowAction, WorkflowContentType } from '@/lib/services/workflow-engine'
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection'
import { motion, AnimatePresence } from 'framer-motion'

// ================================
// Types and Interfaces
// ================================

export interface WorkflowStatusData {
  id: string
  contentType: WorkflowContentType
  contentId: string
  currentState: WorkflowState
  previousState?: WorkflowState
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  assignedToRole?: string
  createdBy: string
  title?: string
  lastUpdate: Date
  isActive?: boolean
  progress?: number
  estimatedCompletion?: Date
}

export interface WorkflowUpdateEvent {
  type: 'state_changed' | 'assigned' | 'comment_added' | 'approval_requested'
  workflowId: string
  data: any
  timestamp: Date
  userId?: string
}

export interface CollaborationData {
  activeUsers: Array<{
    id: string
    email: string
    isTyping?: boolean
    isViewing?: boolean
    lastSeen: Date
  }>
  recentActivity: Array<{
    type: string
    user: string
    timestamp: Date
    message: string
  }>
}

// ================================
// Workflow Status Indicator Props
// ================================

export interface WorkflowStatusIndicatorProps {
  workflow: WorkflowStatusData
  showCollaboration?: boolean
  showProgress?: boolean
  showNotifications?: boolean
  onStatusClick?: (workflow: WorkflowStatusData) => void
  onActionRequired?: (workflow: WorkflowStatusData, action: string) => void
  className?: string
}

// ================================
// State Configuration
// ================================

const stateConfig: Record<WorkflowState, {
  label: string
  color: string
  icon: React.ElementType
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  [WorkflowState.DRAFT]: {
    label: 'Draft',
    color: 'gray',
    icon: Clock,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  },
  [WorkflowState.REVIEW]: {
    label: 'In Review',
    color: 'yellow',
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  [WorkflowState.APPROVED]: {
    label: 'Approved',
    color: 'green',
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  [WorkflowState.REJECTED]: {
    label: 'Changes Requested',
    color: 'red',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
  [WorkflowState.PUBLISHED]: {
    label: 'Published',
    color: 'blue',
    icon: Zap,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  [WorkflowState.ARCHIVED]: {
    label: 'Archived',
    color: 'gray',
    icon: Clock,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-200'
  },
  [WorkflowState.EXPIRED]: {
    label: 'Expired',
    color: 'gray',
    icon: Clock,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-200'
  }
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-600', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-600', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-600', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-600', label: 'Urgent' }
}

// ================================
// Main Component
// ================================

export function WorkflowStatusIndicator({
  workflow,
  showCollaboration = true,
  showProgress = true,
  showNotifications = true,
  onStatusClick,
  onActionRequired,
  className
}: WorkflowStatusIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [recentUpdates, setRecentUpdates] = useState<WorkflowUpdateEvent[]>([])
  const [collaboration, setCollaboration] = useState<CollaborationData>({
    activeUsers: [],
    recentActivity: []
  })
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false)
  const [lastViewedUpdate, setLastViewedUpdate] = useState<Date>(new Date())

  // WebSocket connection for real-time updates
  const { isConnected, connectionStatus, sendMessage } = useWebSocketConnection({
    autoConnect: true,
    channels: [`workflow:${workflow.id}`],
    onMessage: handleWebSocketMessage
  })

  // Get state configuration
  const stateInfo = stateConfig[workflow.currentState] || stateConfig[WorkflowState.DRAFT]
  const StateIcon = stateInfo.icon

  /**
   * Handle incoming WebSocket messages
   */
  function handleWebSocketMessage(message: any) {
    try {
      if (message.workflowId !== workflow.id) return

      switch (message.type) {
        case 'workflow_state_changed':
          handleWorkflowStateChange(message)
          break
        case 'workflow_assigned':
          handleWorkflowAssignment(message)
          break
        case 'workflow_comment_added':
          handleWorkflowComment(message)
          break
        case 'user_typing':
          handleUserTyping(message)
          break
        case 'user_viewing':
          handleUserViewing(message)
          break
        case 'user_joined_workflow':
          handleUserJoined(message)
          break
        case 'user_left_workflow':
          handleUserLeft(message)
          break
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
    }
  }

  /**
   * Handle workflow state changes
   */
  const handleWorkflowStateChange = useCallback((message: any) => {
    const update: WorkflowUpdateEvent = {
      type: 'state_changed',
      workflowId: message.workflowId,
      data: message.payload,
      timestamp: new Date(message.timestamp),
      userId: message.payload.performedBy
    }

    setRecentUpdates(prev => [update, ...prev.slice(0, 9)]) // Keep last 10 updates
    setHasUnreadUpdates(true)

    // Add to recent activity
    setCollaboration(prev => ({
      ...prev,
      recentActivity: [
        {
          type: 'state_change',
          user: message.payload.performedBy,
          timestamp: new Date(message.timestamp),
          message: `Changed status from ${message.payload.fromState} to ${message.payload.toState}`
        },
        ...prev.recentActivity.slice(0, 4)
      ]
    }))

    // Show browser notification if enabled
    if (showNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Workflow Updated', {
        body: `${workflow.title || 'Content'} status changed to ${stateConfig[message.payload.toState]?.label}`,
        icon: '/icons/workflow-update.png',
        tag: `workflow-${workflow.id}`
      })
    }
  }, [workflow.id, workflow.title, showNotifications])

  /**
   * Handle workflow assignments
   */
  const handleWorkflowAssignment = useCallback((message: any) => {
    const update: WorkflowUpdateEvent = {
      type: 'assigned',
      workflowId: message.workflowId,
      data: message.payload,
      timestamp: new Date(message.timestamp),
      userId: message.payload.assignedBy
    }

    setRecentUpdates(prev => [update, ...prev.slice(0, 9)])
    setHasUnreadUpdates(true)

    setCollaboration(prev => ({
      ...prev,
      recentActivity: [
        {
          type: 'assignment',
          user: message.payload.assignedBy,
          timestamp: new Date(message.timestamp),
          message: `Assigned to ${message.payload.assignedTo}`
        },
        ...prev.recentActivity.slice(0, 4)
      ]
    }))
  }, [])

  /**
   * Handle workflow comments
   */
  const handleWorkflowComment = useCallback((message: any) => {
    const update: WorkflowUpdateEvent = {
      type: 'comment_added',
      workflowId: message.workflowId,
      data: message.payload,
      timestamp: new Date(message.timestamp),
      userId: message.payload.commentBy
    }

    setRecentUpdates(prev => [update, ...prev.slice(0, 9)])
    setHasUnreadUpdates(true)

    setCollaboration(prev => ({
      ...prev,
      recentActivity: [
        {
          type: 'comment',
          user: message.payload.commentBy,
          timestamp: new Date(message.timestamp),
          message: `Added a ${message.payload.commentType} comment`
        },
        ...prev.recentActivity.slice(0, 4)
      ]
    }))
  }, [])

  /**
   * Handle user typing indicators
   */
  const handleUserTyping = useCallback((message: any) => {
    setCollaboration(prev => ({
      ...prev,
      activeUsers: prev.activeUsers.map(user => 
        user.id === message.payload.userId 
          ? { ...user, isTyping: true, lastSeen: new Date() }
          : user
      )
    }))

    // Clear typing indicator after 3 seconds
    setTimeout(() => {
      setCollaboration(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.map(user => 
          user.id === message.payload.userId 
            ? { ...user, isTyping: false }
            : user
        )
      }))
    }, 3000)
  }, [])

  /**
   * Handle user viewing indicators
   */
  const handleUserViewing = useCallback((message: any) => {
    setCollaboration(prev => {
      const existingUser = prev.activeUsers.find(u => u.id === message.payload.userId)
      if (existingUser) {
        return {
          ...prev,
          activeUsers: prev.activeUsers.map(user => 
            user.id === message.payload.userId 
              ? { ...user, isViewing: true, lastSeen: new Date() }
              : user
          )
        }
      } else {
        return {
          ...prev,
          activeUsers: [
            ...prev.activeUsers,
            {
              id: message.payload.userId,
              email: message.payload.userEmail,
              isViewing: true,
              lastSeen: new Date()
            }
          ]
        }
      }
    })
  }, [])

  /**
   * Handle user joined workflow
   */
  const handleUserJoined = useCallback((message: any) => {
    setCollaboration(prev => {
      const existingUser = prev.activeUsers.find(u => u.id === message.payload.userId)
      if (!existingUser) {
        return {
          ...prev,
          activeUsers: [
            ...prev.activeUsers,
            {
              id: message.payload.userId,
              email: message.payload.userEmail,
              lastSeen: new Date()
            }
          ]
        }
      }
      return prev
    })
  }, [])

  /**
   * Handle user left workflow
   */
  const handleUserLeft = useCallback((message: any) => {
    setCollaboration(prev => ({
      ...prev,
      activeUsers: prev.activeUsers.filter(u => u.id !== message.payload.userId)
    }))
  }, [])

  /**
   * Mark updates as viewed
   */
  const markAsViewed = useCallback(() => {
    setHasUnreadUpdates(false)
    setLastViewedUpdate(new Date())
  }, [])

  /**
   * Request notification permissions
   */
  useEffect(() => {
    if (showNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [showNotifications])

  /**
   * Subscribe to workflow updates on mount
   */
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: 'subscribe',
        payload: {
          channels: [`workflow:${workflow.id}`],
          filters: {
            workflowId: workflow.id
          }
        }
      })

      // Announce that user is viewing this workflow
      sendMessage({
        type: 'user_viewing',
        payload: {
          workflowId: workflow.id
        }
      })
    }

    return () => {
      if (isConnected) {
        sendMessage({
          type: 'unsubscribe',
          payload: {
            channels: [`workflow:${workflow.id}`]
          }
        })
      }
    }
  }, [isConnected, workflow.id, sendMessage])

  /**
   * Calculate time since last update
   */
  const timeSinceUpdate = React.useMemo(() => {
    const now = new Date()
    const diff = now.getTime() - workflow.lastUpdate.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }, [workflow.lastUpdate])

  return (
    <TooltipProvider>
      <motion.div
        layout
        className={cn(
          "relative border rounded-lg transition-all duration-200",
          stateInfo.bgColor,
          stateInfo.borderColor,
          workflow.isActive && "ring-2 ring-blue-500 ring-opacity-50",
          hasUnreadUpdates && "ring-2 ring-orange-500 ring-opacity-50",
          className
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Connection Status Indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {showNotifications && hasUnreadUpdates && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-orange-500 rounded-full"
            />
          )}
          <Tooltip>
            <TooltipTrigger>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
            </TooltipTrigger>
            <TooltipContent>
              {isConnected ? "Connected to real-time updates" : "Disconnected"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Status Display */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => {
            onStatusClick?.(workflow)
            markAsViewed()
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                stateInfo.bgColor
              )}>
                <StateIcon className={cn("w-4 h-4", stateInfo.textColor)} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {workflow.title || `${workflow.contentType} - ${workflow.contentId}`}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={cn(
                    "text-xs",
                    stateInfo.textColor,
                    stateInfo.bgColor
                  )}>
                    {stateInfo.label}
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    priorityConfig[workflow.priority].color
                  )}>
                    {priorityConfig[workflow.priority].label}
                  </Badge>
                  <span className="text-xs text-gray-500">{timeSinceUpdate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Collaboration Indicators */}
              {showCollaboration && collaboration.activeUsers.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {collaboration.activeUsers.length}
                      </span>
                      {collaboration.activeUsers.some(u => u.isTyping) && (
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="flex gap-0.5"
                        >
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                        </motion.div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {collaboration.activeUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-2 text-sm">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            user.isViewing ? "bg-green-500" : "bg-gray-400"
                          )} />
                          {user.email}
                          {user.isTyping && <span className="text-blue-500">typing...</span>}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                  if (!isExpanded) markAsViewed()
                }}
                className="p-1 h-auto"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && workflow.progress !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900 font-medium">{workflow.progress}%</span>
              </div>
              <Progress value={workflow.progress} className="h-2" />
            </div>
          )}

          {/* Assignment Info */}
          {workflow.assignedTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Assigned to:</span>
              <span className="font-medium">{workflow.assignedTo}</span>
              {workflow.assignedToRole && (
                <Badge variant="outline" className="text-xs">
                  {workflow.assignedToRole}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Recent Updates */}
                {recentUpdates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Recent Updates
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {recentUpdates.map((update, index) => (
                        <motion.div
                          key={`${update.timestamp}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {update.type === 'state_changed' && 'Status changed'}
                                {update.type === 'assigned' && 'Assignment changed'}
                                {update.type === 'comment_added' && 'Comment added'}
                                {update.type === 'approval_requested' && 'Approval requested'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {update.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs mt-0.5">
                              By {update.userId}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {showCollaboration && collaboration.recentActivity.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Recent Activity
                    </h4>
                    <div className="space-y-1">
                      {collaboration.recentActivity.slice(0, 3).map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span>{activity.user} {activity.message}</span>
                          <span className="text-xs text-gray-400">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActionRequired?.(workflow, 'view_details')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {workflow.currentState === WorkflowState.REVIEW && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActionRequired?.(workflow, 'approve')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActionRequired?.(workflow, 'request_changes')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Request Changes
                      </Button>
                    </>
                  )}

                  {workflow.currentState === WorkflowState.APPROVED && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onActionRequired?.(workflow, 'publish')}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  )
}