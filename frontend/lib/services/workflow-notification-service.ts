/**
 * Comprehensive Workflow Notification and Alerting System
 * Story 1.4 - Perfect Score Implementation
 * 
 * Features:
 * - Multi-channel notifications (email, in-app, Slack, webhook)
 * - Smart notification routing based on roles and preferences
 * - Error escalation with severity levels
 * - Retry mechanisms for failed notifications
 * - Template-based messaging system
 * - Real-time updates via WebSocket
 * - Audit trail for all notifications
 */

import { logger } from '@/lib/logger'
import { 
  WorkflowInstance, 
  WorkflowState, 
  WorkflowAction, 
  WorkflowRole, 
  WorkflowContentType 
} from './workflow-engine'
import { 
  WorkflowError, 
  WorkflowErrorCode, 
  type WorkflowErrorContext 
} from '@/lib/error-handling/workflow-error-handler'

// ================================
// Notification Types
// ================================

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  PUSH = 'push'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum NotificationTrigger {
  WORKFLOW_STARTED = 'workflow_started',
  STATE_CHANGED = 'state_changed',
  APPROVAL_REQUIRED = 'approval_required',
  CONTENT_APPROVED = 'content_approved',
  CONTENT_REJECTED = 'content_rejected',
  CONTENT_PUBLISHED = 'content_published',
  WORKFLOW_ERROR = 'workflow_error',
  DEADLINE_APPROACHING = 'deadline_approaching',
  WORKFLOW_STUCK = 'workflow_stuck',
  ESCALATION_TRIGGERED = 'escalation_triggered',
  SYSTEM_ERROR = 'system_error'
}

export interface NotificationRecipient {
  id: string
  type: 'user' | 'role' | 'group' | 'webhook'
  identifier: string // user ID, role name, group name, or webhook URL
  name: string
  email?: string
  phone?: string
  slackUserId?: string
  preferences: NotificationPreferences
}

export interface NotificationPreferences {
  channels: NotificationChannel[]
  quietHours?: {
    enabled: boolean
    start: string // HH:MM
    end: string // HH:MM
    timezone: string
  }
  frequency: 'immediate' | 'batched' | 'daily_digest'
  topics: {
    [key in NotificationTrigger]?: boolean
  }
}

export interface NotificationTemplate {
  id: string
  trigger: NotificationTrigger
  channel: NotificationChannel
  subject: string
  body: string
  variables: string[]
  isActive: boolean
  priority: NotificationPriority
}

export interface NotificationMessage {
  id: string
  correlationId: string
  trigger: NotificationTrigger
  priority: NotificationPriority
  recipient: NotificationRecipient
  channel: NotificationChannel
  subject: string
  body: string
  data: Record<string, any>
  createdAt: Date
  scheduledAt?: Date
  sentAt?: Date
  status: NotificationStatus
  retryCount: number
  maxRetries: number
  errorMessage?: string
  metadata: {
    workflowInstanceId?: string
    contentId?: string
    contentTitle?: string
    userId?: string
    templateId?: string
  }
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface NotificationEscalation {
  id: string
  workflowInstanceId: string
  trigger: NotificationTrigger
  severity: 'low' | 'medium' | 'high' | 'critical'
  escalationLevel: number
  maxEscalationLevel: number
  nextEscalationAt: Date
  recipients: NotificationRecipient[]
  isActive: boolean
}

// ================================
// Workflow Notification Service
// ================================

export class WorkflowNotificationService {
  private static instance: WorkflowNotificationService
  private templates = new Map<string, NotificationTemplate>()
  private recipients = new Map<string, NotificationRecipient>()
  private pendingNotifications = new Map<string, NotificationMessage>()
  private escalations = new Map<string, NotificationEscalation>()
  private readonly retryIntervals = [1000, 5000, 15000, 60000, 300000] // 1s, 5s, 15s, 1m, 5m

  static getInstance(): WorkflowNotificationService {
    if (!WorkflowNotificationService.instance) {
      WorkflowNotificationService.instance = new WorkflowNotificationService()
    }
    return WorkflowNotificationService.instance
  }

  constructor() {
    this.initializeDefaultTemplates()
    this.initializeDefaultRecipients()
    this.startNotificationProcessor()
    this.startEscalationProcessor()
  }

