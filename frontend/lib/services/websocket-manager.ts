/**
 * Enhanced WebSocket Manager Service
 * 
 * Integrates with the enterprise WebSocket server to provide
 * simplified workflow-focused real-time updates
 */

import { WebSocketMessageType } from '@/app/api/websocket/route'
import { 
  WorkflowInstance, 
  WorkflowState, 
  WorkflowAction,
  WorkflowContentType,
  type WorkflowTransitionLog 
} from '@/lib/services/workflow-engine'
import { logger } from '@/lib/logger'

// ================================
// Workflow Event Types
// ================================

export interface WorkflowEvent {
  type: 'state_changed' | 'assigned' | 'comment_added' | 'approval_requested' | 'bulk_operation'
  workflowId: string
  contentType: WorkflowContentType
  contentId: string
  data: any
  timestamp: Date
  userId?: string
  correlationId?: string
}

export interface BulkOperationEvent {
  type: 'started' | 'progress' | 'completed' | 'failed'
  operationId: string
  operationType: 'approve' | 'reject' | 'publish' | 'archive' | 'bulk_edit'
  totalItems: number
  processedItems: number
  failedItems: number
  progress: number // 0-100
  data?: any
  timestamp: Date
  userId: string
}

export interface CollaborationEvent {
  type: 'user_typing' | 'user_viewing' | 'user_joined' | 'user_left'
  workflowId: string
  userId: string
  userEmail: string
  data?: any
  timestamp: Date
}

// ================================
// Enhanced WebSocket Manager
// ================================

export class WebSocketManager {
  private connections: Map<string, any> = new Map()
  private handlers: Map<string, Function[]> = new Map()
  private workflowSubscriptions: Map<string, Set<string>> = new Map() // workflowId -> userIds
  private bulkOperations: Map<string, BulkOperationEvent> = new Map()
  private enterpriseWsManager: any = null // Will be set when available
  
  constructor() {
    this.initializeEventHandlers()
    this.startBulkOperationCleanup()
    this.loadEnterpriseManager()
  }

