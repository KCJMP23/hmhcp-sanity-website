/**
 * Content Workflow Management Engine
 * Core workflow state machine for content approval and publishing
 * Story 1.4 Task 8 - Comprehensive workflow management system
 */

import { z } from 'zod'
import { logger } from '@/lib/logger'
import { 
  WorkflowErrorHandler, 
  WorkflowError, 
  WorkflowErrorCode, 
  type WorkflowErrorContext,
  workflowErrorHandler 
} from '@/lib/error-handling/workflow-error-handler'
import { websocketManager } from '@/lib/services/websocket-manager'

// ================================
// Workflow Types and Enums
// ================================

export enum WorkflowState {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

export enum WorkflowAction {
  SUBMIT_FOR_REVIEW = 'submit_for_review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  FORCE_APPROVE = 'force_approve', // Admin bypass
  WITHDRAW = 'withdraw'
}

export enum WorkflowContentType {
  BLOG_POST = 'blog_post',
  PAGE = 'page',
  PLATFORM = 'platform',
  SERVICE = 'service',
  TEAM_MEMBER = 'team_member',
  TESTIMONIAL = 'testimonial'
}

export enum WorkflowRole {
  AUTHOR = 'author',
  REVIEWER = 'reviewer',
  APPROVER = 'approver',
  PUBLISHER = 'publisher',
  ADMIN = 'admin'
}

export enum NotificationType {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SLACK = 'slack',
  WEBHOOK = 'webhook'
}

// ================================
// Workflow Interfaces
// ================================

export interface WorkflowDefinition {
  id: string
  name: string
  contentType: WorkflowContentType
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  rules: WorkflowRule[]
  notifications: WorkflowNotificationRule[]
  isActive: boolean
  version: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowTransition {
  id: string
  fromState: WorkflowState
  toState: WorkflowState
  action: WorkflowAction
  requiredRoles: WorkflowRole[]
  conditions: WorkflowCondition[]
  autoTransition: boolean
  requiresApproval: boolean
  requiresComment: boolean
}

export interface WorkflowRule {
  id: string
  name: string
  condition: string // JavaScript expression
  action: WorkflowAction
  priority: number
  isActive: boolean
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists'
  value: any
  type: 'content' | 'user' | 'time' | 'system'
}

export interface WorkflowInstance {
  id: string
  workflowDefinitionId: string
  contentType: WorkflowContentType
  contentId: string
  currentState: WorkflowState
  previousState?: WorkflowState
  assignedTo?: string
  assignedToRole?: WorkflowRole
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  metadata: Record<string, any>
  history: WorkflowTransitionLog[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowTransitionLog {
  id: string
  workflowInstanceId: string
  fromState: WorkflowState
  toState: WorkflowState
  action: WorkflowAction
  performedBy: string
  performedByRole: WorkflowRole
  comment?: string
  metadata?: Record<string, any>
  timestamp: string
  duration?: number // Time in state in milliseconds
}

export interface WorkflowNotificationRule {
  id: string
  workflowDefinitionId: string
  triggerState: WorkflowState
  triggerAction?: WorkflowAction
  notificationType: NotificationType
  recipients: WorkflowRecipient[]
  template: string
  isActive: boolean
}

export interface WorkflowRecipient {
  type: 'role' | 'user' | 'group'
  identifier: string
  notificationTypes: NotificationType[]
}

export interface WorkflowApprovalQueue {
  pending: WorkflowQueueItem[]
  overdue: WorkflowQueueItem[]
  recent: WorkflowQueueItem[]
  stats: WorkflowQueueStats
}

export interface WorkflowQueueItem {
  workflowInstance: WorkflowInstance
  contentTitle: string
  contentType: WorkflowContentType
  author: string
  submittedAt: string
  daysInQueue: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
}

export interface WorkflowQueueStats {
  totalPending: number
  totalOverdue: number
  averageProcessingTime: number
  byContentType: Record<WorkflowContentType, number>
  byPriority: Record<string, number>
  byAssignee: Record<string, number>
}

export interface WorkflowAnalytics {
  totalWorkflows: number
  completedThisMonth: number
  averageCompletionTime: number
  bottlenecks: WorkflowBottleneck[]
  throughput: WorkflowThroughput[]
  efficiency: WorkflowEfficiency
}

export interface WorkflowBottleneck {
  state: WorkflowState
  averageTime: number
  instanceCount: number
  impact: 'low' | 'medium' | 'high'
}

export interface WorkflowThroughput {
  date: string
  started: number
  completed: number
  rejected: number
}

export interface WorkflowEfficiency {
  onTimeCompletionRate: number
  firstTimeApprovalRate: number
  rejectionRate: number
  escalationRate: number
}

// ================================
// Workflow Engine Class
// ================================

export class WorkflowEngine {
  private definitions: Map<string, WorkflowDefinition> = new Map()
  private instances: Map<string, WorkflowInstance> = new Map()
  private errorHandler: WorkflowErrorHandler
  private readonly maxConcurrentWorkflows = 100
  private readonly defaultTimeout = 30000 // 30 seconds

  constructor() {
    this.errorHandler = workflowErrorHandler
    this.initializeDefaultWorkflows()
    
    // Start background services
    this.startDeadlockDetection()
    this.startWorkflowHealthCheck()
  }

  /**
   * Initialize default workflow definitions
   */
  private initializeDefaultWorkflows(): void {
    const blogWorkflow = this.createDefaultBlogWorkflow()
    const pageWorkflow = this.createDefaultPageWorkflow()
    
    this.definitions.set(blogWorkflow.id, blogWorkflow)
    this.definitions.set(pageWorkflow.id, pageWorkflow)
  }

  /**
   * Create default blog post workflow
   */
  private createDefaultBlogWorkflow(): WorkflowDefinition {
    return {
      id: 'blog-post-workflow',
      name: 'Blog Post Publishing Workflow',
      contentType: WorkflowContentType.BLOG_POST,
      states: [
        WorkflowState.DRAFT,
        WorkflowState.REVIEW,
        WorkflowState.APPROVED,
        WorkflowState.REJECTED,
        WorkflowState.PUBLISHED,
        WorkflowState.ARCHIVED
      ],
      transitions: [
        {
          id: 'draft-to-review',
          fromState: WorkflowState.DRAFT,
          toState: WorkflowState.REVIEW,
          action: WorkflowAction.SUBMIT_FOR_REVIEW,
          requiredRoles: [WorkflowRole.AUTHOR],
          conditions: [],
          autoTransition: false,
          requiresApproval: false,
          requiresComment: false
        },
        {
          id: 'review-to-approved',
          fromState: WorkflowState.REVIEW,
          toState: WorkflowState.APPROVED,
          action: WorkflowAction.APPROVE,
          requiredRoles: [WorkflowRole.REVIEWER, WorkflowRole.APPROVER],
          conditions: [],
          autoTransition: false,
          requiresApproval: true,
          requiresComment: false
        },
        {
          id: 'review-to-rejected',
          fromState: WorkflowState.REVIEW,
          toState: WorkflowState.REJECTED,
          action: WorkflowAction.REJECT,
          requiredRoles: [WorkflowRole.REVIEWER, WorkflowRole.APPROVER],
          conditions: [],
          autoTransition: false,
          requiresApproval: false,
          requiresComment: true
        },
        {
          id: 'approved-to-published',
          fromState: WorkflowState.APPROVED,
          toState: WorkflowState.PUBLISHED,
          action: WorkflowAction.PUBLISH,
          requiredRoles: [WorkflowRole.PUBLISHER, WorkflowRole.ADMIN],
          conditions: [],
          autoTransition: false,
          requiresApproval: false,
          requiresComment: false
        },
        {
          id: 'any-to-archived',
          fromState: WorkflowState.PUBLISHED,
          toState: WorkflowState.ARCHIVED,
          action: WorkflowAction.ARCHIVE,
          requiredRoles: [WorkflowRole.ADMIN],
          conditions: [],
          autoTransition: false,
          requiresApproval: false,
          requiresComment: true
        }
      ],
      rules: [],
      notifications: [
        {
          id: 'review-notification',
          workflowDefinitionId: 'blog-post-workflow',
          triggerState: WorkflowState.REVIEW,
          notificationType: NotificationType.EMAIL,
          recipients: [
            {
              type: 'role',
              identifier: WorkflowRole.REVIEWER,
              notificationTypes: [NotificationType.EMAIL, NotificationType.IN_APP]
            }
          ],
          template: 'new-content-for-review',
          isActive: true
        }
      ],
      isActive: true,
      version: '1.0.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Create default page workflow
   */
  private createDefaultPageWorkflow(): WorkflowDefinition {
    return {
      id: 'page-workflow',
      name: 'Page Publishing Workflow',
      contentType: WorkflowContentType.PAGE,
      states: [
        WorkflowState.DRAFT,
        WorkflowState.REVIEW,
        WorkflowState.APPROVED,
        WorkflowState.PUBLISHED,
        WorkflowState.ARCHIVED
      ],
      transitions: [
        {
          id: 'page-draft-to-review',
          fromState: WorkflowState.DRAFT,
          toState: WorkflowState.REVIEW,
          action: WorkflowAction.SUBMIT_FOR_REVIEW,
          requiredRoles: [WorkflowRole.AUTHOR],
          conditions: [],
          autoTransition: false,
          requiresApproval: false,
          requiresComment: false
        },
        {
          id: 'page-review-to-approved',
          fromState: WorkflowState.REVIEW,
          toState: WorkflowState.APPROVED,
          action: WorkflowAction.APPROVE,
          requiredRoles: [WorkflowRole.APPROVER, WorkflowRole.ADMIN],
          conditions: [],
          autoTransition: false,
          requiresApproval: true,
          requiresComment: false
        },
        {
          id: 'page-approved-to-published',
          fromState: WorkflowState.APPROVED,
          toState: WorkflowState.PUBLISHED,
          action: WorkflowAction.PUBLISH,
          requiredRoles: [WorkflowRole.ADMIN],
          conditions: [],
          autoTransition: true, // Auto-publish approved pages
          requiresApproval: false,
          requiresComment: false
        }
      ],
      rules: [],
      notifications: [],
      isActive: true,
      version: '1.0.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Start a new workflow instance with comprehensive error handling
   */
  async startWorkflow(
    contentType: WorkflowContentType,
    contentId: string,
    createdBy: string,
    metadata: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    const correlationId = crypto.randomUUID()
    
    try {
      // Check system capacity
      await this.checkSystemCapacity(correlationId)
      
      const definition = this.getWorkflowDefinition(contentType)
      if (!definition) {
        throw new WorkflowError(
          WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
          `No workflow definition found for content type: ${contentType}`,
          {
            correlationId,
            contentType,
            contentId,
            userId: createdBy,
            timestamp: new Date()
          },
          false
        )
      }

      const instance: WorkflowInstance = {
        id: this.generateId(),
        workflowDefinitionId: definition.id,
        contentType,
        contentId,
        currentState: WorkflowState.DRAFT,
        priority: 'medium',
        metadata: { ...metadata, correlationId },
        history: [],
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Create initial state snapshot
      await this.errorHandler.createStateSnapshot(instance)
      
      this.instances.set(instance.id, instance)

      logger.info('Workflow instance started', {
        correlationId,
        workflowInstanceId: instance.id,
        contentType,
        contentId,
        createdBy
      })

      return instance
      
    } catch (error) {
      if (error instanceof WorkflowError) {
        const recoveryResult = await this.errorHandler.handleWorkflowError(error)
        if (recoveryResult.success) {
          // Retry starting workflow
          return this.startWorkflow(contentType, contentId, createdBy, metadata)
        }
        throw error
      }
      
      // Convert generic errors to workflow errors
      const workflowError = new WorkflowError(
        WorkflowErrorCode.WORKFLOW_DATABASE_ERROR,
        `Failed to start workflow: ${(error as Error).message}`,
        {
          correlationId,
          contentType,
          contentId,
          userId: createdBy,
          timestamp: new Date()
        },
        true,
        error as Error
      )
      
      await this.errorHandler.handleWorkflowError(workflowError)
      throw workflowError
    }
  }

  /**
   * Execute a workflow transition with comprehensive error handling and validation
   */
  async executeTransition(
    instanceId: string,
    action: WorkflowAction,
    performedBy: string,
    performedByRole: WorkflowRole,
    comment?: string,
    metadata?: Record<string, any>
  ): Promise<WorkflowInstance> {
    const correlationId = crypto.randomUUID()
    const startTime = Date.now()
    
    try {
      // Get workflow instance with validation
      const instance = await this.getValidatedWorkflowInstance(instanceId, correlationId)
      
      const definition = this.definitions.get(instance.workflowDefinitionId)
      if (!definition) {
        throw new WorkflowError(
          WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
          `Workflow definition not found: ${instance.workflowDefinitionId}`,
          {
            correlationId,
            workflowInstanceId: instanceId,
            currentState: instance.currentState,
            action,
            userId: performedBy,
            userRole: performedByRole,
            timestamp: new Date()
          },
          false
        )
      }

      // Create pre-transition snapshot
      const preTransitionSnapshot = await this.errorHandler.createStateSnapshot(instance)
      
      // Comprehensive validation with error handling
      await this.errorHandler.validateStateTransition(
        instance,
        instance.currentState,
        this.getTargetState(definition, instance.currentState, action),
        action,
        performedByRole,
        metadata
      )

      // Find valid transition
      const transition = this.findValidTransition(definition, instance.currentState, action)
      if (!transition) {
        throw new WorkflowError(
          WorkflowErrorCode.INVALID_STATE_TRANSITION,
          `Invalid transition from ${instance.currentState} with action ${action}`,
          {
            correlationId,
            workflowInstanceId: instanceId,
            currentState: instance.currentState,
            action,
            userId: performedBy,
            userRole: performedByRole,
            timestamp: new Date()
          },
          false
        )
      }

      // Execute transition with timeout protection
      const transitionResult = await this.executeTransitionWithTimeout(
        instance,
        transition,
        action,
        performedBy,
        performedByRole,
        comment,
        metadata,
        correlationId
      )

      // Verify transition completion
      await this.verifyTransitionIntegrity(transitionResult, transition.toState)

      // Process auto-transitions if any
      await this.processAutoTransitions(transitionResult)

      const duration = Date.now() - startTime
      logger.info('Workflow transition executed successfully', {
        correlationId,
        workflowInstanceId: instanceId,
        fromState: instance.currentState,
        toState: transitionResult.currentState,
        action,
        performedBy,
        duration
      })

      return transitionResult

    } catch (error) {
      const duration = Date.now() - startTime
      
      if (error instanceof WorkflowError) {
        // Handle workflow-specific errors
        const recoveryResult = await this.errorHandler.handleWorkflowError(error)
        
        if (recoveryResult.success && recoveryResult.strategy === 'retry') {
          // Retry the transition
          logger.info('Retrying workflow transition after recovery', { correlationId, instanceId })
          return this.executeTransition(instanceId, action, performedBy, performedByRole, comment, metadata)
        }
        
        logger.error('Workflow transition failed', {
          correlationId,
          workflowInstanceId: instanceId,
          action,
          error: error.toJSON(),
          duration
        })
        
        throw error
      }

      // Convert generic errors to workflow errors
      const workflowError = new WorkflowError(
        WorkflowErrorCode.WORKFLOW_DATABASE_ERROR,
        `Transition execution failed: ${(error as Error).message}`,
        {
          correlationId,
          workflowInstanceId: instanceId,
          action,
          userId: performedBy,
          userRole: performedByRole,
          timestamp: new Date(),
          metadata: { originalError: (error as Error).message }
        },
        true,
        error as Error
      )

      await this.errorHandler.handleWorkflowError(workflowError)
      throw workflowError
    }
  }

  /**
   * Get workflow instance by ID
   */
  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId)
  }

  /**
   * Get workflow instances by content
   */
  getWorkflowInstancesByContent(contentType: WorkflowContentType, contentId: string): WorkflowInstance[] {
    return Array.from(this.instances.values()).filter(
      instance => instance.contentType === contentType && instance.contentId === contentId
    )
  }

  /**
   * Get approval queue for a user role
   */
  getApprovalQueue(role: WorkflowRole): WorkflowApprovalQueue {
    const allInstances = Array.from(this.instances.values())
    const pendingInstances = allInstances.filter(
      instance => instance.currentState === WorkflowState.REVIEW
    )

    const pending = pendingInstances.map(instance => this.createQueueItem(instance))
    const overdue = pending.filter(item => item.daysInQueue > 3) // Configurable threshold
    const recent = allInstances
      .filter(instance => instance.currentState === WorkflowState.PUBLISHED)
      .slice(0, 10)
      .map(instance => this.createQueueItem(instance))

    const stats = this.calculateQueueStats(allInstances)

    return { pending, overdue, recent, stats }
  }

  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(dateRange?: { start: string; end: string }): WorkflowAnalytics {
    const allInstances = Array.from(this.instances.values())
    
    // Filter by date range if provided
    const filteredInstances = dateRange 
      ? allInstances.filter(instance => 
          instance.createdAt >= dateRange.start && 
          instance.createdAt <= dateRange.end
        )
      : allInstances

    const completedThisMonth = filteredInstances.filter(
      instance => instance.currentState === WorkflowState.PUBLISHED ||
                 instance.currentState === WorkflowState.ARCHIVED
    ).length

    const averageCompletionTime = this.calculateAverageCompletionTime(filteredInstances)
    const bottlenecks = this.identifyBottlenecks(filteredInstances)
    const throughput = this.calculateThroughput(filteredInstances)
    const efficiency = this.calculateEfficiency(filteredInstances)

    return {
      totalWorkflows: filteredInstances.length,
      completedThisMonth,
      averageCompletionTime,
      bottlenecks,
      throughput,
      efficiency
    }
  }

  /**
   * Admin bypass - force approve content
   */
  async forceApprove(
    instanceId: string,
    performedBy: string,
    reason: string
  ): Promise<WorkflowInstance> {
    return this.executeTransition(
      instanceId,
      WorkflowAction.FORCE_APPROVE,
      performedBy,
      WorkflowRole.ADMIN,
      `Force approved: ${reason}`,
      { bypassReason: reason, bypassed: true }
    )
  }

  /**
   * Check if user can perform transition
   */
  canPerformTransition(
    instanceId: string,
    action: WorkflowAction,
    userRole: WorkflowRole
  ): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) return false

    const definition = this.definitions.get(instance.workflowDefinitionId)
    if (!definition) return false

    const transition = this.findValidTransition(definition, instance.currentState, action)
    if (!transition) return false

    return this.hasPermissionForTransition(transition, userRole)
  }

  /**
   * Get available actions for current state
   */
  getAvailableActions(instanceId: string, userRole: WorkflowRole): WorkflowAction[] {
    const instance = this.instances.get(instanceId)
    if (!instance) return []

    const definition = this.definitions.get(instance.workflowDefinitionId)
    if (!definition) return []

    return definition.transitions
      .filter(transition => 
        transition.fromState === instance.currentState &&
        this.hasPermissionForTransition(transition, userRole)
      )
      .map(transition => transition.action)
  }

  // ================================
  // Private Helper Methods
  // ================================

  private getWorkflowDefinition(contentType: WorkflowContentType): WorkflowDefinition | undefined {
    return Array.from(this.definitions.values()).find(
      def => def.contentType === contentType && def.isActive
    )
  }

  private findValidTransition(
    definition: WorkflowDefinition,
    currentState: WorkflowState,
    action: WorkflowAction
  ): WorkflowTransition | undefined {
    return definition.transitions.find(
      transition => transition.fromState === currentState && transition.action === action
    )
  }

  private hasPermissionForTransition(transition: WorkflowTransition, userRole: WorkflowRole): boolean {
    return transition.requiredRoles.includes(userRole) || userRole === WorkflowRole.ADMIN
  }

  private async checkTransitionConditions(
    transition: WorkflowTransition,
    instance: WorkflowInstance,
    metadata: Record<string, any>
  ): Promise<boolean> {
    // For now, return true. In a real implementation, this would evaluate conditions
    return true
  }

  private async processAutoTransitions(instance: WorkflowInstance): Promise<void> {
    const definition = this.definitions.get(instance.workflowDefinitionId)
    if (!definition) return

    const autoTransition = definition.transitions.find(
      transition => 
        transition.fromState === instance.currentState &&
        transition.autoTransition
    )

    if (autoTransition) {
      await this.executeTransition(
        instance.id,
        autoTransition.action,
        'system',
        WorkflowRole.ADMIN,
        'Auto-transition executed'
      )
    }
  }

  private createQueueItem(instance: WorkflowInstance): WorkflowQueueItem {
    const daysInQueue = Math.floor(
      (Date.now() - new Date(instance.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      workflowInstance: instance,
      contentTitle: instance.metadata.title || 'Untitled Content',
      contentType: instance.contentType,
      author: instance.createdBy,
      submittedAt: instance.createdAt,
      daysInQueue,
      priority: instance.priority,
      tags: instance.metadata.tags || []
    }
  }

  private calculateQueueStats(instances: WorkflowInstance[]): WorkflowQueueStats {
    const pending = instances.filter(i => i.currentState === WorkflowState.REVIEW)
    const overdue = pending.filter(i => 
      (Date.now() - new Date(i.updatedAt).getTime()) > (3 * 24 * 60 * 60 * 1000)
    )

    const byContentType = pending.reduce((acc, instance) => {
      acc[instance.contentType] = (acc[instance.contentType] || 0) + 1
      return acc
    }, {} as Record<WorkflowContentType, number>)

    const byPriority = pending.reduce((acc, instance) => {
      acc[instance.priority] = (acc[instance.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byAssignee = pending.reduce((acc, instance) => {
      const assignee = instance.assignedTo || 'unassigned'
      acc[assignee] = (acc[assignee] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalPending: pending.length,
      totalOverdue: overdue.length,
      averageProcessingTime: this.calculateAverageCompletionTime(instances),
      byContentType,
      byPriority,
      byAssignee
    }
  }

  private calculateAverageCompletionTime(instances: WorkflowInstance[]): number {
    const completed = instances.filter(i => 
      i.currentState === WorkflowState.PUBLISHED || 
      i.currentState === WorkflowState.ARCHIVED
    )

    if (completed.length === 0) return 0

    const totalTime = completed.reduce((sum, instance) => {
      return sum + (new Date(instance.updatedAt).getTime() - new Date(instance.createdAt).getTime())
    }, 0)

    return Math.floor(totalTime / completed.length / (1000 * 60 * 60 * 24)) // Days
  }

  private identifyBottlenecks(instances: WorkflowInstance[]): WorkflowBottleneck[] {
    const stateMetrics = new Map<WorkflowState, { totalTime: number; count: number }>()

    instances.forEach(instance => {
      instance.history.forEach((log, index) => {
        if (index < instance.history.length - 1) {
          const nextLog = instance.history[index + 1]
          const duration = new Date(nextLog.timestamp).getTime() - new Date(log.timestamp).getTime()
          
          const existing = stateMetrics.get(log.toState) || { totalTime: 0, count: 0 }
          existing.totalTime += duration
          existing.count += 1
          stateMetrics.set(log.toState, existing)
        }
      })
    })

    return Array.from(stateMetrics.entries()).map(([state, metrics]) => ({
      state,
      averageTime: Math.floor(metrics.totalTime / metrics.count / (1000 * 60 * 60 * 24)), // Days
      instanceCount: metrics.count,
      impact: metrics.totalTime > (7 * 24 * 60 * 60 * 1000) ? 'high' as const : 'medium' as const
    }))
  }

  private calculateThroughput(instances: WorkflowInstance[]): WorkflowThroughput[] {
    // Simplified implementation - would typically group by date
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    return last30Days.map(date => ({
      date,
      started: instances.filter(i => i.createdAt.startsWith(date)).length,
      completed: instances.filter(i => 
        i.updatedAt.startsWith(date) && 
        (i.currentState === WorkflowState.PUBLISHED || i.currentState === WorkflowState.ARCHIVED)
      ).length,
      rejected: instances.filter(i => 
        i.updatedAt.startsWith(date) && 
        i.currentState === WorkflowState.REJECTED
      ).length
    }))
  }

  private calculateEfficiency(instances: WorkflowInstance[]): WorkflowEfficiency {
    const completed = instances.filter(i => 
      i.currentState === WorkflowState.PUBLISHED || 
      i.currentState === WorkflowState.ARCHIVED
    )

    const rejected = instances.filter(i => i.currentState === WorkflowState.REJECTED)
    
    // Simplified calculations
    const onTimeCompletionRate = 0.85 // Would calculate based on SLA
    const firstTimeApprovalRate = completed.length / (completed.length + rejected.length) || 0
    const rejectionRate = rejected.length / instances.length
    const escalationRate = 0.10 // Would calculate based on escalation tracking

    return {
      onTimeCompletionRate,
      firstTimeApprovalRate,
      rejectionRate,
      escalationRate
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // ================================
  // Enhanced Error Handling Methods
  // ================================

  /**
   * Check system capacity before starting workflows
   */
  private async checkSystemCapacity(correlationId: string): Promise<void> {
    const activeWorkflows = this.instances.size
    
    if (activeWorkflows >= this.maxConcurrentWorkflows) {
      throw new WorkflowError(
        WorkflowErrorCode.WORKFLOW_SYSTEM_OVERLOAD,
        `System capacity exceeded. Active workflows: ${activeWorkflows}, Maximum: ${this.maxConcurrentWorkflows}`,
        {
          correlationId,
          timestamp: new Date(),
          activeWorkflows,
          systemLoad: activeWorkflows / this.maxConcurrentWorkflows
        },
        true
      )
    }
  }

  /**
   * Get validated workflow instance with existence check
   */
  private async getValidatedWorkflowInstance(instanceId: string, correlationId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new WorkflowError(
        WorkflowErrorCode.WORKFLOW_INSTANCE_NOT_FOUND,
        `Workflow instance not found: ${instanceId}`,
        {
          correlationId,
          workflowInstanceId: instanceId,
          timestamp: new Date()
        },
        false
      )
    }
    return instance
  }

  /**
   * Get target state for a transition
   */
  private getTargetState(definition: WorkflowDefinition, currentState: WorkflowState, action: WorkflowAction): WorkflowState {
    const transition = definition.transitions.find(
      t => t.fromState === currentState && t.action === action
    )
    return transition?.toState || currentState
  }

  /**
   * Execute transition with timeout protection
   */
  private async executeTransitionWithTimeout(
    instance: WorkflowInstance,
    transition: WorkflowTransition,
    action: WorkflowAction,
    performedBy: string,
    performedByRole: WorkflowRole,
    comment?: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): Promise<WorkflowInstance> {
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new WorkflowError(
          WorkflowErrorCode.WORKFLOW_EXECUTION_TIMEOUT,
          `Transition execution timed out after ${this.defaultTimeout}ms`,
          {
            correlationId: correlationId || crypto.randomUUID(),
            workflowInstanceId: instance.id,
            currentState: instance.currentState,
            targetState: transition.toState,
            action,
            userId: performedBy,
            userRole: performedByRole,
            timestamp: new Date(),
            metadata: { timeout: this.defaultTimeout }
          },
          true
        ))
      }, this.defaultTimeout)
    })

    const transitionPromise = this.performTransition(
      instance,
      transition,
      action,
      performedBy,
      performedByRole,
      comment,
      metadata
    )

    return await Promise.race([transitionPromise, timeoutPromise])
  }

  /**
   * Perform the actual transition logic
   */
  private async performTransition(
    instance: WorkflowInstance,
    transition: WorkflowTransition,
    action: WorkflowAction,
    performedBy: string,
    performedByRole: WorkflowRole,
    comment?: string,
    metadata?: Record<string, any>
  ): Promise<WorkflowInstance> {
    
    // Execute transition
    const previousState = instance.currentState
    instance.previousState = previousState
    instance.currentState = transition.toState
    instance.updatedAt = new Date().toISOString()

    // Log transition
    const transitionLog: WorkflowTransitionLog = {
      id: this.generateId(),
      workflowInstanceId: instance.id,
      fromState: previousState,
      toState: transition.toState,
      action,
      performedBy,
      performedByRole,
      comment,
      metadata,
      timestamp: new Date().toISOString()
    }

    instance.history.push(transitionLog)
    
    // Broadcast real-time workflow state change
    try {
      await websocketManager.broadcastWorkflowStateChange(
        instance,
        previousState,
        transition.toState,
        action,
        performedBy,
        transitionLog
      )
    } catch (error) {
      // Don't let WebSocket broadcasting errors fail the transition
      logger.warn('Failed to broadcast workflow state change', {
        workflowInstanceId: instance.id,
        fromState: previousState,
        toState: transition.toState,
        error: error.message
      })
    }
    
    return instance
  }

  /**
   * Verify transition integrity after execution
   */
  private async verifyTransitionIntegrity(instance: WorkflowInstance, expectedState: WorkflowState): Promise<void> {
    if (instance.currentState !== expectedState) {
      throw new WorkflowError(
        WorkflowErrorCode.STATE_VALIDATION_FAILED,
        `State validation failed. Expected: ${expectedState}, Actual: ${instance.currentState}`,
        {
          correlationId: instance.metadata?.correlationId || crypto.randomUUID(),
          workflowInstanceId: instance.id,
          currentState: instance.currentState,
          targetState: expectedState,
          timestamp: new Date()
        },
        true
      )
    }
  }

  /**
   * Start deadlock detection service
   */
  private startDeadlockDetection(): void {
    // Run deadlock detection every 30 seconds
    setInterval(async () => {
      try {
        await this.errorHandler.detectAndResolveDeadlocks()
      } catch (error) {
        logger.error('Deadlock detection failed', { error })
      }
    }, 30000)
  }

  /**
   * Start workflow health check service
   */
  private startWorkflowHealthCheck(): void {
    // Run health checks every 60 seconds
    setInterval(async () => {
      try {
        await this.performWorkflowHealthCheck()
      } catch (error) {
        logger.error('Workflow health check failed', { error })
      }
    }, 60000)
  }

  /**
   * Perform comprehensive workflow health check
   */
  private async performWorkflowHealthCheck(): Promise<void> {
    const now = Date.now()
    const stuckWorkflowThreshold = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [instanceId, instance] of this.instances.entries()) {
      const lastUpdate = new Date(instance.updatedAt).getTime()
      const timeSinceUpdate = now - lastUpdate
      
      // Check for stuck workflows
      if (timeSinceUpdate > stuckWorkflowThreshold && 
          instance.currentState !== WorkflowState.PUBLISHED && 
          instance.currentState !== WorkflowState.ARCHIVED) {
        
        const stuckError = new WorkflowError(
          WorkflowErrorCode.WORKFLOW_EXECUTION_TIMEOUT,
          `Workflow instance stuck in ${instance.currentState} state for ${Math.round(timeSinceUpdate / (60 * 60 * 1000))} hours`,
          {
            correlationId: crypto.randomUUID(),
            workflowInstanceId: instanceId,
            currentState: instance.currentState,
            timestamp: new Date(),
            metadata: { 
              timeSinceUpdate,
              lastUpdateTime: instance.updatedAt 
            }
          },
          true
        )
        
        await this.errorHandler.handleWorkflowError(stuckError, instance)
      }
    }
  }

  /**
   * Enhanced auto-transition processing with error handling
   */
  private async processAutoTransitions(instance: WorkflowInstance): Promise<void> {
    const definition = this.definitions.get(instance.workflowDefinitionId)
    if (!definition) return

    const autoTransition = definition.transitions.find(
      transition => 
        transition.fromState === instance.currentState &&
        transition.autoTransition
    )

    if (autoTransition) {
      try {
        await this.executeTransition(
          instance.id,
          autoTransition.action,
          'system',
          WorkflowRole.ADMIN,
          'Auto-transition executed'
        )
      } catch (error) {
        logger.error('Auto-transition failed', {
          workflowInstanceId: instance.id,
          currentState: instance.currentState,
          action: autoTransition.action,
          error
        })
        
        // Don't throw - auto-transition failures shouldn't break the main flow
      }
    }
  }
}

// ================================
// Workflow Validation Schemas
// ================================

export const WorkflowTransitionRequestSchema = z.object({
  instanceId: z.string().min(1, 'Instance ID is required'),
  action: z.nativeEnum(WorkflowAction),
  comment: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const StartWorkflowRequestSchema = z.object({
  contentType: z.nativeEnum(WorkflowContentType),
  contentId: z.string().min(1, 'Content ID is required'),
  metadata: z.record(z.any()).optional()
})

export const WorkflowQuerySchema = z.object({
  state: z.nativeEnum(WorkflowState).optional(),
  contentType: z.nativeEnum(WorkflowContentType).optional(),
  assignedTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// Export types
export type WorkflowTransitionRequest = z.infer<typeof WorkflowTransitionRequestSchema>
export type StartWorkflowRequest = z.infer<typeof StartWorkflowRequestSchema>
export type WorkflowQuery = z.infer<typeof WorkflowQuerySchema>

// Singleton instance
export const workflowEngine = new WorkflowEngine()