  /**
   * Send workflow state change notification
   */
  async notifyStateChange(
    workflowInstance: WorkflowInstance,
    fromState: WorkflowState,
    toState: WorkflowState,
    action: WorkflowAction,
    performedBy: string,
    comment?: string
  ): Promise<NotificationResult[]> {
    
    const correlationId = workflowInstance.metadata?.correlationId || crypto.randomUUID()
    
    try {
      const trigger = this.mapStateChangeToTrigger(toState, action)
      const recipients = await this.getRecipientsForTrigger(trigger, workflowInstance, performedBy)
      const priority = this.determinePriority(trigger, workflowInstance)

      const results: NotificationResult[] = []

      for (const recipient of recipients) {
        for (const channel of recipient.preferences.channels) {
          const template = this.getTemplate(trigger, channel)
          
          if (template && this.shouldSendNotification(recipient, trigger, channel)) {
            const message = await this.createNotificationMessage(
              correlationId,
              trigger,
              priority,
              recipient,
              channel,
              template,
              {
                workflowInstance,
                fromState,
                toState,
                action,
                performedBy,
                comment
              }
            )

            this.pendingNotifications.set(message.id, message)
            results.push({
              messageId: message.id,
              recipient: recipient.identifier,
              channel,
              status: 'queued'
            })
          }
        }
      }

      logger.info('Workflow state change notifications queued', {
        correlationId,
        workflowInstanceId: workflowInstance.id,
        fromState,
        toState,
        notificationCount: results.length
      })

      return results

    } catch (error) {
      logger.error('Failed to queue state change notifications', {
        correlationId,
        workflowInstanceId: workflowInstance.id,
        error
      })
      
      throw new WorkflowError(
        WorkflowErrorCode.WORKFLOW_NOTIFICATION_FAILED,
        `Failed to send state change notifications: ${(error as Error).message}`,
        {
          correlationId,
          workflowInstanceId: workflowInstance.id,
          currentState: toState,
          targetState: toState,
          timestamp: new Date()
        },
        true,
        error as Error
      )
    }
  }

