/**
 * Content Scheduler Service
 * Comprehensive scheduling system for healthcare content management
 * Handles content scheduling, conflict detection, queue management, and notifications
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import {
  BlogPost,
  Page,
  Platform,
  Service,
  ContentStatus,
  QueryResult,
  PaginatedResult,
  AdminRole,
  DataAccessContext
} from '@/lib/dal/admin/types'

// ================================
// Scheduling Types and Schemas
// ================================

export enum SchedulingStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ContentType {
  BLOG_POST = 'blog_post',
  PAGE = 'page',
  PLATFORM = 'platform',
  SERVICE = 'service',
  TEAM_MEMBER = 'team_member',
  TESTIMONIAL = 'testimonial'
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export enum ConflictType {
  TIME_OVERLAP = 'time_overlap',
  RESOURCE_CONFLICT = 'resource_conflict',
  CATEGORY_SATURATION = 'category_saturation',
  AUTHOR_OVERLOAD = 'author_overload'
}

export interface ScheduledContent {
  id: string
  content_type: ContentType
  content_id: string
  title: string
  scheduled_for: string
  timezone: string
  status: SchedulingStatus
  priority: number
  auto_social_share: boolean
  notification_settings: NotificationSettings
  retry_count: number
  max_retries: number
  error_message?: string
  metadata: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
  processed_at?: string
  published_at?: string
}

export interface NotificationSettings {
  channels: NotificationChannel[]
  recipients: string[]
  send_on_success: boolean
  send_on_failure: boolean
  advance_notice_hours: number[]
  custom_message?: string
}

export interface ConflictDetection {
  type: ConflictType
  severity: 'low' | 'medium' | 'high'
  description: string
  conflicting_items: string[]
  suggestions: string[]
  auto_resolvable: boolean
}

export interface SchedulingQueue {
  pending: ScheduledContent[]
  processing: ScheduledContent[]
  failed: ScheduledContent[]
  scheduled_today: ScheduledContent[]
  upcoming: ScheduledContent[]
}

// ================================
// Zod Schemas
// ================================

export const NotificationSettingsSchema = z.object({
  channels: z.array(z.nativeEnum(NotificationChannel)).default([NotificationChannel.EMAIL]),
  recipients: z.array(z.string().email()).default([]),
  send_on_success: z.boolean().default(true),
  send_on_failure: z.boolean().default(true),
  advance_notice_hours: z.array(z.number().int().min(1).max(168)).default([24, 2]),
  custom_message: z.string().optional()
})

export const ScheduledContentCreateSchema = z.object({
  content_type: z.nativeEnum(ContentType),
  content_id: z.string().uuid('Valid content ID required'),
  title: z.string().min(1, 'Title is required'),
  scheduled_for: z.string().datetime('Valid datetime required'),
  timezone: z.string().default('America/New_York'),
  priority: z.number().int().min(1).max(10).default(5),
  auto_social_share: z.boolean().default(false),
  notification_settings: NotificationSettingsSchema.default({}),
  max_retries: z.number().int().min(0).max(5).default(3),
  metadata: z.record(z.any()).default({})
})

export const ScheduledContentUpdateSchema = z.object({
  scheduled_for: z.string().datetime().optional(),
  timezone: z.string().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  auto_social_share: z.boolean().optional(),
  notification_settings: NotificationSettingsSchema.optional(),
  max_retries: z.number().int().min(0).max(5).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.nativeEnum(SchedulingStatus).optional()
})

export const SchedulingQuerySchema = z.object({
  content_type: z.nativeEnum(ContentType).optional(),
  status: z.nativeEnum(SchedulingStatus).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  created_by: z.string().uuid().optional(),
  priority_min: z.number().int().min(1).max(10).optional(),
  priority_max: z.number().int().min(1).max(10).optional(),
  timezone: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// ================================
// Content Scheduler Service
// ================================

export class ContentSchedulerService {
  private client: SupabaseClient
  private context?: DataAccessContext
  private readonly tableName = 'scheduled_content'

  constructor(client: SupabaseClient) {
    this.client = client
  }

  // ================================
  // Context Management
  // ================================

  public setContext(context: DataAccessContext): this {
    this.context = context
    return this
  }

  private validateAccess(action: 'read' | 'write' | 'delete'): void {
    if (!this.context) {
      throw new Error('Data access context is required for scheduling operations')
    }

    const requiredPermissions = {
      read: ['schedule:read', 'content:read'],
      write: ['schedule:write', 'content:write'],
      delete: ['schedule:delete', 'content:delete']
    }

    const hasPermission = requiredPermissions[action].some(permission =>
      this.context!.permissions.includes(permission) || 
      this.context!.role === AdminRole.SUPER_ADMIN
    )

    if (!hasPermission) {
      throw new Error(`Insufficient permissions for scheduling ${action} operation`)
    }
  }

  // ================================
  // Scheduling Operations
  // ================================

  /**
   * Schedule content for publication
   */
  public async scheduleContent(data: z.infer<typeof ScheduledContentCreateSchema>): Promise<QueryResult<ScheduledContent>> {
    try {
      this.validateAccess('write')

      // Validate input
      const validation = ScheduledContentCreateSchema.safeParse(data)
      if (!validation.success) {
        return {
          data: null,
          error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`
        }
      }

      const scheduleData = validation.data

      // Check for conflicts
      const conflicts = await this.detectConflicts(scheduleData)
      if (conflicts.some(c => c.severity === 'high' && !c.auto_resolvable)) {
        return {
          data: null,
          error: `High-priority conflicts detected: ${conflicts.map(c => c.description).join(', ')}`
        }
      }

      // Verify content exists and is ready for scheduling
      const contentValidation = await this.validateContentForScheduling(
        scheduleData.content_type,
        scheduleData.content_id
      )

      if (!contentValidation.isValid) {
        return {
          data: null,
          error: contentValidation.error
        }
      }

      // Create scheduled content entry
      const scheduledContent = {
        ...scheduleData,
        status: SchedulingStatus.SCHEDULED,
        retry_count: 0,
        created_by: this.context!.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = await this.client
        .from(this.tableName)
        .insert(scheduledContent)
        .select()
        .single()

      if (result.error) {
        logger.error('Failed to schedule content', {
          error: result.error.message,
          contentType: scheduleData.content_type,
          contentId: scheduleData.content_id
        })
        return { data: null, error: result.error.message }
      }

      // Send scheduling notifications
      await this.sendNotification(result.data as ScheduledContent, 'scheduled')

      // Log audit trail
      logger.info('Content scheduled successfully', {
        scheduleId: result.data.id,
        contentType: scheduleData.content_type,
        contentId: scheduleData.content_id,
        scheduledFor: scheduleData.scheduled_for,
        createdBy: this.context!.userId
      })

      return { data: result.data as ScheduledContent, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Schedule content operation failed', {
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update scheduled content
   */
  public async updateScheduledContent(
    id: string,
    data: z.infer<typeof ScheduledContentUpdateSchema>
  ): Promise<QueryResult<ScheduledContent>> {
    try {
      this.validateAccess('write')

      // Validate input
      const validation = ScheduledContentUpdateSchema.safeParse(data)
      if (!validation.success) {
        return {
          data: null,
          error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`
        }
      }

      const updateData = validation.data

      // Get current scheduled content
      const current = await this.getScheduledContent(id)
      if (!current.data) {
        return { data: null, error: 'Scheduled content not found' }
      }

      // Check if update creates conflicts
      if (updateData.scheduled_for) {
        const tempData = {
          ...current.data,
          scheduled_for: updateData.scheduled_for,
          timezone: updateData.timezone || current.data.timezone
        }
        
        const conflicts = await this.detectConflicts(tempData)
        if (conflicts.some(c => c.severity === 'high' && !c.auto_resolvable)) {
          return {
            data: null,
            error: `Update would create conflicts: ${conflicts.map(c => c.description).join(', ')}`
          }
        }
      }

      // Update scheduled content
      const result = await this.client
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (result.error) {
        logger.error('Failed to update scheduled content', {
          error: result.error.message,
          scheduleId: id
        })
        return { data: null, error: result.error.message }
      }

      logger.info('Scheduled content updated successfully', {
        scheduleId: id,
        updatedBy: this.context!.userId
      })

      return { data: result.data as ScheduledContent, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Update scheduled content operation failed', {
        error: errorMessage,
        scheduleId: id
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Cancel scheduled content
   */
  public async cancelScheduledContent(id: string, reason?: string): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')

      const result = await this.client
        .from(this.tableName)
        .update({
          status: SchedulingStatus.CANCELLED,
          metadata: {
            cancelled_reason: reason,
            cancelled_by: this.context!.userId,
            cancelled_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      // Send cancellation notification
      await this.sendNotification(result.data as ScheduledContent, 'cancelled')

      logger.info('Scheduled content cancelled', {
        scheduleId: id,
        reason,
        cancelledBy: this.context!.userId
      })

      return { data: true, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Cancel scheduled content operation failed', {
        error: errorMessage,
        scheduleId: id
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get scheduled content by ID
   */
  public async getScheduledContent(id: string): Promise<QueryResult<ScheduledContent>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      return { data: result.data as ScheduledContent, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get scheduled content with filtering and pagination
   */
  public async getScheduledContentList(
    query: z.infer<typeof SchedulingQuerySchema> = {}
  ): Promise<PaginatedResult<ScheduledContent>> {
    try {
      this.validateAccess('read')

      const validation = SchedulingQuerySchema.safeParse(query)
      if (!validation.success) {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const params = validation.data

      // Build query
      let dbQuery = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })

      // Apply filters
      if (params.content_type) {
        dbQuery = dbQuery.eq('content_type', params.content_type)
      }
      if (params.status) {
        dbQuery = dbQuery.eq('status', params.status)
      }
      if (params.created_by) {
        dbQuery = dbQuery.eq('created_by', params.created_by)
      }
      if (params.date_from) {
        dbQuery = dbQuery.gte('scheduled_for', params.date_from)
      }
      if (params.date_to) {
        dbQuery = dbQuery.lte('scheduled_for', params.date_to)
      }
      if (params.priority_min) {
        dbQuery = dbQuery.gte('priority', params.priority_min)
      }
      if (params.priority_max) {
        dbQuery = dbQuery.lte('priority', params.priority_max)
      }
      if (params.timezone) {
        dbQuery = dbQuery.eq('timezone', params.timezone)
      }

      // Apply pagination
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1

      dbQuery = dbQuery
        .range(from, to)
        .order('scheduled_for', { ascending: true })
        .order('priority', { ascending: false })

      const result = await dbQuery

      if (result.error) {
        logger.error('Failed to get scheduled content list', {
          error: result.error.message
        })
        return {
          data: [],
          total: 0,
          page: params.page,
          limit: params.limit,
          hasNext: false,
          hasPrev: false
        }
      }

      const total = result.count || 0
      const data = (result.data || []) as ScheduledContent[]

      return {
        data,
        total,
        page: params.page,
        limit: params.limit,
        hasNext: to < total - 1,
        hasPrev: params.page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get scheduled content list operation failed', {
        error: errorMessage
      })
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 20,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Get scheduling queue organized by status
   */
  public async getSchedulingQueue(): Promise<QueryResult<SchedulingQueue>> {
    try {
      this.validateAccess('read')

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      // Get different categories of scheduled content
      const [pendingResult, processingResult, failedResult, todayResult, upcomingResult] = await Promise.all([
        this.client.from(this.tableName).select('*').eq('status', SchedulingStatus.PENDING).order('scheduled_for'),
        this.client.from(this.tableName).select('*').eq('status', SchedulingStatus.PROCESSING).order('scheduled_for'),
        this.client.from(this.tableName).select('*').eq('status', SchedulingStatus.FAILED).order('scheduled_for'),
        this.client.from(this.tableName).select('*').eq('status', SchedulingStatus.SCHEDULED)
          .gte('scheduled_for', today.toISOString())
          .lt('scheduled_for', tomorrow.toISOString())
          .order('scheduled_for'),
        this.client.from(this.tableName).select('*').eq('status', SchedulingStatus.SCHEDULED)
          .gte('scheduled_for', tomorrow.toISOString())
          .limit(20)
          .order('scheduled_for')
      ])

      const queue: SchedulingQueue = {
        pending: (pendingResult.data || []) as ScheduledContent[],
        processing: (processingResult.data || []) as ScheduledContent[],
        failed: (failedResult.data || []) as ScheduledContent[],
        scheduled_today: (todayResult.data || []) as ScheduledContent[],
        upcoming: (upcomingResult.data || []) as ScheduledContent[]
      }

      return { data: queue, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get scheduling queue operation failed', {
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Conflict Detection
  // ================================

  /**
   * Detect scheduling conflicts for given content
   */
  public async detectConflicts(scheduleData: any): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = []

    try {
      // Check for time overlap conflicts
      const timeConflicts = await this.detectTimeOverlaps(scheduleData)
      conflicts.push(...timeConflicts)

      // Check for category saturation
      const categoryConflicts = await this.detectCategorySaturation(scheduleData)
      conflicts.push(...categoryConflicts)

      // Check for author overload
      const authorConflicts = await this.detectAuthorOverload(scheduleData)
      conflicts.push(...authorConflicts)

      return conflicts

    } catch (error) {
      logger.error('Conflict detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentType: scheduleData.content_type,
        contentId: scheduleData.content_id
      })
      return []
    }
  }

  private async detectTimeOverlaps(scheduleData: any): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = []

    // Check for content scheduled within 30 minutes
    const scheduledTime = new Date(scheduleData.scheduled_for)
    const beforeTime = new Date(scheduledTime.getTime() - 30 * 60 * 1000)
    const afterTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000)

    const result = await this.client
      .from(this.tableName)
      .select('id, title, content_type, scheduled_for')
      .neq('id', scheduleData.id || 'new')
      .in('status', [SchedulingStatus.SCHEDULED, SchedulingStatus.PENDING])
      .gte('scheduled_for', beforeTime.toISOString())
      .lte('scheduled_for', afterTime.toISOString())

    if (result.data && result.data.length > 0) {
      conflicts.push({
        type: ConflictType.TIME_OVERLAP,
        severity: result.data.length > 2 ? 'high' : 'medium',
        description: `${result.data.length} other content items scheduled within 30 minutes`,
        conflicting_items: result.data.map(item => `${item.title} (${item.content_type})`),
        suggestions: [
          'Consider scheduling at a different time',
          'Reduce posting frequency during peak hours',
          'Prioritize higher-priority content'
        ],
        auto_resolvable: false
      })
    }

    return conflicts
  }

  private async detectCategorySaturation(scheduleData: any): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = []

    // For blog posts, check category saturation
    if (scheduleData.content_type === ContentType.BLOG_POST) {
      const scheduledDate = new Date(scheduleData.scheduled_for)
      const dayStart = new Date(scheduledDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(scheduledDate)
      dayEnd.setHours(23, 59, 59, 999)

      // This would require joining with content tables to get category info
      // For now, we'll implement a simplified check
      const result = await this.client
        .from(this.tableName)
        .select('id, title')
        .eq('content_type', ContentType.BLOG_POST)
        .in('status', [SchedulingStatus.SCHEDULED, SchedulingStatus.PUBLISHED])
        .gte('scheduled_for', dayStart.toISOString())
        .lte('scheduled_for', dayEnd.toISOString())

      if (result.data && result.data.length >= 3) {
        conflicts.push({
          type: ConflictType.CATEGORY_SATURATION,
          severity: 'medium',
          description: `${result.data.length} blog posts already scheduled for this day`,
          conflicting_items: result.data.map(item => item.title),
          suggestions: [
            'Consider spreading posts across multiple days',
            'Prioritize most important content',
            'Schedule during different time slots'
          ],
          auto_resolvable: false
        })
      }
    }

    return conflicts
  }

  private async detectAuthorOverload(scheduleData: any): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = []

    // Check if author has too much content scheduled in a short period
    if (scheduleData.content_type === ContentType.BLOG_POST) {
      const scheduledDate = new Date(scheduleData.scheduled_for)
      const weekStart = new Date(scheduledDate)
      weekStart.setDate(scheduledDate.getDate() - 3)
      const weekEnd = new Date(scheduledDate)
      weekEnd.setDate(scheduledDate.getDate() + 3)

      // This would require author_id from the content
      // For now, check by created_by
      const result = await this.client
        .from(this.tableName)
        .select('id, title')
        .eq('content_type', ContentType.BLOG_POST)
        .eq('created_by', scheduleData.created_by || this.context?.userId)
        .in('status', [SchedulingStatus.SCHEDULED, SchedulingStatus.PUBLISHED])
        .gte('scheduled_for', weekStart.toISOString())
        .lte('scheduled_for', weekEnd.toISOString())

      if (result.data && result.data.length >= 4) {
        conflicts.push({
          type: ConflictType.AUTHOR_OVERLOAD,
          severity: 'low',
          description: `Author has ${result.data.length} posts scheduled within a week`,
          conflicting_items: result.data.map(item => item.title),
          suggestions: [
            'Distribute posts across more time',
            'Consider co-authors',
            'Batch similar content themes'
          ],
          auto_resolvable: true
        })
      }
    }

    return conflicts
  }

  // ================================
  // Content Processing
  // ================================

  /**
   * Process scheduled content for publication (called by cron job)
   */
  public async processScheduledContent(): Promise<{
    processed: number
    published: number
    failed: number
    errors: string[]
  }> {
    const stats = {
      processed: 0,
      published: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      // Get content scheduled for publication (within next 5 minutes)
      const now = new Date()
      const processingWindow = new Date(now.getTime() + 5 * 60 * 1000)

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('status', SchedulingStatus.SCHEDULED)
        .lte('scheduled_for', processingWindow.toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })

      if (result.error) {
        stats.errors.push(`Failed to query scheduled content: ${result.error.message}`)
        return stats
      }

      const scheduledItems = (result.data || []) as ScheduledContent[]
      logger.info(`Processing ${scheduledItems.length} scheduled items`)

      for (const item of scheduledItems) {
        stats.processed++

        try {
          // Mark as processing
          await this.updateScheduledStatus(item.id, SchedulingStatus.PROCESSING)

          // Publish the content
          const publishResult = await this.publishScheduledContent(item)

          if (publishResult.success) {
            stats.published++
            await this.updateScheduledStatus(item.id, SchedulingStatus.PUBLISHED, {
              processed_at: new Date().toISOString(),
              published_at: new Date().toISOString()
            })

            // Send success notification
            await this.sendNotification(item, 'published')

          } else {
            stats.failed++
            const shouldRetry = item.retry_count < item.max_retries

            if (shouldRetry) {
              // Schedule for retry
              await this.client
                .from(this.tableName)
                .update({
                  status: SchedulingStatus.SCHEDULED,
                  retry_count: item.retry_count + 1,
                  error_message: publishResult.error,
                  // Retry in 15 minutes
                  scheduled_for: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.id)

              logger.warn(`Scheduling retry for ${item.id}`, {
                retryCount: item.retry_count + 1,
                error: publishResult.error
              })
            } else {
              // Mark as failed
              await this.updateScheduledStatus(item.id, SchedulingStatus.FAILED, {
                error_message: publishResult.error
              })

              // Send failure notification
              await this.sendNotification(item, 'failed', publishResult.error)
            }

            stats.errors.push(`${item.title}: ${publishResult.error}`)
          }

        } catch (error) {
          stats.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          await this.updateScheduledStatus(item.id, SchedulingStatus.FAILED, {
            error_message: errorMessage
          })

          stats.errors.push(`${item.title}: ${errorMessage}`)
          
          logger.error(`Failed to process scheduled content ${item.id}`, {
            error: errorMessage,
            contentType: item.content_type,
            contentId: item.content_id
          })
        }
      }

      logger.info('Scheduled content processing completed', stats)
      return stats

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Scheduled content processing failed', {
        error: errorMessage
      })
      stats.errors.push(`Processing failed: ${errorMessage}`)
      return stats
    }
  }

  // ================================
  // Helper Methods
  // ================================

  private async validateContentForScheduling(
    contentType: ContentType,
    contentId: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const tableName = this.getTableNameForContentType(contentType)
      
      const result = await this.client
        .from(tableName)
        .select('id, title, status')
        .eq('id', contentId)
        .single()

      if (result.error) {
        return { isValid: false, error: 'Content not found' }
      }

      if (result.data.status === ContentStatus.PUBLISHED) {
        return { isValid: false, error: 'Content is already published' }
      }

      if (result.data.status === ContentStatus.ARCHIVED) {
        return { isValid: false, error: 'Content is archived and cannot be scheduled' }
      }

      return { isValid: true }

    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      }
    }
  }

  private async publishScheduledContent(
    scheduledItem: ScheduledContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tableName = this.getTableNameForContentType(scheduledItem.content_type)

      // Update content status to published
      const result = await this.client
        .from(tableName)
        .update({
          status: ContentStatus.PUBLISHED,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduledItem.content_id)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      logger.info(`Published scheduled content`, {
        scheduleId: scheduledItem.id,
        contentType: scheduledItem.content_type,
        contentId: scheduledItem.content_id,
        title: scheduledItem.title
      })

      return { success: true }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Publication failed' 
      }
    }
  }

  private async updateScheduledStatus(
    id: string,
    status: SchedulingStatus,
    additionalFields: Record<string, any> = {}
  ): Promise<void> {
    await this.client
      .from(this.tableName)
      .update({
        status,
        ...additionalFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  }

  private getTableNameForContentType(contentType: ContentType): string {
    const typeMap = {
      [ContentType.BLOG_POST]: 'blog_posts',
      [ContentType.PAGE]: 'pages',
      [ContentType.PLATFORM]: 'platforms',
      [ContentType.SERVICE]: 'services',
      [ContentType.TEAM_MEMBER]: 'team_members',
      [ContentType.TESTIMONIAL]: 'testimonials'
    }

    return typeMap[contentType]
  }

  // ================================
  // Notification System
  // ================================

  private async sendNotification(
    scheduledContent: ScheduledContent,
    eventType: 'scheduled' | 'published' | 'failed' | 'cancelled',
    errorMessage?: string
  ): Promise<void> {
    try {
      const settings = scheduledContent.notification_settings

      // Check if we should send notification for this event
      const shouldSend = 
        (eventType === 'published' && settings.send_on_success) ||
        (eventType === 'failed' && settings.send_on_failure) ||
        eventType === 'scheduled' || 
        eventType === 'cancelled'

      if (!shouldSend || settings.channels.length === 0) {
        return
      }

      const notificationData = {
        schedule_id: scheduledContent.id,
        content_type: scheduledContent.content_type,
        content_id: scheduledContent.content_id,
        title: scheduledContent.title,
        event_type: eventType,
        scheduled_for: scheduledContent.scheduled_for,
        error_message: errorMessage,
        custom_message: settings.custom_message,
        recipients: settings.recipients,
        channels: settings.channels,
        created_at: new Date().toISOString()
      }

      // Store notification in database
      await this.client
        .from('scheduling_notifications')
        .insert(notificationData)

      logger.debug('Scheduling notification created', {
        scheduleId: scheduledContent.id,
        eventType,
        channels: settings.channels
      })

    } catch (error) {
      logger.error('Failed to send scheduling notification', {
        scheduleId: scheduledContent.id,
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

export default ContentSchedulerService