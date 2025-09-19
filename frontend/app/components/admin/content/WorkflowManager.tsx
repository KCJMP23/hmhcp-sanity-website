/**
 * Workflow Manager UI Component
 * Main interface for managing content workflow states and transitions
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Play,
  RefreshCw,
  Send,
  Settings,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ================================
// Types
// ================================

export interface WorkflowInstance {
  id: string
  workflowDefinitionId: string
  contentType: string
  contentId: string
  currentState: WorkflowState
  previousState?: WorkflowState
  assignedTo?: string
  assignedToRole?: WorkflowRole
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  metadata: Record<string, any>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export enum WorkflowState {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum WorkflowRole {
  AUTHOR = 'author',
  REVIEWER = 'reviewer',
  APPROVER = 'approver',
  PUBLISHER = 'publisher',
  ADMIN = 'admin'
}

export enum WorkflowAction {
  SUBMIT_FOR_REVIEW = 'submit_for_review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  FORCE_APPROVE = 'force_approve'
}

interface WorkflowManagerProps {
  contentType: string
  contentId: string
  currentUser: {
    id: string
    role: WorkflowRole
    name: string
  }
  onWorkflowUpdate?: (workflow: WorkflowInstance) => void
}

interface TransitionDialogProps {
  isOpen: boolean
  onClose: () => void
  workflow: WorkflowInstance | null
  action: WorkflowAction | null
  availableActions: WorkflowAction[]
  onConfirm: (action: WorkflowAction, comment?: string, assignTo?: string) => Promise<void>
  currentUser: {
    id: string
    role: WorkflowRole
    name: string
  }
}

// ================================
// State Badge Component
// ================================

const StateBadge: React.FC<{ state: WorkflowState; className?: string }> = ({ 
  state, 
  className 
}) => {
  const getStateConfig = (state: WorkflowState) => {
    switch (state) {
      case WorkflowState.DRAFT:
        return { color: 'bg-gray-100 text-gray-800', icon: FileText }
      case WorkflowState.REVIEW:
        return { color: 'bg-blue-100 text-blue-800', icon: Eye }
      case WorkflowState.APPROVED:
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case WorkflowState.REJECTED:
        return { color: 'bg-red-100 text-red-800', icon: X }
      case WorkflowState.PUBLISHED:
        return { color: 'bg-purple-100 text-purple-800', icon: Play }
      case WorkflowState.ARCHIVED:
        return { color: 'bg-gray-100 text-gray-600', icon: Settings }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: FileText }
    }
  }

  const config = getStateConfig(state)
  const Icon = config.icon

  return (
    <Badge className={cn(config.color, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {state.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}

// ================================
// Priority Badge Component
// ================================

const PriorityBadge: React.FC<{ priority: string; className?: string }> = ({ 
  priority, 
  className 
}) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: 'bg-red-500 text-white', icon: AlertTriangle }
      case 'high':
        return { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
      case 'medium':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'low':
        return { color: 'bg-green-100 text-green-800', icon: Clock }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const config = getPriorityConfig(priority)
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {priority.toUpperCase()}
    </Badge>
  )
}

// ================================
// Transition Dialog Component
// ================================

const TransitionDialog: React.FC<TransitionDialogProps> = ({
  isOpen,
  onClose,
  workflow,
  action,
  availableActions,
  onConfirm,
  currentUser
}) => {
  const [comment, setComment] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getActionConfig = (action: WorkflowAction) => {
    switch (action) {
      case WorkflowAction.SUBMIT_FOR_REVIEW:
        return { title: 'Submit for Review', color: 'bg-blue-500', requiresComment: false }
      case WorkflowAction.APPROVE:
        return { title: 'Approve', color: 'bg-green-500', requiresComment: false }
      case WorkflowAction.REJECT:
        return { title: 'Reject', color: 'bg-red-500', requiresComment: true }
      case WorkflowAction.REQUEST_CHANGES:
        return { title: 'Request Changes', color: 'bg-orange-500', requiresComment: true }
      case WorkflowAction.PUBLISH:
        return { title: 'Publish', color: 'bg-purple-500', requiresComment: false }
      case WorkflowAction.ARCHIVE:
        return { title: 'Archive', color: 'bg-gray-500', requiresComment: true }
      case WorkflowAction.FORCE_APPROVE:
        return { title: 'Force Approve', color: 'bg-red-600', requiresComment: true }
      default:
        return { title: 'Execute Action', color: 'bg-blue-500', requiresComment: false }
    }
  }

  const handleConfirm = async () => {
    if (!action) return

    const config = getActionConfig(action)
    if (config.requiresComment && !comment.trim()) {
      alert('Comment is required for this action')
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(action, comment.trim() || undefined, assignTo || undefined)
      onClose()
      setComment('')
      setAssignTo('')
    } catch (error) {
      console.error('Transition failed:', error)
      alert('Failed to execute transition. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!action || !workflow) return null

  const config = getActionConfig(action)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', config.color)} />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            Execute workflow transition for {workflow.metadata.title || 'this content'}.
            Current state: <StateBadge state={workflow.currentState} className="ml-1" />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {config.requiresComment && (
            <div className="space-y-2">
              <Label htmlFor="comment">
                Comment <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Please provide a reason for this action..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {!config.requiresComment && (
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Add an optional comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {(action === WorkflowAction.SUBMIT_FOR_REVIEW || action === WorkflowAction.APPROVE) && (
            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign to (optional)</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewer-1">John Smith (Reviewer)</SelectItem>
                  <SelectItem value="reviewer-2">Sarah Johnson (Approver)</SelectItem>
                  <SelectItem value="admin-1">Admin User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === WorkflowAction.FORCE_APPROVE && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div className="text-sm text-red-700">
                  <strong>Warning:</strong> Force approval bypasses the normal workflow process. 
                  This action requires admin privileges and should only be used in exceptional circumstances.
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className={cn('text-white', config.color)}
          >
            {isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {config.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ================================
// Main WorkflowManager Component
// ================================

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  contentType,
  contentId,
  currentUser,
  onWorkflowUpdate
}) => {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null)
  const [availableActions, setAvailableActions] = useState<WorkflowAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitionDialog, setTransitionDialog] = useState<{
    isOpen: boolean
    action: WorkflowAction | null
  }>({ isOpen: false, action: null })

  // Load workflow data
  useEffect(() => {
    loadWorkflowData()
  }, [contentType, contentId])

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check for existing workflow
      const response = await fetch(
        `/api/admin/workflow?contentType=${contentType}&contentId=${contentId}&limit=1`,
        {
          headers: {
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to load workflow: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        const workflowInstance = data.data[0]
        setWorkflow(workflowInstance)
        
        // Get available actions for current user and workflow state
        const actionsResponse = await fetch(
          `/api/admin/workflow/${workflowInstance.id}/actions`,
          {
            headers: {
              'x-user-id': currentUser.id,
              'x-user-role': currentUser.role
            }
          }
        )

        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json()
          setAvailableActions(actionsData.data || [])
        }
      } else {
        // No workflow exists, create one
        await createWorkflow()
      }

    } catch (err) {
      console.error('Failed to load workflow data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workflow data')
    } finally {
      setIsLoading(false)
    }
  }

  const createWorkflow = async () => {
    try {
      const response = await fetch('/api/admin/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify({
          contentType,
          contentId,
          metadata: {
            title: `${contentType} Content`,
            createdBy: currentUser.name
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`)
      }

      const data = await response.json()
      setWorkflow(data.data)
      
      // Set initial available actions for draft state
      setAvailableActions([WorkflowAction.SUBMIT_FOR_REVIEW])

    } catch (err) {
      console.error('Failed to create workflow:', err)
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    }
  }

  const executeTransition = async (
    action: WorkflowAction,
    comment?: string,
    assignTo?: string
  ) => {
    if (!workflow) return

    try {
      const response = await fetch('/api/admin/workflow/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          action,
          comment,
          assignTo
        })
      })

      if (!response.ok) {
        throw new Error(`Transition failed: ${response.statusText}`)
      }

      const data = await response.json()
      const updatedWorkflow = data.data.workflow

      setWorkflow(updatedWorkflow)
      onWorkflowUpdate?.(updatedWorkflow)

      // Reload available actions
      await loadWorkflowData()

    } catch (err) {
      console.error('Failed to execute transition:', err)
      throw err
    }
  }

  const openTransitionDialog = (action: WorkflowAction) => {
    setTransitionDialog({ isOpen: true, action })
  }

  const closeTransitionDialog = () => {
    setTransitionDialog({ isOpen: false, action: null })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading workflow...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadWorkflowData}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No workflow found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Workflow</span>
            <StateBadge state={workflow.currentState} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Workflow Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Priority</Label>
              <PriorityBadge priority={workflow.priority} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Created By</Label>
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-sm">{workflow.metadata.createdBy || 'Unknown'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Assigned To</Label>
              <div className="flex items-center space-x-1">
                {workflow.assignedTo ? (
                  <>
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-sm">{workflow.assignedTo}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Updated</Label>
              <span className="text-sm">
                {new Date(workflow.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Available Actions */}
          {availableActions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Actions</Label>
              <div className="flex flex-wrap gap-2">
                {availableActions.map((action) => {
                  const config = {
                    [WorkflowAction.SUBMIT_FOR_REVIEW]: { label: 'Submit for Review', icon: Send, variant: 'default' as const },
                    [WorkflowAction.APPROVE]: { label: 'Approve', icon: CheckCircle, variant: 'default' as const },
                    [WorkflowAction.REJECT]: { label: 'Reject', icon: X, variant: 'destructive' as const },
                    [WorkflowAction.REQUEST_CHANGES]: { label: 'Request Changes', icon: RefreshCw, variant: 'outline' as const },
                    [WorkflowAction.PUBLISH]: { label: 'Publish', icon: Play, variant: 'default' as const },
                    [WorkflowAction.ARCHIVE]: { label: 'Archive', icon: Settings, variant: 'outline' as const },
                    [WorkflowAction.FORCE_APPROVE]: { label: 'Force Approve', icon: AlertTriangle, variant: 'destructive' as const }
                  }[action] || { label: action, icon: MoreHorizontal, variant: 'outline' as const }

                  const Icon = config.icon

                  return (
                    <Button
                      key={action}
                      variant={config.variant}
                      size="sm"
                      onClick={() => openTransitionDialog(action)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {config.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Workflow Timeline Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Workflow Progress</Label>
            <div className="flex items-center space-x-2 text-sm">
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded',
                workflow.currentState === WorkflowState.DRAFT ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  workflow.currentState === WorkflowState.DRAFT ? 'bg-blue-500' : 'bg-gray-300'
                )} />
                Draft
              </div>
              <div className="w-4 h-0.5 bg-gray-200" />
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded',
                workflow.currentState === WorkflowState.REVIEW ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  workflow.currentState === WorkflowState.REVIEW ? 'bg-blue-500' : 'bg-gray-300'
                )} />
                Review
              </div>
              <div className="w-4 h-0.5 bg-gray-200" />
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded',
                workflow.currentState === WorkflowState.APPROVED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  workflow.currentState === WorkflowState.APPROVED ? 'bg-green-500' : 'bg-gray-300'
                )} />
                Approved
              </div>
              <div className="w-4 h-0.5 bg-gray-200" />
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded',
                workflow.currentState === WorkflowState.PUBLISHED ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  workflow.currentState === WorkflowState.PUBLISHED ? 'bg-purple-500' : 'bg-gray-300'
                )} />
                Published
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TransitionDialog
        isOpen={transitionDialog.isOpen}
        onClose={closeTransitionDialog}
        workflow={workflow}
        action={transitionDialog.action}
        availableActions={availableActions}
        onConfirm={executeTransition}
        currentUser={currentUser}
      />
    </>
  )
}

export default WorkflowManager