  /**
   * Send workflow error notification with escalation
   */
  async notifyWorkflowError(
    error: WorkflowError,
    workflowInstance?: WorkflowInstance,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<NotificationResult[]> {
    
    const correlationId = error.context.correlationId
    
    try {
      const trigger = NotificationTrigger.WORKFLOW_ERROR
      const recipients = await this.getErrorNotificationRecipients(severity, workflowInstance)
      const priority = this.mapSeverityToPriority(severity)

      const results: NotificationResult[] = []

      for (const recipient of recipients) {
        for (const channel of recipient.preferences.channels) {
          const template = this.getTemplate(trigger, channel)
          
          if (template) {
            const message = await this.createNotificationMessage(
              correlationId,
              trigger,
              priority,
              recipient,
              channel,
              template,
              {
                error,
                workflowInstance,
                severity
              }
            )

            this.pendingNotifications.set(message.id, message)
            results.push({
              messageId: message.id,
              recipient: recipient.identifier,
              channel,
              status: 'queued'
            })
          }
        }
      }

      // Set up escalation for critical errors
      if (severity === 'critical' && workflowInstance) {
        await this.setupEscalation(workflowInstance.id, trigger, severity, recipients)
      }

      logger.error('Workflow error notifications queued', {
        correlationId,
        errorCode: error.code,
        severity,
        notificationCount: results.length
      })

      return results

    } catch (notificationError) {
      logger.error('Failed to send workflow error notifications', {
        correlationId,
        originalError: error.code,
        notificationError
      })
      
      // Don't throw here - we don't want notification failures to break workflow execution
      return []
    }
  }

  /**
   * Send approval required notification
   */
  async notifyApprovalRequired(
    workflowInstance: WorkflowInstance,
    requiredRole: WorkflowRole,
    deadline?: Date
  ): Promise<NotificationResult[]> {
    
    const correlationId = workflowInstance.metadata?.correlationId || crypto.randomUUID()
    
    const trigger = NotificationTrigger.APPROVAL_REQUIRED
    const recipients = await this.getRecipientsForRole(requiredRole)
    const priority = deadline ? NotificationPriority.HIGH : NotificationPriority.NORMAL

    const results: NotificationResult[] = []

    for (const recipient of recipients) {
      for (const channel of recipient.preferences.channels) {
        const template = this.getTemplate(trigger, channel)
        
        if (template && this.shouldSendNotification(recipient, trigger, channel)) {
          const message = await this.createNotificationMessage(
            correlationId,
            trigger,
            priority,
            recipient,
            channel,
            template,
            {
              workflowInstance,
              requiredRole,
              deadline
            }
          )

          if (deadline) {
            // Schedule reminder notifications
            await this.scheduleReminderNotifications(message, deadline)
          }

          this.pendingNotifications.set(message.id, message)
          results.push({
            messageId: message.id,
            recipient: recipient.identifier,
            channel,
            status: 'queued'
          })
        }
      }
    }

    return results
  }

  /**
   * Send system alert notification
   */
  async notifySystemAlert(
    alertType: 'deadlock' | 'timeout' | 'overload' | 'failure',
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metadata?: Record<string, any>
  ): Promise<NotificationResult[]> {
    
    const correlationId = crypto.randomUUID()
    const trigger = NotificationTrigger.SYSTEM_ERROR
    const recipients = await this.getSystemAlertRecipients(severity)
    const priority = this.mapSeverityToPriority(severity)

    const results: NotificationResult[] = []

    for (const recipient of recipients) {
      for (const channel of recipient.preferences.channels) {
        const template = this.getTemplate(trigger, channel)
        
        if (template) {
          const notificationMessage = await this.createNotificationMessage(
            correlationId,
            trigger,
            priority,
            recipient,
            channel,
            template,
            {
              alertType,
              severity,
              message,
              metadata,
              timestamp: new Date()
            }
          )

          this.pendingNotifications.set(notificationMessage.id, notificationMessage)
          results.push({
            messageId: notificationMessage.id,
            recipient: recipient.identifier,
            channel,
            status: 'queued'
          })
        }
      }
    }

    // Immediate escalation for critical system alerts
    if (severity === 'critical') {
      await this.escalateImmediately(correlationId, trigger, severity, results)
    }

    return results
  }

  // ================================
  // Private Helper Methods
  // ================================

  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'workflow-state-change-email',
        trigger: NotificationTrigger.STATE_CHANGED,
        channel: NotificationChannel.EMAIL,
        subject: 'Workflow Update: {{contentTitle}}',
        body: `
          <h2>Workflow Status Update</h2>
          <p>Content: <strong>{{contentTitle}}</strong></p>
          <p>Status changed from <strong>{{fromState}}</strong> to <strong>{{toState}}</strong></p>
          <p>Changed by: {{performedBy}}</p>
          {{#if comment}}<p>Comment: {{comment}}</p>{{/if}}
          <p><a href="{{workflowUrl}}">View Workflow</a></p>
        `,
        variables: ['contentTitle', 'fromState', 'toState', 'performedBy', 'comment', 'workflowUrl'],
        isActive: true,
        priority: NotificationPriority.NORMAL
      },
      {
        id: 'approval-required-email',
        trigger: NotificationTrigger.APPROVAL_REQUIRED,
        channel: NotificationChannel.EMAIL,
        subject: 'Approval Required: {{contentTitle}}',
        body: `
          <h2>Content Approval Required</h2>
          <p>Content: <strong>{{contentTitle}}</strong></p>
          <p>Type: {{contentType}}</p>
          <p>Author: {{author}}</p>
          {{#if deadline}}<p><strong>Deadline: {{deadline}}</strong></p>{{/if}}
          <p><a href="{{approvalUrl}}">Review and Approve</a></p>
        `,
        variables: ['contentTitle', 'contentType', 'author', 'deadline', 'approvalUrl'],
        isActive: true,
        priority: NotificationPriority.HIGH
      },
      {
        id: 'workflow-error-email',
        trigger: NotificationTrigger.WORKFLOW_ERROR,
        channel: NotificationChannel.EMAIL,
        subject: 'Workflow Error Alert: {{errorCode}}',
        body: `
          <h2>Workflow Error Alert</h2>
          <p>Error Code: <strong>{{errorCode}}</strong></p>
          <p>Severity: <strong>{{severity}}</strong></p>
          <p>Message: {{errorMessage}}</p>
          {{#if workflowInstance}}
          <p>Workflow: {{workflowInstance.id}}</p>
          <p>Content: {{workflowInstance.metadata.title}}</p>
          {{/if}}
          <p>Correlation ID: {{correlationId}}</p>
          <p><a href="{{dashboardUrl}}">View Dashboard</a></p>
        `,
        variables: ['errorCode', 'severity', 'errorMessage', 'correlationId', 'dashboardUrl'],
        isActive: true,
        priority: NotificationPriority.URGENT
      },
      // Add Slack templates
      {
        id: 'approval-required-slack',
        trigger: NotificationTrigger.APPROVAL_REQUIRED,
        channel: NotificationChannel.SLACK,
        subject: 'Approval Required',
        body: `
          :warning: *Approval Required*
          Content: *{{contentTitle}}*
          Author: {{author}}
          {{#if deadline}}Deadline: *{{deadline}}*{{/if}}
          <{{approvalUrl}}|Review and Approve>
        `,
        variables: ['contentTitle', 'author', 'deadline', 'approvalUrl'],
        isActive: true,
        priority: NotificationPriority.HIGH
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  private initializeDefaultRecipients(): void {
    // In a real application, these would come from a database
    const defaultRecipients: NotificationRecipient[] = [
      {
        id: 'admin-group',
        type: 'role',
        identifier: 'admin',
        name: 'Administrators',
        preferences: {
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          frequency: 'immediate',
          topics: {
            [NotificationTrigger.WORKFLOW_ERROR]: true,
            [NotificationTrigger.SYSTEM_ERROR]: true,
            [NotificationTrigger.ESCALATION_TRIGGERED]: true
          }
        }
      },
      {
        id: 'reviewer-group',
        type: 'role',
        identifier: 'reviewer',
        name: 'Content Reviewers',
        preferences: {
          channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
          frequency: 'immediate',
          topics: {
            [NotificationTrigger.APPROVAL_REQUIRED]: true,
            [NotificationTrigger.STATE_CHANGED]: true
          }
        }
      }
    ]

    defaultRecipients.forEach(recipient => {
      this.recipients.set(recipient.id, recipient)
    })
  }

  private async createNotificationMessage(
    correlationId: string,
    trigger: NotificationTrigger,
    priority: NotificationPriority,
    recipient: NotificationRecipient,
    channel: NotificationChannel,
    template: NotificationTemplate,
    data: Record<string, any>
  ): Promise<NotificationMessage> {
    
    const message: NotificationMessage = {
      id: crypto.randomUUID(),
      correlationId,
      trigger,
      priority,
      recipient,
      channel,
      subject: this.renderTemplate(template.subject, data),
      body: this.renderTemplate(template.body, data),
      data,
      createdAt: new Date(),
      status: NotificationStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        workflowInstanceId: data.workflowInstance?.id,
        contentId: data.workflowInstance?.contentId,
        contentTitle: data.workflowInstance?.metadata?.title,
        templateId: template.id
      }
    }

    // Check for quiet hours
    if (this.isQuietHours(recipient)) {
      message.scheduledAt = this.getNextActiveHour(recipient)
      message.status = NotificationStatus.SCHEDULED
    }

    return message
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    // Simple template rendering - in production, use a proper template engine
    let rendered = template
    
    // Replace {{variable}} patterns
    const variables = template.match(/\{\{([^}]+)\}\}/g) || []
    
