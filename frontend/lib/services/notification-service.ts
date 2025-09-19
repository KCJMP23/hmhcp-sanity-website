/**
 * Notification Service for Content Scheduling
 * Handles email, in-app, and webhook notifications for scheduled content events
 * Part of Story 1.4 Task 7 - Content Scheduling System
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import {
  NotificationChannel,
  NotificationSettings,
  ScheduledContent
} from './content-scheduler'

// ================================
// Notification Types and Schemas
// ================================

export enum NotificationTemplate {
  CONTENT_SCHEDULED = 'content_scheduled',
  CONTENT_PUBLISHED = 'content_published',
  CONTENT_FAILED = 'content_failed',
  CONTENT_CANCELLED = 'content_cancelled',
  ADVANCE_NOTICE = 'advance_notice',
  CONFLICT_DETECTED = 'conflict_detected',
  QUEUE_SUMMARY = 'queue_summary'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface NotificationEvent {
  id: string
  template: NotificationTemplate
  priority: NotificationPriority
  recipient: string
  channel: NotificationChannel
  subject: string
  content: string
  metadata: Record<string, any>
  scheduled_content?: ScheduledContent
  created_at: string
  sent_at?: string
  delivery_status: 'pending' | 'sent' | 'failed' | 'delivered'
  error_message?: string
  retry_count: number
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
  signature?: string
}

// ================================
// Template Configurations
// ================================

const EMAIL_TEMPLATES: Record<NotificationTemplate, (data: any) => EmailTemplate> = {
  [NotificationTemplate.CONTENT_SCHEDULED]: (data) => ({
    subject: `Content Scheduled: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Content Successfully Scheduled</h2>
        <p>Your content has been scheduled for publication.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0;">${data.title}</h3>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${data.content_type.replace('_', ' ')}</p>
          <p style="margin: 4px 0;"><strong>Scheduled for:</strong> ${new Date(data.scheduled_for).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Priority:</strong> ${data.priority}/10</p>
        </div>
        ${data.custom_message ? `<p><em>${data.custom_message}</em></p>` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated notification from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Content Successfully Scheduled\n\n${data.title}\nType: ${data.content_type.replace('_', ' ')}\nScheduled for: ${new Date(data.scheduled_for).toLocaleString()}\nPriority: ${data.priority}/10\n\n${data.custom_message || ''}`
  }),

  [NotificationTemplate.CONTENT_PUBLISHED]: (data) => ({
    subject: `Content Published: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Content Successfully Published</h2>
        <p>Your scheduled content has been published successfully.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #166534;">${data.title}</h3>
          <p style="margin: 4px 0;"><strong>Published at:</strong> ${new Date(data.published_at || data.scheduled_for).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${data.content_type.replace('_', ' ')}</p>
        </div>
        ${data.custom_message ? `<p><em>${data.custom_message}</em></p>` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated notification from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Content Successfully Published\n\n${data.title}\nPublished at: ${new Date(data.published_at || data.scheduled_for).toLocaleString()}\nType: ${data.content_type.replace('_', ' ')}\n\n${data.custom_message || ''}`
  }),

  [NotificationTemplate.CONTENT_FAILED]: (data) => ({
    subject: `Publication Failed: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Content Publication Failed</h2>
        <p>There was an issue publishing your scheduled content.</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b;">${data.title}</h3>
          <p style="margin: 4px 0;"><strong>Scheduled for:</strong> ${new Date(data.scheduled_for).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Error:</strong> ${data.error_message || 'Unknown error'}</p>
          <p style="margin: 4px 0;"><strong>Retry attempt:</strong> ${data.retry_count}/${data.max_retries}</p>
        </div>
        ${data.retry_count < data.max_retries ? 
          '<p style="color: #b45309;">The system will automatically retry publishing this content.</p>' :
          '<p style="color: #dc2626;">Maximum retry attempts reached. Manual intervention required.</p>'
        }
        ${data.custom_message ? `<p><em>${data.custom_message}</em></p>` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated notification from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Content Publication Failed\n\n${data.title}\nScheduled for: ${new Date(data.scheduled_for).toLocaleString()}\nError: ${data.error_message || 'Unknown error'}\nRetry attempt: ${data.retry_count}/${data.max_retries}\n\n${data.custom_message || ''}`
  }),

  [NotificationTemplate.CONTENT_CANCELLED]: (data) => ({
    subject: `Content Cancelled: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">Content Schedule Cancelled</h2>
        <p>Your scheduled content has been cancelled.</p>
        <div style="background: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0;">${data.title}</h3>
          <p style="margin: 4px 0;"><strong>Was scheduled for:</strong> ${new Date(data.scheduled_for).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Cancelled at:</strong> ${new Date().toLocaleString()}</p>
        </div>
        ${data.custom_message ? `<p><em>${data.custom_message}</em></p>` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated notification from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Content Schedule Cancelled\n\n${data.title}\nWas scheduled for: ${new Date(data.scheduled_for).toLocaleString()}\nCancelled at: ${new Date().toLocaleString()}\n\n${data.custom_message || ''}`
  }),

  [NotificationTemplate.ADVANCE_NOTICE]: (data) => ({
    subject: `Content Publishing Soon: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b45309;">Content Publishing Soon</h2>
        <p>This is a reminder that your content is scheduled to publish in ${data.hours_until} hours.</p>
        <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">${data.title}</h3>
          <p style="margin: 4px 0;"><strong>Scheduled for:</strong> ${new Date(data.scheduled_for).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Time remaining:</strong> ${data.hours_until} hours</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>Please ensure everything is ready for publication.</p>
        ${data.custom_message ? `<p><em>${data.custom_message}</em></p>` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated notification from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Content Publishing Soon\n\n${data.title}\nScheduled for: ${new Date(data.scheduled_for).toLocaleString()}\nTime remaining: ${data.hours_until} hours\nStatus: ${data.status}\n\nPlease ensure everything is ready for publication.\n\n${data.custom_message || ''}`
  }),

  [NotificationTemplate.CONFLICT_DETECTED]: (data) => ({
    subject: `Scheduling Conflicts Detected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Scheduling Conflicts Detected</h2>
        <p>Conflicts have been detected with your content scheduling.</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          ${data.conflicts.map((conflict: any) => `
            <div style="margin: 12px 0;">
              <strong style="color: ${conflict.severity === 'high' ? '#991b1b' : conflict.severity === 'medium' ? '#b45309' : '#374151'}">${conflict.description}</strong>
              <p style="margin: 4px 0; font-size: 14px;">${conflict.suggestions.join(', ')}</p>
            </div>
          `).join('')}
        </div>
        <p>Please review and resolve these conflicts before proceeding.</p>
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated notification from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Scheduling Conflicts Detected\n\n${data.conflicts.map((c: any) => `${c.description}\nSuggestions: ${c.suggestions.join(', ')}\n`).join('\n')}\nPlease review and resolve these conflicts before proceeding.`
  }),

  [NotificationTemplate.QUEUE_SUMMARY]: (data) => ({
    subject: `Daily Content Queue Summary`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Daily Content Queue Summary</h2>
        <p>Here's your daily summary of scheduled content activities.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px 0;">Today's Statistics</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div><strong>Published:</strong> ${data.stats.published}</div>
            <div><strong>Failed:</strong> ${data.stats.failed}</div>
            <div><strong>Scheduled Today:</strong> ${data.stats.scheduled_today}</div>
            <div><strong>Success Rate:</strong> ${Math.round(data.stats.success_rate)}%</div>
          </div>
        </div>
        ${data.upcoming_today.length > 0 ? `
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 12px 0; color: #166534;">Remaining Today</h3>
            ${data.upcoming_today.slice(0, 5).map((item: any) => `
              <div style="margin: 8px 0;">
                <strong>${item.title}</strong> - ${new Date(item.scheduled_for).toLocaleTimeString()}
              </div>
            `).join('')}
            ${data.upcoming_today.length > 5 ? `<p>...and ${data.upcoming_today.length - 5} more</p>` : ''}
          </div>
        ` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          This is an automated daily summary from the HM Healthcare Partners content scheduling system.
        </p>
      </div>
    `,
    text: `Daily Content Queue Summary\n\nToday's Statistics:\nPublished: ${data.stats.published}\nFailed: ${data.stats.failed}\nScheduled Today: ${data.stats.scheduled_today}\nSuccess Rate: ${Math.round(data.stats.success_rate)}%\n\n${data.upcoming_today.length > 0 ? `Remaining Today:\n${data.upcoming_today.slice(0, 5).map((item: any) => `${item.title} - ${new Date(item.scheduled_for).toLocaleTimeString()}`).join('\n')}` : 'No more content scheduled for today.'}`
  })
}

// ================================
// Notification Service Class
// ================================

export class NotificationService {
  private client: SupabaseClient
  private readonly tableName = 'scheduling_notifications'

  constructor(client: SupabaseClient) {
    this.client = client
  }

  // ================================
  // Core Notification Methods
  // ================================

  /**
   * Send notification for scheduled content event
   */
  public async sendContentNotification(
    scheduledContent: ScheduledContent,
    eventType: 'scheduled' | 'published' | 'failed' | 'cancelled',
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const template = this.getTemplateForEvent(eventType)
      const priority = this.getPriorityForEvent(eventType)

      const notificationData = {
        ...scheduledContent,
        ...additionalData,
        published_at: scheduledContent.published_at || scheduledContent.scheduled_for
      }

      // Send to configured channels
      for (const channel of scheduledContent.notification_settings.channels) {
        for (const recipient of scheduledContent.notification_settings.recipients) {
          await this.sendNotification({
            template,
            priority,
            recipient,
            channel,
            data: notificationData,
            scheduledContent
          })
        }
      }

    } catch (error) {
      logger.error('Failed to send content notification', {
        scheduleId: scheduledContent.id,
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Send advance notice notifications
   */
  public async sendAdvanceNotices(): Promise<void> {
    try {
      // Get content scheduled for advance notice times
      const now = new Date()
      const advanceNoticeHours = [24, 2, 1] // Standard advance notice times

      for (const hours of advanceNoticeHours) {
        const noticeTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
        const windowStart = new Date(noticeTime.getTime() - 30 * 60 * 1000) // 30 min window
        const windowEnd = new Date(noticeTime.getTime() + 30 * 60 * 1000)

        const { data: scheduledItems } = await this.client
          .from('scheduled_content')
          .select('*')
          .eq('status', 'scheduled')
          .gte('scheduled_for', windowStart.toISOString())
          .lte('scheduled_for', windowEnd.toISOString())

        if (scheduledItems) {
          for (const item of scheduledItems) {
            // Check if advance notice is configured for this time
            const settings = item.notification_settings as NotificationSettings
            if (settings.advance_notice_hours.includes(hours)) {
              await this.sendAdvanceNotice(item as ScheduledContent, hours)
            }
          }
        }
      }

    } catch (error) {
      logger.error('Failed to send advance notices', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Send daily queue summary
   */
  public async sendDailySummary(recipients: string[]): Promise<void> {
    try {
      // Get queue statistics for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const [publishedResult, failedResult, scheduledResult, upcomingResult] = await Promise.all([
        this.client.from('scheduled_content').select('*').eq('status', 'published')
          .gte('published_at', today.toISOString()).lt('published_at', tomorrow.toISOString()),
        this.client.from('scheduled_content').select('*').eq('status', 'failed')
          .gte('updated_at', today.toISOString()).lt('updated_at', tomorrow.toISOString()),
        this.client.from('scheduled_content').select('*').eq('status', 'scheduled')
          .gte('scheduled_for', today.toISOString()).lt('scheduled_for', tomorrow.toISOString()),
        this.client.from('scheduled_content').select('*').eq('status', 'scheduled')
          .gte('scheduled_for', new Date().toISOString()).lt('scheduled_for', tomorrow.toISOString())
      ])

      const stats = {
        published: publishedResult.data?.length || 0,
        failed: failedResult.data?.length || 0,
        scheduled_today: scheduledResult.data?.length || 0,
        success_rate: publishedResult.data && failedResult.data ? 
          (publishedResult.data.length / (publishedResult.data.length + failedResult.data.length)) * 100 : 100
      }

      const summaryData = {
        stats,
        upcoming_today: upcomingResult.data || []
      }

      for (const recipient of recipients) {
        await this.sendNotification({
          template: NotificationTemplate.QUEUE_SUMMARY,
          priority: NotificationPriority.LOW,
          recipient,
          channel: NotificationChannel.EMAIL,
          data: summaryData
        })
      }

    } catch (error) {
      logger.error('Failed to send daily summary', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // ================================
  // Private Helper Methods
  // ================================

  private async sendNotification({
    template,
    priority,
    recipient,
    channel,
    data,
    scheduledContent
  }: {
    template: NotificationTemplate
    priority: NotificationPriority
    recipient: string
    channel: NotificationChannel
    data: Record<string, any>
    scheduledContent?: ScheduledContent
  }): Promise<void> {
    try {
      const notification: Partial<NotificationEvent> = {
        template,
        priority,
        recipient,
        channel,
        metadata: data,
        created_at: new Date().toISOString(),
        delivery_status: 'pending',
        retry_count: 0
      }

      // Generate content based on channel
      switch (channel) {
        case NotificationChannel.EMAIL:
          const emailTemplate = EMAIL_TEMPLATES[template](data)
          notification.subject = emailTemplate.subject
          notification.content = emailTemplate.html
          break

        case NotificationChannel.IN_APP:
          notification.subject = this.generateInAppTitle(template, data)
          notification.content = this.generateInAppMessage(template, data)
          break

        case NotificationChannel.WEBHOOK:
          notification.subject = `Webhook: ${template}`
          notification.content = JSON.stringify(this.generateWebhookPayload(template, data))
          break
      }

      // Store notification
      const { data: notificationRecord, error } = await this.client
        .from(this.tableName)
        .insert(notification)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`)
      }

      // Send notification based on channel
      await this.deliverNotification(notificationRecord as NotificationEvent, data)

    } catch (error) {
      logger.error('Failed to send notification', {
        template,
        recipient,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async deliverNotification(
    notification: NotificationEvent,
    data: Record<string, any>
  ): Promise<void> {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification, data)
          break

        case NotificationChannel.IN_APP:
          await this.sendInAppNotification(notification)
          break

        case NotificationChannel.WEBHOOK:
          await this.sendWebhook(notification, data)
          break
      }

      // Update delivery status
      await this.client
        .from(this.tableName)
        .update({
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id)

    } catch (error) {
      // Update error status
      await this.client
        .from(this.tableName)
        .update({
          delivery_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: notification.retry_count + 1
        })
        .eq('id', notification.id)

      throw error
    }
  }

  private async sendEmail(notification: NotificationEvent, data: Record<string, any>): Promise<void> {
    // This would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll log the email content
    logger.info('Email notification (would be sent via email service)', {
      to: notification.recipient,
      subject: notification.subject,
      template: notification.template,
      scheduleId: data.id
    })

    // In a real implementation:
    // await emailService.send({
    //   to: notification.recipient,
    //   subject: notification.subject,
    //   html: notification.content,
    //   text: EMAIL_TEMPLATES[notification.template](data).text
    // })
  }

  private async sendInAppNotification(notification: NotificationEvent): Promise<void> {
    // Store in-app notification in database
    await this.client
      .from('in_app_notifications')
      .insert({
        user_email: notification.recipient,
        title: notification.subject,
        message: notification.content,
        priority: notification.priority,
        type: notification.template,
        created_at: new Date().toISOString(),
        read: false
      })

    logger.info('In-app notification created', {
      recipient: notification.recipient,
      template: notification.template
    })
  }

  private async sendWebhook(notification: NotificationEvent, data: Record<string, any>): Promise<void> {
    const payload = this.generateWebhookPayload(notification.template, data)
    
    // This would send to configured webhook URLs
    logger.info('Webhook notification (would be sent to configured endpoints)', {
      template: notification.template,
      payload
    })

    // In a real implementation:
    // await fetch(webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // })
  }

  private async sendAdvanceNotice(scheduledContent: ScheduledContent, hours: number): Promise<void> {
    const data = {
      ...scheduledContent,
      hours_until: hours
    }

    for (const channel of scheduledContent.notification_settings.channels) {
      for (const recipient of scheduledContent.notification_settings.recipients) {
        await this.sendNotification({
          template: NotificationTemplate.ADVANCE_NOTICE,
          priority: NotificationPriority.NORMAL,
          recipient,
          channel,
          data,
          scheduledContent
        })
      }
    }
  }

  private getTemplateForEvent(eventType: string): NotificationTemplate {
    switch (eventType) {
      case 'scheduled':
        return NotificationTemplate.CONTENT_SCHEDULED
      case 'published':
        return NotificationTemplate.CONTENT_PUBLISHED
      case 'failed':
        return NotificationTemplate.CONTENT_FAILED
      case 'cancelled':
        return NotificationTemplate.CONTENT_CANCELLED
      default:
        return NotificationTemplate.CONTENT_SCHEDULED
    }
  }

  private getPriorityForEvent(eventType: string): NotificationPriority {
    switch (eventType) {
      case 'failed':
        return NotificationPriority.HIGH
      case 'published':
        return NotificationPriority.NORMAL
      case 'scheduled':
        return NotificationPriority.LOW
      case 'cancelled':
        return NotificationPriority.LOW
      default:
        return NotificationPriority.NORMAL
    }
  }

  private generateInAppTitle(template: NotificationTemplate, data: any): string {
    switch (template) {
      case NotificationTemplate.CONTENT_SCHEDULED:
        return `Content Scheduled: ${data.title}`
      case NotificationTemplate.CONTENT_PUBLISHED:
        return `Content Published: ${data.title}`
      case NotificationTemplate.CONTENT_FAILED:
        return `Publication Failed: ${data.title}`
      case NotificationTemplate.CONTENT_CANCELLED:
        return `Content Cancelled: ${data.title}`
      case NotificationTemplate.ADVANCE_NOTICE:
        return `Publishing Soon: ${data.title}`
      default:
        return 'Content Notification'
    }
  }

  private generateInAppMessage(template: NotificationTemplate, data: any): string {
    switch (template) {
      case NotificationTemplate.CONTENT_SCHEDULED:
        return `Your content has been scheduled for ${new Date(data.scheduled_for).toLocaleString()}`
      case NotificationTemplate.CONTENT_PUBLISHED:
        return `Your content was published successfully at ${new Date(data.published_at || data.scheduled_for).toLocaleString()}`
      case NotificationTemplate.CONTENT_FAILED:
        return `Failed to publish: ${data.error_message || 'Unknown error'}`
      case NotificationTemplate.CONTENT_CANCELLED:
        return `Content schedule was cancelled`
      case NotificationTemplate.ADVANCE_NOTICE:
        return `Content is scheduled to publish in ${data.hours_until} hours`
      default:
        return 'Content notification update'
    }
  }

  private generateWebhookPayload(template: NotificationTemplate, data: any): WebhookPayload {
    return {
      event: template,
      timestamp: new Date().toISOString(),
      data: {
        content_id: data.id,
        title: data.title,
        content_type: data.content_type,
        scheduled_for: data.scheduled_for,
        status: data.status,
        ...data
      }
    }
  }
}

export default NotificationService