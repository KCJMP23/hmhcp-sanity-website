import { createServerClient } from '@/lib/supabase-server'
import { CMSNotification, NotificationType, NotificationPriority, NotificationMetadata } from '@/types/notifications'
import { logger } from '@/lib/logger';

export interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  priority?: NotificationPriority
  metadata?: NotificationMetadata
  channels?: string[]
}

export interface BulkNotificationOptions extends Omit<CreateNotificationOptions, 'userId'> {
  userIds: string[]
}

export class NotificationService {
  /**
   * Create a single notification for a user
   */
  static async create(options: CreateNotificationOptions): Promise<CMSNotification | null> {
    const {
      userId,
      type,
      title,
      message,
      actionUrl,
      priority = 'normal',
      metadata = {},
      channels = ['in_app']
    } = options

    try {
      const supabase = await createServerClient()

      // Create the notification
      const { data, error } = await supabase
        .from('cms_notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          action_url: actionUrl,
          priority,
          channels,
          metadata,
          sent_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create notification:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
        return null
      }

      // Check user preferences for additional channels
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('category', this.getCategoryFromType(type))
        .single()

      // If email notifications are enabled, send email
      if (preferences?.channels?.email?.enabled && channels.includes('email')) {
        await this.sendEmailNotification({
          userId,
          title,
          message,
          actionUrl,
          type
        })
      }

      // If push notifications are enabled, send push
      if (preferences?.channels?.push?.enabled && channels.includes('push')) {
        await this.sendPushNotification({
          userId,
          title,
          message,
          actionUrl,
          type
        })
      }

      return data as CMSNotification
    } catch (error) {
      logger.error('Error creating notification:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return null
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulk(options: BulkNotificationOptions): Promise<CMSNotification[]> {
    const {
      userIds,
      type,
      title,
      message,
      actionUrl,
      priority = 'normal',
      metadata = {},
      channels = ['in_app']
    } = options

    try {
      const supabase = await createServerClient()

      // Create notifications for all users
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        priority,
        channels,
        metadata,
        sent_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('cms_notifications')
        .insert(notifications)
        .select()

      if (error) {
        logger.error('Failed to create bulk notifications:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
        return []
      }

      // Check preferences and send additional channels
      // In production, this would be done asynchronously
      for (const userId of userIds) {
        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .eq('category', this.getCategoryFromType(type))
          .single()

        if (preferences?.channels?.email?.enabled && channels.includes('email')) {
          await this.sendEmailNotification({
            userId,
            title,
            message,
            actionUrl,
            type
          })
        }
      }

      return data as CMSNotification[]
    } catch (error) {
      logger.error('Error creating bulk notifications:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return []
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createServerClient()

      const { error } = await supabase
        .from('cms_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)

      return !error
    } catch (error) {
      logger.error('Error marking notification as read:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const supabase = await createServerClient()

      const { error } = await supabase
        .from('cms_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)

      return !error
    } catch (error) {
      logger.error('Error marking all as read:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return false
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const supabase = await createServerClient()

      const { count, error } = await supabase
        .from('cms_notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .is('read_at', null)

      if (error) {
        logger.error('Error getting unread count:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
        return 0
      }

      return count || 0
    } catch (error) {
      logger.error('Error getting unread count:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return 0
    }
  }

  /**
   * Create workflow-specific notifications
   */
  static async notifyWorkflowAssignment(
    userId: string,
    contentTitle: string,
    workflowName: string,
    deadline?: string
  ): Promise<CMSNotification | null> {
    const metadata: NotificationMetadata = {
      custom_data: {
        workflow_name: workflowName,
        content_title: contentTitle,
        deadline
      }
    }

    return this.create({
      userId,
      type: 'workflow_assigned',
      title: 'New Workflow Assignment',
      message: `You have been assigned to "${contentTitle}" in the ${workflowName} workflow`,
      actionUrl: '/admin/cms/workflows/assignments',
      priority: deadline ? 'high' : 'normal',
      metadata
    })
  }

  static async notifyApprovalRequest(
    approverId: string,
    contentTitle: string,
    requesterName: string,
    deadline?: string
  ): Promise<CMSNotification | null> {
    const metadata: NotificationMetadata = {
      custom_data: {
        content_title: contentTitle,
        related_user_name: requesterName,
        deadline
      }
    }

    return this.create({
      userId: approverId,
      type: 'approval_requested',
      title: 'Approval Required',
      message: `${requesterName} has requested your approval for "${contentTitle}"`,
      actionUrl: '/admin/cms/approvals',
      priority: 'high',
      metadata
    })
  }

  static async notifyContentStatusChange(
    userId: string,
    contentTitle: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string
  ): Promise<CMSNotification | null> {
    const metadata: NotificationMetadata = {
      custom_data: {
        content_title: contentTitle,
        related_user_name: changedBy
      }
    }

    return this.create({
      userId,
      type: 'content_updated',
      title: 'Content Status Changed',
      message: `"${contentTitle}" status changed from ${oldStatus} to ${newStatus} by ${changedBy}`,
      actionUrl: '/admin/cms/content',
      priority: 'normal',
      metadata
    })
  }

  static async notifyLockBroken(
    userId: string,
    contentTitle: string,
    brokenBy: string,
    reason: string
  ): Promise<CMSNotification | null> {
    const metadata: NotificationMetadata = {
      custom_data: {
        content_title: contentTitle,
        related_user_name: brokenBy
      }
    }

    return this.create({
      userId,
      type: 'system_alert',
      title: 'Content Lock Broken',
      message: `Your lock on "${contentTitle}" was broken by ${brokenBy}. Reason: ${reason}`,
      actionUrl: '/admin/cms/content',
      priority: 'high',
      metadata
    })
  }

  /**
   * Helper method to get category from notification type
   */
  private static getCategoryFromType(type: NotificationType): string {
    const categoryMap: Record<string, string> = {
      'workflow_assigned': 'workflow',
      'workflow_submitted': 'workflow',
      'workflow_approved': 'workflow',
      'workflow_rejected': 'workflow',
      'workflow_escalated': 'workflow',
      'workflow_deadline_approaching': 'workflow',
      'workflow_deadline_missed': 'workflow',
      'workflow_completed': 'workflow',
      'approval_requested': 'approval',
      'approval_reminder': 'approval',
      'approval_delegated': 'approval',
      'approval_escalated': 'approval',
      'approval_chain_completed': 'approval',
      'content_created': 'content',
      'content_updated': 'content',
      'content_published': 'content',
      'content_archived': 'content',
      'content_deleted': 'content',
      'content_comment_added': 'content',
      'system_maintenance': 'system',
      'system_alert': 'system',
      'system_update': 'system',
      'user_account_locked': 'system',
      'user_password_expiring': 'system',
      'batch_operation_started': 'batch',
      'batch_operation_completed': 'batch',
      'batch_operation_failed': 'batch',
      'batch_operation_paused': 'batch',
      'sla_violation': 'analytics',
      'bottleneck_detected': 'analytics',
      'performance_alert': 'analytics',
      'insight_generated': 'analytics'
    }

    return categoryMap[type] || 'system'
  }

  /**
   * Send email notification (placeholder - integrate with email service)
   */
  private static async sendEmailNotification(options: {
    userId: string
    title: string
    message: string
    actionUrl?: string
    type: NotificationType
  }): Promise<void> {
    // In production, integrate with email service like SendGrid, AWS SES, etc.
    logger.info('Would send email notification:', { action: 'info_logged', metadata: { options } })
  }

  /**
   * Send push notification (placeholder - integrate with push service)
   */
  private static async sendPushNotification(options: {
    userId: string
    title: string
    message: string
    actionUrl?: string
    type: NotificationType
  }): Promise<void> {
    // In production, integrate with push notification service
    logger.info('Would send push notification:', { action: 'info_logged', metadata: { options } })
  }

  /**
   * Template-based notification creation
   */
  static async createFromTemplate(
    templateType: string,
    userId: string,
    variables: Record<string, any>
  ): Promise<CMSNotification | null> {
    try {
      const supabase = await createServerClient()

      // Get template
      const { data: template, error: templateError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .single()

      if (templateError || !template) {
        logger.error('Template not found:', { error: templateError instanceof Error ? templateError : new Error(String(templateError)), action: 'error_logged', metadata: { templateType } })
        return null
      }

      // Replace variables in subject and body
      let subject = template.subject
      let body = template.body

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, value)
        body = body.replace(regex, value)
      })

      // Create notification
      return this.create({
        userId,
        type: templateType as NotificationType,
        title: subject,
        message: body,
        actionUrl: variables.actionUrl,
        priority: variables.priority || 'normal',
        channels: template.channels || ['in_app']
      })
    } catch (error) {
      logger.error('Error creating from template:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return null
    }
  }
}

export default NotificationService