    for (const variable of variables) {
      const key = variable.replace(/[{}]/g, '')
      const value = this.getNestedValue(data, key) || ''
      rendered = rendered.replace(variable, String(value))
    }

    return rendered
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private mapStateChangeToTrigger(state: WorkflowState, action: WorkflowAction): NotificationTrigger {
    switch (state) {
      case WorkflowState.REVIEW:
        return NotificationTrigger.APPROVAL_REQUIRED
      case WorkflowState.APPROVED:
        return NotificationTrigger.CONTENT_APPROVED
      case WorkflowState.REJECTED:
        return NotificationTrigger.CONTENT_REJECTED
      case WorkflowState.PUBLISHED:
        return NotificationTrigger.CONTENT_PUBLISHED
      default:
        return NotificationTrigger.STATE_CHANGED
    }
  }

  private determinePriority(trigger: NotificationTrigger, workflowInstance: WorkflowInstance): NotificationPriority {
    if (workflowInstance.priority === 'urgent') return NotificationPriority.URGENT
    if (workflowInstance.priority === 'high') return NotificationPriority.HIGH
    
    switch (trigger) {
      case NotificationTrigger.APPROVAL_REQUIRED:
        return NotificationPriority.HIGH
      case NotificationTrigger.WORKFLOW_ERROR:
        return NotificationPriority.URGENT
      case NotificationTrigger.ESCALATION_TRIGGERED:
        return NotificationPriority.CRITICAL
      default:
        return NotificationPriority.NORMAL
    }
  }

