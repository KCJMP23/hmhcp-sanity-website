/**
 * Workflow Data Access Layer
 * Database operations for content workflow management system
 * Story 1.4 Task 8 - Comprehensive workflow management system
 */

import { InjectableBaseDAL } from './base-injectable'
import type { 
  WorkflowInstance,
  WorkflowInstanceCreate,
  WorkflowInstanceUpdate,
  WorkflowTransitionLog,
  WorkflowTransitionLogCreate,
  WorkflowDefinition,
  WorkflowDefinitionCreate,
  WorkflowDefinitionUpdate,
  WorkflowNotification,
  WorkflowNotificationCreate,
  WorkflowNotificationUpdate,
  WorkflowInstanceCreateSchema,
  WorkflowInstanceUpdateSchema,
  WorkflowTransitionLogCreateSchema,
  WorkflowDefinitionCreateSchema,
  WorkflowDefinitionUpdateSchema,
  WorkflowNotificationCreateSchema,
  WorkflowNotificationUpdateSchema,
  WorkflowState,
  WorkflowRole,
  QueryResult,
  PaginatedResult,
  QueryOptions
} from './types'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// ================================
// Workflow Instance DAL
// ================================

export class WorkflowInstanceDAL extends InjectableBaseDAL<
  WorkflowInstance,
  WorkflowInstanceCreate,
  WorkflowInstanceUpdate