  /**
   * Load enterprise WebSocket manager when available
   */
  private async loadEnterpriseManager(): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { websocketManager } = await import('@/app/api/websocket/route')
      this.enterpriseWsManager = websocketManager
      logger.info('Enterprise WebSocket manager loaded successfully')
    } catch (error) {
      logger.warn('Enterprise WebSocket manager not available, using fallback', { error: error.message })
    }
  }

  /**
   * Initialize event handlers for workflow integration
   */
  private initializeEventHandlers(): void {
    // Set up handlers for various workflow events
    this.on('workflow:state_changed', this.handleWorkflowStateChange.bind(this))
    this.on('workflow:assigned', this.handleWorkflowAssignment.bind(this))
    this.on('workflow:comment_added', this.handleWorkflowComment.bind(this))
    this.on('workflow:approval_requested', this.handleApprovalRequest.bind(this))
    this.on('bulk:operation', this.handleBulkOperation.bind(this))
  }

  /**
   * Create WebSocket connection (legacy interface maintained for compatibility)
   */
  async connect(id: string, url: string): Promise<void> {
    this.connections.set(id, { url, connected: true, connectedAt: new Date() })
    logger.info('WebSocket manager connection registered', { id, url })
  }
  
  /**
   * Disconnect WebSocket connection
   */
  async disconnect(id: string): Promise<void> {
    const connection = this.connections.get(id)
    if (connection) {
      this.connections.delete(id)
      logger.info('WebSocket manager connection removed', { id })
    }
  }
  
  /**
   * Send message through WebSocket (enhanced with workflow context)
   */
  async send(id: string, message: any): Promise<void> {
    const connection = this.connections.get(id)
    if (connection?.connected) {
      logger.debug('WebSocket message sent', { id, messageType: message.type })
    }
  }

  /**
   * Subscribe to workflow updates for real-time notifications
   */
  async subscribeToWorkflow(workflowId: string, userId: string): Promise<void> {
    if (!this.workflowSubscriptions.has(workflowId)) {
      this.workflowSubscriptions.set(workflowId, new Set())
    }
    this.workflowSubscriptions.get(workflowId)!.add(userId)

    // Broadcast user joined event
    this.broadcastWorkflowCollaboration({
      type: 'user_joined',
      workflowId,
      userId,
      userEmail: '', // Would be populated from user data
      timestamp: new Date()
    })

    logger.info('User subscribed to workflow updates', { workflowId, userId })
  }

  /**
   * Unsubscribe from workflow updates
   */
  async unsubscribeFromWorkflow(workflowId: string, userId: string): Promise<void> {
    const subscribers = this.workflowSubscriptions.get(workflowId)
    if (subscribers) {
      subscribers.delete(userId)
      
      if (subscribers.size === 0) {
        this.workflowSubscriptions.delete(workflowId)
      }

      // Broadcast user left event
      this.broadcastWorkflowCollaboration({
        type: 'user_left',
        workflowId,
        userId,
        userEmail: '',
        timestamp: new Date()
      })
    }

    logger.info('User unsubscribed from workflow updates', { workflowId, userId })
  }

  /**
   * Broadcast workflow state change to all subscribers
   */
  async broadcastWorkflowStateChange(
    instance: WorkflowInstance,
    fromState: WorkflowState,
    toState: WorkflowState,
    action: WorkflowAction,
    performedBy: string,
    transitionLog: WorkflowTransitionLog
  ): Promise<void> {
    const event: WorkflowEvent = {
      type: 'state_changed',
      workflowId: instance.id,
      contentType: instance.contentType,
      contentId: instance.contentId,
      data: {
        fromState,
        toState,
        action,
        performedBy,
        performedByRole: transitionLog.performedByRole,
        comment: transitionLog.comment,
        transition: transitionLog,
        instance: this.sanitizeWorkflowInstance(instance)
      },
      timestamp: new Date(),
      userId: performedBy,
      correlationId: instance.metadata?.correlationId
    }

    // Emit local event
    this.emit('workflow:state_changed', event)

    // Broadcast via enterprise WebSocket manager if available
    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastWorkflowUpdate(
        instance.id,
        WebSocketMessageType.WORKFLOW_STATE_CHANGED,
        event.data,
        {
          channels: [`workflow:${instance.id}`, 'workflow:updates'],
          userRoles: ['admin', 'reviewer', 'approver', 'author']
        }
      )
    }

    logger.info('Workflow state change broadcasted', {
      workflowId: instance.id,
      fromState,
      toState,
      action,
      performedBy,
      subscriberCount: this.workflowSubscriptions.get(instance.id)?.size || 0
    })
  }

  /**
   * Broadcast workflow assignment
   */
  async broadcastWorkflowAssignment(
    workflowId: string,
    assignedTo: string,
    assignedBy: string,
    assignedRole: string
  ): Promise<void> {
    const event: WorkflowEvent = {
      type: 'assigned',
      workflowId,
      contentType: WorkflowContentType.BLOG_POST, // Would be determined from workflow
      contentId: '', // Would be populated
      data: {
        assignedTo,
        assignedBy,
        assignedRole,
        assignedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      userId: assignedBy
    }

    this.emit('workflow:assigned', event)

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastWorkflowUpdate(
        workflowId,
        WebSocketMessageType.WORKFLOW_ASSIGNED,
        event.data
      )
    }

    logger.info('Workflow assignment broadcasted', {
      workflowId,
      assignedTo,
      assignedBy,
      assignedRole
    })
  }

  /**
   * Broadcast workflow comment addition
   */
  async broadcastWorkflowComment(
    workflowId: string,
    comment: string,
    commentBy: string,
    commentType: 'approval' | 'rejection' | 'general' = 'general'
  ): Promise<void> {
    const event: WorkflowEvent = {
      type: 'comment_added',
      workflowId,
      contentType: WorkflowContentType.BLOG_POST,
      contentId: '',
      data: {
        comment,
        commentBy,
        commentType,
        commentAt: new Date().toISOString()
      },
      timestamp: new Date(),
      userId: commentBy
    }

    this.emit('workflow:comment_added', event)

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastWorkflowUpdate(
        workflowId,
        WebSocketMessageType.WORKFLOW_COMMENT_ADDED,
        event.data
      )
    }

    logger.info('Workflow comment broadcasted', {
      workflowId,
      commentBy,
      commentType,
      commentLength: comment.length
    })
  }

  /**
   * Broadcast approval request
   */
  async broadcastApprovalRequest(
    workflowId: string,
    requestedBy: string,
    approvers: string[],
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    dueDate?: Date
  ): Promise<void> {
    const event: WorkflowEvent = {
      type: 'approval_requested',
      workflowId,
      contentType: WorkflowContentType.BLOG_POST,
      contentId: '',
      data: {
        requestedBy,
        approvers,
        priority,
        dueDate: dueDate?.toISOString(),
        requestedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      userId: requestedBy
    }

    this.emit('workflow:approval_requested', event)

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastWorkflowUpdate(
        workflowId,
        WebSocketMessageType.WORKFLOW_APPROVAL_REQUESTED,
        event.data,
        {
          userRoles: ['approver', 'admin']
        }
      )
    }

    logger.info('Approval request broadcasted', {
      workflowId,
      requestedBy,
      approverCount: approvers.length,
      priority
    })
  }

  /**
   * Start bulk operation and broadcast updates
   */
  async startBulkOperation(
    operationId: string,
    operationType: BulkOperationEvent['operationType'],
    totalItems: number,
    userId: string
  ): Promise<void> {
    const operation: BulkOperationEvent = {
      type: 'started',
      operationId,
      operationType,
      totalItems,
      processedItems: 0,
      failedItems: 0,
      progress: 0,
      timestamp: new Date(),
      userId
    }

    this.bulkOperations.set(operationId, operation)
    this.emit('bulk:operation', operation)

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastBulkOperationUpdate(
        operationId,
        WebSocketMessageType.BULK_OPERATION_STARTED,
        operation
      )
    }

    logger.info('Bulk operation started', {
      operationId,
      operationType,
      totalItems,
      userId
    })
  }

  /**
   * Update bulk operation progress
   */
  async updateBulkOperationProgress(
    operationId: string,
    processedItems: number,
    failedItems: number = 0,
    data?: any
  ): Promise<void> {
    const operation = this.bulkOperations.get(operationId)
    if (!operation) return

    const progress = Math.round((processedItems / operation.totalItems) * 100)

    const updatedOperation: BulkOperationEvent = {
      ...operation,
      type: 'progress',
      processedItems,
      failedItems,
      progress,
      data,
      timestamp: new Date()
    }

    this.bulkOperations.set(operationId, updatedOperation)
    this.emit('bulk:operation', updatedOperation)

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastBulkOperationUpdate(
        operationId,
        WebSocketMessageType.BULK_OPERATION_PROGRESS,
        updatedOperation
      )
    }

    logger.debug('Bulk operation progress updated', {
      operationId,
      processedItems,
      totalItems: operation.totalItems,
      progress,
      failedItems
    })
  }

  /**
   * Complete bulk operation
   */
  async completeBulkOperation(
    operationId: string,
    success: boolean = true,
    data?: any
  ): Promise<void> {
    const operation = this.bulkOperations.get(operationId)
    if (!operation) return

    const completedOperation: BulkOperationEvent = {
      ...operation,
      type: success ? 'completed' : 'failed',
      progress: success ? 100 : operation.progress,
      data,
      timestamp: new Date()
    }

    // Update the operation in the map
    this.bulkOperations.set(operationId, completedOperation)

    this.emit('bulk:operation', completedOperation)

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastBulkOperationUpdate(
        operationId,
        success ? WebSocketMessageType.BULK_OPERATION_COMPLETED : WebSocketMessageType.BULK_OPERATION_PROGRESS,
        completedOperation
      )
    }

    // Keep operation for a while for status queries
    setTimeout(() => {
      this.bulkOperations.delete(operationId)
    }, 300000) // 5 minutes

    logger.info('Bulk operation completed', {
      operationId,
      success,
      processedItems: operation.processedItems,
      failedItems: operation.failedItems,
      totalTime: Date.now() - operation.timestamp.getTime()
    })
  }

  /**
   * Broadcast collaboration events
   */
  async broadcastWorkflowCollaboration(event: CollaborationEvent): Promise<void> {
    const messageType = event.type === 'user_typing' ? WebSocketMessageType.USER_TYPING :
                       event.type === 'user_viewing' ? WebSocketMessageType.USER_VIEWING :
                       event.type === 'user_joined' ? WebSocketMessageType.USER_JOINED_WORKFLOW :
                       WebSocketMessageType.USER_LEFT_WORKFLOW

    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.broadcastWorkflowUpdate(
        event.workflowId,
        messageType,
        {
          userId: event.userId,
          userEmail: event.userEmail,
          data: event.data,
          timestamp: event.timestamp.toISOString()
        }
      )
    }

    logger.debug('Collaboration event broadcasted', {
      type: event.type,
      workflowId: event.workflowId,
      userId: event.userId
    })
  }

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(operationId: string): BulkOperationEvent | null {
    return this.bulkOperations.get(operationId) || null
  }

  /**
   * Get active bulk operations
   */
  getActiveBulkOperations(): BulkOperationEvent[] {
    return Array.from(this.bulkOperations.values())
      .filter(op => op.type !== 'completed' && op.type !== 'failed')
  }

  /**
   * Event handlers
   */
  on(event: string, handler: Function): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)?.push(handler)
  }
  
  off(event: string, handler: Function): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          logger.error('Error in WebSocket event handler', { event, error })
        }
      })
    }
  }

  /**
   * Handle workflow state changes
   */
  private handleWorkflowStateChange(event: WorkflowEvent): void {
    // Additional processing for workflow state changes
    logger.debug('Handling workflow state change', {
      workflowId: event.workflowId,
      type: event.type,
      timestamp: event.timestamp
    })
  }

  /**
   * Handle workflow assignments
   */
  private handleWorkflowAssignment(event: WorkflowEvent): void {
    logger.debug('Handling workflow assignment', {
      workflowId: event.workflowId,
      assignedTo: event.data.assignedTo
    })
  }

  /**
   * Handle workflow comments
   */
  private handleWorkflowComment(event: WorkflowEvent): void {
    logger.debug('Handling workflow comment', {
      workflowId: event.workflowId,
      commentBy: event.data.commentBy,
      commentType: event.data.commentType
    })
  }

  /**
   * Handle approval requests
   */
  private handleApprovalRequest(event: WorkflowEvent): void {
    logger.debug('Handling approval request', {
      workflowId: event.workflowId,
      approverCount: event.data.approvers?.length || 0,
      priority: event.data.priority
    })
  }

  /**
   * Handle bulk operations
   */
  private handleBulkOperation(event: BulkOperationEvent): void {
    logger.debug('Handling bulk operation event', {
      operationId: event.operationId,
      type: event.type,
      progress: event.progress
    })
  }

  /**
   * Sanitize workflow instance for broadcasting
   */
  private sanitizeWorkflowInstance(instance: WorkflowInstance): Partial<WorkflowInstance> {
    return {
      id: instance.id,
      contentType: instance.contentType,
      contentId: instance.contentId,
      currentState: instance.currentState,
      previousState: instance.previousState,
      priority: instance.priority,
      assignedTo: instance.assignedTo,
      assignedToRole: instance.assignedToRole,
      createdBy: instance.createdBy,
      updatedAt: instance.updatedAt,
      // Exclude sensitive metadata and full history
      metadata: {
        title: instance.metadata.title,
        tags: instance.metadata.tags
      }
    }
  }

  /**
   * Start cleanup for old bulk operations
   */
  private startBulkOperationCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      for (const [operationId, operation] of this.bulkOperations.entries()) {
        if (now - operation.timestamp.getTime() > maxAge) {
          this.bulkOperations.delete(operationId)
          logger.debug('Cleaned up old bulk operation', { operationId })
        }
      }
    }, 60 * 60 * 1000) // Run cleanup every hour
  }

  /**
   * Get connection statistics
   */
  getStats(): any {
    const enterpriseStats = this.enterpriseWsManager ? this.enterpriseWsManager.getStats() : null
    
    return {
      localConnections: this.connections.size,
      workflowSubscriptions: this.workflowSubscriptions.size,
      activeBulkOperations: Array.from(this.bulkOperations.values())
        .filter(op => op.type !== 'completed' && op.type !== 'failed').length,
      totalBulkOperations: this.bulkOperations.size,
      enterpriseStats
    }
  }
  
  /**
   * Shutdown WebSocket manager
   */
  async shutdown(): Promise<void> {
    for (const id of this.connections.keys()) {
      await this.disconnect(id)
    }
    this.handlers.clear()
    this.workflowSubscriptions.clear()
    this.bulkOperations.clear()
    
    if (this.enterpriseWsManager) {
      this.enterpriseWsManager.shutdown()
    }
    
    logger.info('WebSocket manager shutdown completed')
  }
}

export const websocketManager = new WebSocketManager()