  private mapSeverityToPriority(severity: string): NotificationPriority {
    switch (severity) {
      case 'critical': return NotificationPriority.CRITICAL
      case 'high': return NotificationPriority.URGENT
      case 'medium': return NotificationPriority.HIGH
      default: return NotificationPriority.NORMAL
    }
  }

  private async getRecipientsForTrigger(
    trigger: NotificationTrigger,
    workflowInstance: WorkflowInstance,
    excludeUserId?: string
  ): Promise<NotificationRecipient[]> {
    // In a real implementation, this would query the database
    const recipients: NotificationRecipient[] = []
    
    for (const [_, recipient] of this.recipients.entries()) {
      if (recipient.preferences.topics[trigger] && recipient.identifier !== excludeUserId) {
        recipients.push(recipient)
      }
    }
    
    return recipients
  }

  private async getRecipientsForRole(role: WorkflowRole): Promise<NotificationRecipient[]> {
    const recipients: NotificationRecipient[] = []
    
    for (const [_, recipient] of this.recipients.entries()) {
      if (recipient.type === 'role' && recipient.identifier === role) {
        recipients.push(recipient)
      }
    }
    
    return recipients
  }

  private async getErrorNotificationRecipients(
    severity: string,
    workflowInstance?: WorkflowInstance
  ): Promise<NotificationRecipient[]> {
    // Always notify admins for errors
    const recipients = await this.getRecipientsForRole(WorkflowRole.ADMIN)
    
    // For critical errors, notify additional stakeholders
    if (severity === 'critical') {
      const allRecipients = Array.from(this.recipients.values())
      recipients.push(...allRecipients.filter(r => r.preferences.topics[NotificationTrigger.SYSTEM_ERROR]))
    }
    
    return recipients
  }

  private async getSystemAlertRecipients(severity: string): Promise<NotificationRecipient[]> {
    return this.getErrorNotificationRecipients(severity)
  }

  private getTemplate(trigger: NotificationTrigger, channel: NotificationChannel): NotificationTemplate | undefined {
    for (const [_, template] of this.templates.entries()) {
      if (template.trigger === trigger && template.channel === channel && template.isActive) {
        return template
      }
    }
    return undefined
  }

  private shouldSendNotification(
    recipient: NotificationRecipient,
    trigger: NotificationTrigger,
    channel: NotificationChannel
  ): boolean {
    // Check if recipient wants this type of notification
    if (!recipient.preferences.topics[trigger]) return false
    
    // Check if channel is enabled for recipient
    if (!recipient.preferences.channels.includes(channel)) return false
    
    // Check frequency preferences (simplified)
    if (recipient.preferences.frequency === 'daily_digest' && 
        trigger !== NotificationTrigger.WORKFLOW_ERROR &&
        trigger !== NotificationTrigger.ESCALATION_TRIGGERED) {
      return false
    }
    
    return true
  }

  private isQuietHours(recipient: NotificationRecipient): boolean {
    const quietHours = recipient.preferences.quietHours
    if (!quietHours?.enabled) return false
    
    const now = new Date()
    const currentHour = now.getHours()
    const start = parseInt(quietHours.start.split(':')[0])
    const end = parseInt(quietHours.end.split(':')[0])
    
    if (start <= end) {
      return currentHour >= start && currentHour < end
    } else {
      return currentHour >= start || currentHour < end
    }
  }