> {
  constructor(supabase: SupabaseClient, utils?: any) {
    super(
      supabase,
      'workflow_instances',
      ['content_type', 'current_state', 'assigned_to'],
      true, // requires audit
      utils
    )
  }

  protected getCreateSchema() {
    return WorkflowInstanceCreateSchema
  }

  protected getUpdateSchema() {
    return WorkflowInstanceUpdateSchema
  }

  protected transformForSave(data: WorkflowInstanceCreate | WorkflowInstanceUpdate): Record<string, any> {
    return {
      workflow_definition_id: data.workflow_definition_id,
      content_type: data.content_type,
      content_id: data.content_id,
      current_state: data.current_state,
      previous_state: (data as WorkflowInstanceUpdate).previous_state,
      assigned_to: data.assigned_to,
      assigned_to_role: data.assigned_to_role,
      priority: data.priority,
      due_date: data.due_date,
      metadata: data.metadata || {}
    }
  }

  protected transformFromDatabase(data: Record<string, any>): WorkflowInstance {
    return {
      id: data.id,
      workflow_definition_id: data.workflow_definition_id,
      content_type: data.content_type,
      content_id: data.content_id,
      current_state: data.current_state,
      previous_state: data.previous_state,
      assigned_to: data.assigned_to,
      assigned_to_role: data.assigned_to_role,
      priority: data.priority,
      due_date: data.due_date,
      metadata: data.metadata || {},
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Get workflow instances by content
   */
  async getByContent(contentType: string, contentId: string): Promise<QueryResult<WorkflowInstance[]>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .order('created_at', { ascending: false })
      }, 'getByContent')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      const instances = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: instances, error: null }

    } catch (error) {
      logger.error('Get workflow instances by content failed', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get by content failed'
      }
    }
  }

  /**
   * Get active workflow instance for content
   */
  async getActiveByContent(contentType: string, contentId: string): Promise<QueryResult<WorkflowInstance>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .not('current_state', 'in', '(published,archived)')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      }, 'getActiveByContent')

      if (result.error || !result.data) {
        return { data: null, error: result.error?.message || 'No active workflow found' }
      }

      const instance = this.transformFromDatabase(result.data)
      return { data: instance, error: null }

    } catch (error) {
      logger.error('Get active workflow instance failed', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get active workflow failed'
      }
    }
  }

  /**
   * Get workflows by state
   */
  async getByState(state: WorkflowState, options: QueryOptions = {}): Promise<PaginatedResult<WorkflowInstance>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const { from, to, page, limit } = utils.buildPaginationParams(options)

      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('current_state', state)

      query = utils.applyQueryConditions(query, options)
      query = query.range(from, to)

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getByState')

      if (result.error) {
        logger.error('Get workflows by state failed', {
          state,
          error: result.error.message,
          options
        })
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const instances = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.data?.length || 0

      return {
        data: instances,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      logger.error('Get workflows by state failed', {
        state,
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Get workflows assigned to user
   */
  async getAssignedToUser(userId: string, options: QueryOptions = {}): Promise<PaginatedResult<WorkflowInstance>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const { from, to, page, limit } = utils.buildPaginationParams(options)

      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('assigned_to', userId)

      query = utils.applyQueryConditions(query, options)
      query = query.range(from, to)

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getAssignedToUser')

      if (result.error) {
        logger.error('Get workflows assigned to user failed', {
          userId,
          error: result.error.message,
          options
        })
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const instances = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.data?.length || 0

      return {
        data: instances,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      logger.error('Get workflows assigned to user failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Get overdue workflows
   */
  async getOverdue(options: QueryOptions = {}): Promise<PaginatedResult<WorkflowInstance>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const { from, to, page, limit } = utils.buildPaginationParams(options)

      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .not('current_state', 'in', '(published,archived)')
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString())

      query = utils.applyQueryConditions(query, options)
      query = query.range(from, to)

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getOverdue')

      if (result.error) {
        logger.error('Get overdue workflows failed', {
          error: result.error.message,
          options
        })
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const instances = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.data?.length || 0

      return {
        data: instances,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      logger.error('Get overdue workflows failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  private async getUtils(): Promise<any> {
    // Import utils dynamically to avoid circular dependencies
    const utils = await import('./utils')
    return utils
  }
}

// ================================
// Workflow Transition Log DAL
// ================================

export class WorkflowTransitionLogDAL extends InjectableBaseDAL<
  WorkflowTransitionLog,
  WorkflowTransitionLogCreate,
  never
> {
  constructor(supabase: SupabaseClient, utils?: any) {
    super(
      supabase,
      'workflow_transition_logs',
      ['action', 'performed_by'],
      true, // requires audit
      utils
    )
  }

  protected getCreateSchema() {
    return WorkflowTransitionLogCreateSchema
  }

  protected getUpdateSchema() {
    return z.object({}) // No updates allowed
  }

  protected transformForSave(data: WorkflowTransitionLogCreate): Record<string, any> {
    return {
      workflow_instance_id: data.workflow_instance_id,
      from_state: data.from_state,
      to_state: data.to_state,
      action: data.action,
      performed_by: data.performed_by,
      performed_by_role: data.performed_by_role,
      comment: data.comment,
      metadata: data.metadata || {},
      duration_ms: data.duration_ms,
      timestamp: new Date().toISOString()
    }
  }

  protected transformFromDatabase(data: Record<string, any>): WorkflowTransitionLog {
    return {
      id: data.id,
      workflow_instance_id: data.workflow_instance_id,
      from_state: data.from_state,
      to_state: data.to_state,
      action: data.action,
      performed_by: data.performed_by,
      performed_by_role: data.performed_by_role,
      comment: data.comment,
      metadata: data.metadata || {},
      timestamp: data.timestamp,
      duration_ms: data.duration_ms
    }
  }

  /**
   * Get transition history for workflow instance
   */
  async getByWorkflowInstance(workflowInstanceId: string): Promise<QueryResult<WorkflowTransitionLog[]>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('workflow_instance_id', workflowInstanceId)
          .order('timestamp', { ascending: true })
      }, 'getByWorkflowInstance')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      const logs = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: logs, error: null }

    } catch (error) {
      logger.error('Get transition logs by workflow instance failed', {
        workflowInstanceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get transition logs failed'
      }
    }
  }

  /**
   * Get recent activity for user
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<QueryResult<WorkflowTransitionLog[]>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('performed_by', userId)
          .order('timestamp', { ascending: false })
          .limit(limit)
      }, 'getRecentActivity')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      const logs = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: logs, error: null }

    } catch (error) {
      logger.error('Get recent activity failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get recent activity failed'
      }
    }
  }

  private async getUtils(): Promise<any> {
    const utils = await import('./utils')
    return utils
  }
}

// ================================
// Workflow Definition DAL
// ================================

export class WorkflowDefinitionDAL extends InjectableBaseDAL<
  WorkflowDefinition,
  WorkflowDefinitionCreate,
  WorkflowDefinitionUpdate
> {
  constructor(supabase: SupabaseClient, utils?: any) {
    super(
      supabase,
      'workflow_definitions',
      ['name', 'content_type'],
      true, // requires audit
      utils
    )
  }

  protected getCreateSchema() {
    return WorkflowDefinitionCreateSchema
  }

  protected getUpdateSchema() {
    return WorkflowDefinitionUpdateSchema
  }

  protected transformForSave(data: WorkflowDefinitionCreate | WorkflowDefinitionUpdate): Record<string, any> {
    return {
      name: data.name,
      content_type: (data as WorkflowDefinitionCreate).content_type,
      definition: data.definition,
      is_active: data.is_active,
      version: data.version
    }
  }

  protected transformFromDatabase(data: Record<string, any>): WorkflowDefinition {
    return {
      id: data.id,
      name: data.name,
      content_type: data.content_type,
      definition: data.definition || {},
      is_active: data.is_active,
      version: data.version,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Get workflow definition by content type
   */
  async getByContentType(contentType: string): Promise<QueryResult<WorkflowDefinition>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('content_type', contentType)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      }, 'getByContentType')

      if (result.error || !result.data) {
        return { data: null, error: result.error?.message || 'Workflow definition not found' }
      }

      const definition = this.transformFromDatabase(result.data)
      return { data: definition, error: null }

    } catch (error) {
      logger.error('Get workflow definition by content type failed', {
        contentType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get workflow definition failed'
      }
    }
  }

  /**
   * Get active workflow definitions
   */
  async getActive(): Promise<QueryResult<WorkflowDefinition[]>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('is_active', true)
          .order('content_type', { ascending: true })
      }, 'getActive')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      const definitions = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: definitions, error: null }

    } catch (error) {
      logger.error('Get active workflow definitions failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get active workflow definitions failed'
      }
    }
  }

  private async getUtils(): Promise<any> {
    const utils = await import('./utils')
    return utils
  }
}

