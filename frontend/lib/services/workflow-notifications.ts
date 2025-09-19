/**
 * Workflow Notification System
 * Handles sending notifications for workflow state transitions
 * Story 1.4 Task 8 - Comprehensive workflow management system
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { WorkflowNotificationDAL } from '@/lib/dal/admin/workflow'
import type { 
  WorkflowInstance,
  WorkflowTransitionLog,
  WorkflowNotificationCreate,
  WorkflowState,
  WorkflowAction,
  WorkflowRole 
} from '@/lib/dal/admin/types'

// ================================
// Types
// ================================

export enum NotificationType {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SLACK = 'slack',
  WEBHOOK = 'webhook'
}

export enum NotificationTemplate {
  WORKFLOW_SUBMITTED = 'workflow_submitted',
  WORKFLOW_APPROVED = 'workflow_approved',
  WORKFLOW_REJECTED = 'workflow_rejected',
  WORKFLOW_PUBLISHED = 'workflow_published',
  WORKFLOW_OVERDUE = 'workflow_overdue',
  WORKFLOW_ASSIGNED = 'workflow_assigned',
  WORKFLOW_ESCALATED = 'workflow_escalated'
}

export interface NotificationRecipient {
  id: string
  type: 'user' | 'role' | 'group'
  email?: string
  name?: string
  preferences?: {
    types: NotificationType[]
    frequency: 'immediate' | 'digest_daily' | 'digest_weekly'
  }
}

export interface NotificationContext {
  workflow: WorkflowInstance
  transition?: WorkflowTransitionLog
  performer?: {
    id: string
    name: string
    role: WorkflowRole
  }
  metadata?: Record<string, any>
}

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  emailTemplate: string
  inAppTemplate: string
  slackTemplate?: string
  variables: string[]
}

// ================================
// Notification Templates
// ================================

const NOTIFICATION_TEMPLATES: Record<NotificationTemplate, NotificationTemplate> = {
  [NotificationTemplate.WORKFLOW_SUBMITTED]: {
    id: 'workflow_submitted',
    name: 'Content Submitted for Review',
    subject: 'New content submitted for review: {{contentTitle}}',
    emailTemplate: `
      <h2>Content Review Required</h2>
      <p>A new piece of content has been submitted for review and requires your attention.</p>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3>{{contentTitle}}</h3>
        <p><strong>Type:</strong> {{contentType}}</p>
        <p><strong>Author:</strong> {{authorName}}</p>
        <p><strong>Submitted:</strong> {{submittedAt}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
      </div>
      
      <p>Please review this content and take appropriate action.</p>
      
      <a href="{{reviewUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        Review Content
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        This is an automated notification from the HMHCP content management system.
      </p>
    `,
    inAppTemplate: `
      {{authorName}} submitted "{{contentTitle}}" for review. Priority: {{priority}}
    `,
    slackTemplate: `
      🔔 *Content Review Required*
      
      *{{contentTitle}}* ({{contentType}})
      Author: {{authorName}}
      Priority: {{priority}}
      
      <{{reviewUrl}}|Review Content>
    `,
    variables: ['contentTitle', 'contentType', 'authorName', 'submittedAt', 'priority', 'reviewUrl']
  },

  [NotificationTemplate.WORKFLOW_APPROVED]: {
    id: 'workflow_approved',
    name: 'Content Approved',
    subject: 'Your content has been approved: {{contentTitle}}',
    emailTemplate: `
      <h2>Content Approved ✅</h2>
      <p>Great news! Your content has been approved and is ready for the next step.</p>
      
      <div style="border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #f0fdf4;">
        <h3>{{contentTitle}}</h3>
        <p><strong>Approved by:</strong> {{approverName}} ({{approverRole}})</p>
        <p><strong>Approved on:</strong> {{approvedAt}}</p>
        {{#if comment}}<p><strong>Comments:</strong> {{comment}}</p>{{/if}}
      </div>
      
      <p>Your content is now ready for publishing. It will be published according to the scheduled timeline.</p>
      
      <a href="{{contentUrl}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        View Content
      </a>
    `,
    inAppTemplate: `
      Your content "{{contentTitle}}" has been approved by {{approverName}}.
    `,
    slackTemplate: `
      ✅ *Content Approved*
      
      "{{contentTitle}}" has been approved by {{approverName}}.
      {{#if comment}}Comment: _{{comment}}_{{/if}}
      
      <{{contentUrl}}|View Content>
    `,
    variables: ['contentTitle', 'approverName', 'approverRole', 'approvedAt', 'comment', 'contentUrl']
  },

  [NotificationTemplate.WORKFLOW_REJECTED]: {
    id: 'workflow_rejected',
    name: 'Content Rejected',
    subject: 'Content requires revisions: {{contentTitle}}',
    emailTemplate: `
      <h2>Content Requires Revisions</h2>
      <p>Your content has been reviewed and requires some changes before it can be approved.</p>
      
      <div style="border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #fef2f2;">
        <h3>{{contentTitle}}</h3>
        <p><strong>Reviewed by:</strong> {{reviewerName}} ({{reviewerRole}})</p>
        <p><strong>Reviewed on:</strong> {{reviewedAt}}</p>
        {{#if comment}}
        <div style="margin-top: 12px;">
          <strong>Feedback:</strong>
          <p style="background-color: white; padding: 12px; border-radius: 4px; margin-top: 8px;">{{comment}}</p>
        </div>
        {{/if}}
      </div>
      
      <p>Please make the requested changes and resubmit your content for review.</p>
      
      <a href="{{editUrl}}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        Edit Content
      </a>
    `,
    inAppTemplate: `
      Your content "{{contentTitle}}" requires revisions. {{#if comment}}Feedback: {{comment}}{{/if}}
    `,
    slackTemplate: `
      ❌ *Content Needs Revision*
      
      "{{contentTitle}}" was rejected by {{reviewerName}}.
      {{#if comment}}Feedback: _{{comment}}_{{/if}}
      
      <{{editUrl}}|Edit Content>
    `,
    variables: ['contentTitle', 'reviewerName', 'reviewerRole', 'reviewedAt', 'comment', 'editUrl']
  },

  [NotificationTemplate.WORKFLOW_PUBLISHED]: {
    id: 'workflow_published',
    name: 'Content Published',
    subject: 'Your content is now live: {{contentTitle}}',
    emailTemplate: `
      <h2>Content Published 🚀</h2>
      <p>Congratulations! Your content has been published and is now live on the website.</p>
      
      <div style="border: 1px solid #8b5cf6; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #faf5ff;">
        <h3>{{contentTitle}}</h3>
        <p><strong>Published by:</strong> {{publisherName}}</p>
        <p><strong>Published on:</strong> {{publishedAt}}</p>
        <p><strong>Live URL:</strong> <a href="{{liveUrl}}">{{liveUrl}}</a></p>
      </div>
      
      <p>Your content is now visible to all website visitors. Great work!</p>
      
      <a href="{{liveUrl}}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        View Live Content
      </a>
    `,
    inAppTemplate: `
      Your content "{{contentTitle}}" is now live! View at {{liveUrl}}
    `,
    slackTemplate: `
      🚀 *Content Published*
      
      "{{contentTitle}}" is now live!
      Published by {{publisherName}}
      
      <{{liveUrl}}|View Live Content>
    `,
    variables: ['contentTitle', 'publisherName', 'publishedAt', 'liveUrl']
  },

  [NotificationTemplate.WORKFLOW_OVERDUE]: {
    id: 'workflow_overdue',
    name: 'Workflow Overdue',
    subject: 'Overdue review required: {{contentTitle}}',
    emailTemplate: `
      <h2>⚠️ Overdue Review</h2>
      <p>This content has been waiting for review longer than expected and requires immediate attention.</p>
      
      <div style="border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #fffbeb;">
        <h3>{{contentTitle}}</h3>
        <p><strong>Author:</strong> {{authorName}}</p>
        <p><strong>Submitted:</strong> {{submittedAt}}</p>
        <p><strong>Days overdue:</strong> {{daysOverdue}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
      </div>
      
      <p>Please review this content as soon as possible to avoid further delays.</p>
      
      <a href="{{reviewUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        Review Now
      </a>
    `,
    inAppTemplate: `
      Overdue: "{{contentTitle}}" has been waiting for review for {{daysOverdue}} days.
    `,
    slackTemplate: `
      ⚠️ *Overdue Review*
      
      "{{contentTitle}}" is {{daysOverdue}} days overdue for review.
      Author: {{authorName}}
      Priority: {{priority}}
      
      <{{reviewUrl}}|Review Now>
    `,
    variables: ['contentTitle', 'authorName', 'submittedAt', 'daysOverdue', 'priority', 'reviewUrl']
  },

  [NotificationTemplate.WORKFLOW_ASSIGNED]: {
    id: 'workflow_assigned',
    name: 'Workflow Assigned',
    subject: 'Content assigned to you: {{contentTitle}}',
    emailTemplate: `
      <h2>Content Assigned to You</h2>
      <p>A piece of content has been assigned to you for review.</p>
      
      <div style="border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #eff6ff;">
        <h3>{{contentTitle}}</h3>
        <p><strong>Author:</strong> {{authorName}}</p>
        <p><strong>Assigned by:</strong> {{assignerName}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        {{#if dueDate}}<p><strong>Due date:</strong> {{dueDate}}</p>{{/if}}
        {{#if assignmentComment}}<p><strong>Note:</strong> {{assignmentComment}}</p>{{/if}}
      </div>
      
      <p>Please review this content at your earliest convenience.</p>
      
      <a href="{{reviewUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        Start Review
      </a>
    `,
    inAppTemplate: `
      "{{contentTitle}}" has been assigned to you for review by {{assignerName}}.
    `,
    slackTemplate: `
      📋 *Content Assigned*
      
      "{{contentTitle}}" has been assigned to you for review.
      Author: {{authorName}}
      Assigned by: {{assignerName}}
      {{#if dueDate}}Due: {{dueDate}}{{/if}}
      
      <{{reviewUrl}}|Start Review>
    `,
    variables: ['contentTitle', 'authorName', 'assignerName', 'priority', 'dueDate', 'assignmentComment', 'reviewUrl']
  }
}

// ================================
// Notification Service Class
// ================================

export class WorkflowNotificationService {
  private supabase: any
  private notificationDAL: WorkflowNotificationDAL

  constructor() {
    this.supabase = createClient()
    this.notificationDAL = new WorkflowNotificationDAL(this.supabase)
  }

  /**
   * Send workflow transition notification
   */
  async sendTransitionNotification(
    context: NotificationContext,
    template: NotificationTemplate,
    recipients: NotificationRecipient[]
  ): Promise<void> {
    try {
      logger.info('Sending workflow transition notification', {
        workflowId: context.workflow.id,
        template,
        recipientCount: recipients.length
      })

      const templateConfig = NOTIFICATION_TEMPLATES[template]
      if (!templateConfig) {
        throw new Error(`Unknown notification template: ${template}`)
      }

      // Generate template variables
      const variables = this.generateTemplateVariables(context)

      // Send notifications to each recipient
      for (const recipient of recipients) {
        await this.sendNotificationToRecipient(
          recipient,
          templateConfig,
          variables,
          context.workflow.id
        )
      }

    } catch (error) {
      logger.error('Failed to send workflow transition notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowId: context.workflow.id,
        template
      })
      throw error
    }
  }

  /**
   * Send notification when content is submitted for review
   */
  async sendSubmittedForReviewNotification(
    workflow: WorkflowInstance,
    transition: WorkflowTransitionLog
  ): Promise<void> {
    const context: NotificationContext = { workflow, transition }
    const recipients = await this.getRecipientsForRole('reviewer')
    
    await this.sendTransitionNotification(
      context,
      NotificationTemplate.WORKFLOW_SUBMITTED,
      recipients
    )
  }

  /**
   * Send notification when content is approved
   */
  async sendApprovedNotification(
    workflow: WorkflowInstance,
    transition: WorkflowTransitionLog
  ): Promise<void> {
    const context: NotificationContext = { workflow, transition }
    const recipients = await this.getRecipientsForUser(workflow.created_by)
    
    await this.sendTransitionNotification(
      context,
      NotificationTemplate.WORKFLOW_APPROVED,
      recipients
    )
  }

  /**
   * Send notification when content is rejected
   */
  async sendRejectedNotification(
    workflow: WorkflowInstance,
    transition: WorkflowTransitionLog
  ): Promise<void> {
    const context: NotificationContext = { workflow, transition }
    const recipients = await this.getRecipientsForUser(workflow.created_by)
    
    await this.sendTransitionNotification(
      context,
      NotificationTemplate.WORKFLOW_REJECTED,
      recipients
    )
  }

  /**
   * Send notification when content is published
   */
  async sendPublishedNotification(
    workflow: WorkflowInstance,
    transition: WorkflowTransitionLog
  ): Promise<void> {
    const context: NotificationContext = { workflow, transition }
    
    // Notify author and stakeholders
    const recipients = [
      ...(await this.getRecipientsForUser(workflow.created_by)),
      ...(await this.getRecipientsForRole('admin'))
    ]
    
    await this.sendTransitionNotification(
      context,
      NotificationTemplate.WORKFLOW_PUBLISHED,
      recipients
    )
  }

  /**
   * Send notification for overdue workflows
   */
  async sendOverdueNotifications(): Promise<void> {
    try {
      // This would typically be called by a scheduled job
      const overdueWorkflows = await this.getOverdueWorkflows()
      
      for (const workflow of overdueWorkflows) {
        const context: NotificationContext = { workflow }
        const recipients = workflow.assigned_to 
          ? await this.getRecipientsForUser(workflow.assigned_to)
          : await this.getRecipientsForRole('reviewer')
        
        await this.sendTransitionNotification(
          context,
          NotificationTemplate.WORKFLOW_OVERDUE,
          recipients
        )
      }

    } catch (error) {
      logger.error('Failed to send overdue notifications', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Send notification when workflow is assigned
   */
  async sendAssignedNotification(
    workflow: WorkflowInstance,
    assigneeId: string,
    assignerId: string,
    comment?: string
  ): Promise<void> {
    const context: NotificationContext = {
      workflow,
      metadata: {
        assignerId,
        assignmentComment: comment
      }
    }
    
    const recipients = await this.getRecipientsForUser(assigneeId)
    
    await this.sendTransitionNotification(
      context,
      NotificationTemplate.WORKFLOW_ASSIGNED,
      recipients
    )
  }

  // ================================
  // Private Helper Methods
  // ================================

  private async sendNotificationToRecipient(
    recipient: NotificationRecipient,
    template: NotificationTemplate,
    variables: Record<string, string>,
    workflowInstanceId: string
  ): Promise<void> {
    try {
      // Check recipient preferences
      const preferredTypes = recipient.preferences?.types || [NotificationType.IN_APP]

      for (const type of preferredTypes) {
        switch (type) {
          case NotificationType.IN_APP:
            await this.sendInAppNotification(recipient, template, variables, workflowInstanceId)
            break
          case NotificationType.EMAIL:
            await this.sendEmailNotification(recipient, template, variables)
            break
          case NotificationType.SLACK:
            await this.sendSlackNotification(recipient, template, variables)
            break
          case NotificationType.WEBHOOK:
            await this.sendWebhookNotification(recipient, template, variables)
            break
        }
      }

    } catch (error) {
      logger.error('Failed to send notification to recipient', {
        recipientId: recipient.id,
        template: template.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async sendInAppNotification(
    recipient: NotificationRecipient,
    template: NotificationTemplate,
    variables: Record<string, string>,
    workflowInstanceId: string
  ): Promise<void> {
    const subject = this.renderTemplate(template.subject, variables)
    const content = this.renderTemplate(template.inAppTemplate, variables)

    const notification: WorkflowNotificationCreate = {
      workflow_instance_id: workflowInstanceId,
      recipient_id: recipient.id,
      recipient_type: recipient.type,
      notification_type: NotificationType.IN_APP,
      subject,
      content
    }

    await this.notificationDAL.create(notification)
  }

  private async sendEmailNotification(
    recipient: NotificationRecipient,
    template: NotificationTemplate,
    variables: Record<string, string>
  ): Promise<void> {
    if (!recipient.email) {
      logger.warn('Cannot send email notification - no email address', {
        recipientId: recipient.id
      })
      return
    }

    const subject = this.renderTemplate(template.subject, variables)
    const content = this.renderTemplate(template.emailTemplate, variables)

    // In a real implementation, this would integrate with an email service
    // like SendGrid, AWS SES, or similar
    logger.info('Email notification would be sent', {
      to: recipient.email,
      subject,
      preview: content.substring(0, 100)
    })

    // TODO: Integrate with actual email service
    // await this.emailService.send({
    //   to: recipient.email,
    //   subject,
    //   html: content
    // })
  }

  private async sendSlackNotification(
    recipient: NotificationRecipient,
    template: NotificationTemplate,
    variables: Record<string, string>
  ): Promise<void> {
    if (!template.slackTemplate) {
      return
    }

    const content = this.renderTemplate(template.slackTemplate, variables)

    // In a real implementation, this would integrate with Slack API
    logger.info('Slack notification would be sent', {
      recipientId: recipient.id,
      content
    })

    // TODO: Integrate with Slack API
    // await this.slackService.sendMessage({
    //   channel: recipient.slackChannel,
    //   text: content
    // })
  }

  private async sendWebhookNotification(
    recipient: NotificationRecipient,
    template: NotificationTemplate,
    variables: Record<string, string>
  ): Promise<void> {
    const payload = {
      template: template.id,
      recipient: recipient.id,
      variables,
      timestamp: new Date().toISOString()
    }

    // In a real implementation, this would send HTTP POST to webhook URL
    logger.info('Webhook notification would be sent', {
      recipientId: recipient.id,
      payload
    })

    // TODO: Integrate with webhook system
    // await this.webhookService.send({
    //   url: recipient.webhookUrl,
    //   payload
    // })
  }

  private generateTemplateVariables(context: NotificationContext): Record<string, string> {
    const { workflow, transition, performer, metadata } = context

    return {
      // Workflow variables
      contentTitle: workflow.metadata?.title || 'Untitled Content',
      contentType: workflow.content_type.replace('_', ' '),
      contentId: workflow.content_id,
      workflowState: workflow.current_state,
      priority: workflow.priority,
      createdAt: new Date(workflow.created_at).toLocaleDateString(),
      updatedAt: new Date(workflow.updated_at).toLocaleDateString(),
      
      // Author variables
      authorName: workflow.metadata?.createdBy || 'Unknown Author',
      authorId: workflow.created_by,
      
      // Transition variables
      ...(transition && {
        fromState: transition.from_state,
        toState: transition.to_state,
        action: transition.action,
        transitionComment: transition.comment || '',
        transitionTimestamp: new Date(transition.timestamp).toLocaleDateString(),
      }),
      
      // Performer variables
      ...(performer && {
        performerName: performer.name,
        performerId: performer.id,
        performerRole: performer.role,
      }),
      
      // URL variables (would be dynamically generated in real implementation)
      reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/content/${workflow.content_type}/${workflow.content_id}/review`,
      editUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/content/${workflow.content_type}/${workflow.content_id}/edit`,
      contentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/content/${workflow.content_type}/${workflow.content_id}`,
      liveUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${workflow.content_type}/${workflow.metadata?.slug || workflow.content_id}`,
      
      // Metadata variables
      ...(metadata && Object.entries(metadata).reduce((acc, [key, value]) => {
        acc[key] = String(value)
        return acc
      }, {} as Record<string, string>))
    }
  }

  private renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template

    // Simple template variable replacement ({{variable}})
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, value || '')
    })

    // Handle conditional blocks ({{#if variable}}...{{/if}})
    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return variables[variable] ? content : ''
    })

    return rendered
  }

  private async getRecipientsForRole(role: string): Promise<NotificationRecipient[]> {
    // In a real implementation, this would query the database for users with the given role
    // For now, return mock data
    return [
      {
        id: `${role}-user-1`,
        type: 'user',
        email: `${role}1@example.com`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} User 1`,
        preferences: {
          types: [NotificationType.EMAIL, NotificationType.IN_APP],
          frequency: 'immediate'
        }
      }
    ]
  }

  private async getRecipientsForUser(userId: string): Promise<NotificationRecipient[]> {
    // In a real implementation, this would query the database for the specific user
    // For now, return mock data
    return [
      {
        id: userId,
        type: 'user',
        email: `${userId}@example.com`,
        name: 'User Name',
        preferences: {
          types: [NotificationType.EMAIL, NotificationType.IN_APP],
          frequency: 'immediate'
        }
      }
    ]
  }

  private async getOverdueWorkflows(): Promise<WorkflowInstance[]> {
    // In a real implementation, this would query for overdue workflows
    // For now, return empty array
    return []
  }
}

// Singleton instance
export const workflowNotificationService = new WorkflowNotificationService()