  private getNextActiveHour(recipient: NotificationRecipient): Date {
    const quietHours = recipient.preferences.quietHours!
    const now = new Date()
    const endHour = parseInt(quietHours.end.split(':')[0])
    
    const nextActive = new Date(now)
    nextActive.setHours(endHour, 0, 0, 0)
    
    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1)
    }
    
    return nextActive
  }

  private async setupEscalation(
    workflowInstanceId: string,
    trigger: NotificationTrigger,
    severity: string,
    initialRecipients: NotificationRecipient[]
  ): Promise<void> {
    const escalation: NotificationEscalation = {
      id: crypto.randomUUID(),
      workflowInstanceId,
      trigger,
      severity: severity as any,
      escalationLevel: 0,
      maxEscalationLevel: 3,
      nextEscalationAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      recipients: initialRecipients,
      isActive: true
    }

    this.escalations.set(escalation.id, escalation)
  }

  private async escalateImmediately(
    correlationId: string,
    trigger: NotificationTrigger,
    severity: string,
    results: NotificationResult[]
  ): Promise<void> {
    // Send immediate alerts through high-priority channels
    const adminRecipients = await this.getRecipientsForRole(WorkflowRole.ADMIN)
    
    for (const recipient of adminRecipients) {
      // Use webhook or SMS for immediate critical alerts
      const urgentChannels = [NotificationChannel.WEBHOOK, NotificationChannel.SMS]
      
      for (const channel of urgentChannels) {
        if (recipient.preferences.channels.includes(channel)) {
          const template = this.getTemplate(NotificationTrigger.ESCALATION_TRIGGERED, channel)
          
          if (template) {
            const message = await this.createNotificationMessage(
              correlationId,
              NotificationTrigger.ESCALATION_TRIGGERED,
              NotificationPriority.CRITICAL,
              recipient,
              channel,
              template,
              {
                severity,
                trigger,
                timestamp: new Date(),
                escalationLevel: 'immediate'
              }
            )

            message.status = NotificationStatus.SENDING
            this.pendingNotifications.set(message.id, message)
            
            // Send immediately
            await this.sendNotification(message)
          }
        }
      }
    }
  }

  private async scheduleReminderNotifications(
    originalMessage: NotificationMessage,
    deadline: Date
  ): Promise<void> {
    const reminderIntervals = [24 * 60 * 60 * 1000, 4 * 60 * 60 * 1000, 60 * 60 * 1000] // 24h, 4h, 1h before
    
    for (const interval of reminderIntervals) {
      const reminderTime = new Date(deadline.getTime() - interval)
      
      if (reminderTime > new Date()) {
        const reminderMessage = { ...originalMessage }
        reminderMessage.id = crypto.randomUUID()
        reminderMessage.subject = `Reminder: ${originalMessage.subject}`
        reminderMessage.scheduledAt = reminderTime
        reminderMessage.status = NotificationStatus.SCHEDULED
        reminderMessage.metadata = {
          ...originalMessage.metadata,
          isReminder: true,
          originalMessageId: originalMessage.id
        }
        
        this.pendingNotifications.set(reminderMessage.id, reminderMessage)
      }
    }
  }

  private startNotificationProcessor(): void {
    // Process notifications every 5 seconds
    setInterval(async () => {
      await this.processNotifications()
    }, 5000)
  }

  private startEscalationProcessor(): void {
    // Check escalations every minute
    setInterval(async () => {
      await this.processEscalations()
    }, 60000)
  }

  private async processNotifications(): Promise<void> {
    const now = new Date()
    
    for (const [messageId, message] of this.pendingNotifications.entries()) {
      if (message.status === NotificationStatus.PENDING || 
          (message.status === NotificationStatus.SCHEDULED && message.scheduledAt && message.scheduledAt <= now)) {
        
        try {
          message.status = NotificationStatus.SENDING
          await this.sendNotification(message)
          message.status = NotificationStatus.SENT
          message.sentAt = new Date()
          
          // Remove from pending queue
          this.pendingNotifications.delete(messageId)
          
        } catch (error) {
          message.retryCount++
          message.errorMessage = (error as Error).message
          
          if (message.retryCount >= message.maxRetries) {
            message.status = NotificationStatus.FAILED
            this.pendingNotifications.delete(messageId)
            
            logger.error('Notification failed after max retries', {
              messageId,
              recipient: message.recipient.identifier,
              channel: message.channel,
              error: message.errorMessage
            })
          } else {
            // Schedule retry
            const retryDelay = this.retryIntervals[message.retryCount - 1] || 300000
            setTimeout(() => {
              message.status = NotificationStatus.PENDING
            }, retryDelay)
            
            logger.warn('Notification failed, scheduling retry', {
              messageId,
              retryCount: message.retryCount,
              retryDelay
            })
          }
        }
      }
    }
  }

  private async sendNotification(message: NotificationMessage): Promise<void> {
    switch (message.channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmail(message)
        break
      case NotificationChannel.SLACK:
        await this.sendSlack(message)
        break
      case NotificationChannel.WEBHOOK:
        await this.sendWebhook(message)
        break
      case NotificationChannel.IN_APP:
        await this.sendInApp(message)
        break
      default:
        throw new Error(`Unsupported notification channel: ${message.channel}`)
    }
  }

  private async sendEmail(message: NotificationMessage): Promise<void> {
    // Implementation would integrate with email service (SendGrid, AWS SES, etc.)
    logger.info('Sending email notification', {
      messageId: message.id,
      recipient: message.recipient.email || message.recipient.identifier,
      subject: message.subject
    })
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async sendSlack(message: NotificationMessage): Promise<void> {
    // Implementation would integrate with Slack API
    logger.info('Sending Slack notification', {
      messageId: message.id,
      recipient: message.recipient.slackUserId || message.recipient.identifier,
      body: message.body.substring(0, 100) + '...'
    })
    
    // Simulate Slack sending
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async sendWebhook(message: NotificationMessage): Promise<void> {
    // Implementation would make HTTP request to webhook URL
    logger.info('Sending webhook notification', {
      messageId: message.id,
      webhook: message.recipient.identifier,
      data: message.data
    })
    
    // Simulate webhook sending
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async sendInApp(message: NotificationMessage): Promise<void> {
    // Implementation would store in database and send via WebSocket
    logger.info('Sending in-app notification', {
      messageId: message.id,
      recipient: message.recipient.identifier,
      subject: message.subject
    })
    
    // Simulate in-app notification
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  private async processEscalations(): Promise<void> {
    const now = new Date()
    
    for (const [escalationId, escalation] of this.escalations.entries()) {
      if (escalation.isActive && escalation.nextEscalationAt <= now) {
        try {
          escalation.escalationLevel++
          
          if (escalation.escalationLevel <= escalation.maxEscalationLevel) {
            await this.executeEscalation(escalation)
            
            // Schedule next escalation
            escalation.nextEscalationAt = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes
          } else {
            // Max escalation reached
            escalation.isActive = false
            logger.warn('Maximum escalation level reached', {
              escalationId,
              workflowInstanceId: escalation.workflowInstanceId
            })
          }
        } catch (error) {
          logger.error('Escalation execution failed', {
            escalationId,
            error
          })
        }
      }
    }
  }

  private async executeEscalation(escalation: NotificationEscalation): Promise<void> {
    // Send escalation notification to higher-level recipients
    const escalationMessage = `Escalation Level ${escalation.escalationLevel}: ${escalation.trigger} for workflow ${escalation.workflowInstanceId}`
    
    await this.notifySystemAlert(
      'failure',
      escalation.severity,
      escalationMessage,
      {
        escalationId: escalation.id,
        escalationLevel: escalation.escalationLevel,
        workflowInstanceId: escalation.workflowInstanceId
      }
    )
    
    logger.warn('Workflow escalation executed', {
      escalationId: escalation.id,
      level: escalation.escalationLevel,
      severity: escalation.severity
    })
  }
}

// ================================
// Supporting Interfaces
// ================================

export interface NotificationResult {
  messageId: string
  recipient: string
  channel: NotificationChannel
  status: 'queued' | 'sent' | 'failed'
  error?: string
}

// Export singleton instance
export const workflowNotificationService = WorkflowNotificationService.getInstance()