// ================================
// Workflow Notification DAL
// ================================

export class WorkflowNotificationDAL extends InjectableBaseDAL<
  WorkflowNotification,
  WorkflowNotificationCreate,
  WorkflowNotificationUpdate
> {
  constructor(supabase: SupabaseClient, utils?: any) {
    super(
      supabase,
      'workflow_notifications',
      ['subject', 'content'],
      false, // audit not required for notifications
      utils
    )
  }

  protected getCreateSchema() {
    return WorkflowNotificationCreateSchema
  }

  protected getUpdateSchema() {
    return WorkflowNotificationUpdateSchema
  }

  protected transformForSave(data: WorkflowNotificationCreate | WorkflowNotificationUpdate): Record<string, any> {
    return {
      workflow_instance_id: (data as WorkflowNotificationCreate).workflow_instance_id,
      recipient_id: (data as WorkflowNotificationCreate).recipient_id,
      recipient_type: (data as WorkflowNotificationCreate).recipient_type,
      notification_type: (data as WorkflowNotificationCreate).notification_type,
      subject: (data as WorkflowNotificationCreate).subject,
      content: (data as WorkflowNotificationCreate).content,
      is_read: data.is_read,
      read_at: data.read_at,
      sent_at: (data as WorkflowNotificationCreate).subject ? new Date().toISOString() : undefined
    }
  }

  protected transformFromDatabase(data: Record<string, any>): WorkflowNotification {
    return {
      id: data.id,
      workflow_instance_id: data.workflow_instance_id,
      recipient_id: data.recipient_id,
      recipient_type: data.recipient_type,
      notification_type: data.notification_type,
      subject: data.subject,
      content: data.content,
      is_read: data.is_read || false,
      sent_at: data.sent_at,
      read_at: data.read_at,
      created_at: data.created_at
    }
  }

  /**
   * Get notifications for recipient
   */
  async getForRecipient(
    recipientId: string,
    unreadOnly: boolean = false,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<WorkflowNotification>> {
    try {
      this.validateAccess('read')

      const utils = await this.getUtils()
      const { from, to, page, limit } = utils.buildPaginationParams(options)

      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('recipient_id', recipientId)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      query = utils.applyQueryConditions(query, options)
      query = query.range(from, to)

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getForRecipient')

      if (result.error) {
        logger.error('Get notifications for recipient failed', {
          recipientId,
          error: result.error.message,
          options
        })
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const notifications = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.data?.length || 0

      return {
        data: notifications,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      logger.error('Get notifications for recipient failed', {
        recipientId,
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<QueryResult<WorkflowNotification>> {
    return this.update(notificationId, {
      is_read: true,
      read_at: new Date().toISOString()
    })
  }

  /**
   * Mark all notifications as read for recipient
   */
  async markAllAsRead(recipientId: string): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')

      const utils = await this.getUtils()
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('recipient_id', recipientId)
          .eq('is_read', false)
      }, 'markAllAsRead')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      return { data: true, error: null }

    } catch (error) {
      logger.error('Mark all notifications as read failed', {
        recipientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Mark all as read failed'
      }
    }
  }

  private async getUtils(): Promise<any> {
    const utils = await import('./utils')
    return utils
  }
}