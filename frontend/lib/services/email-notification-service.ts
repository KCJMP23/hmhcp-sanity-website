/**
 * Email Notification Service for Blog Post Scheduling
 * Handles email notifications for scheduled blog posts
 */

import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('EmailNotificationService');

export interface EmailNotification {
  id: string;
  type: 'scheduled' | 'published' | 'failed' | 'reminder';
  recipient: string;
  subject: string;
  content: string;
  scheduledAt?: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface BlogPostNotification {
  postId: string;
  title: string;
  author: string;
  scheduledAt: string;
  publishedAt?: string;
  status: 'scheduled' | 'published' | 'failed';
  errorMessage?: string;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;
  private notifications: EmailNotification[] = [];

  private constructor() {}

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Send notification when a blog post is scheduled
   */
  async sendScheduledNotification(post: BlogPostNotification): Promise<void> {
    try {
      logger.info('Sending scheduled notification', { postId: post.postId });

      const notification: EmailNotification = {
        id: `scheduled-${post.postId}-${Date.now()}`,
        type: 'scheduled',
        recipient: post.author, // In production, this would be the author's email
        subject: `Blog Post Scheduled: ${post.title}`,
        content: this.generateScheduledEmailContent(post),
        scheduledAt: post.scheduledAt,
        status: 'pending'
      };

      // In production, this would integrate with an email service (SendGrid, AWS SES, etc.)
      await this.sendEmail(notification);
      
      this.notifications.push(notification);
      
      logger.info('Scheduled notification sent successfully', { 
        postId: post.postId,
        notificationId: notification.id 
      });
    } catch (error) {
      logger.error('Failed to send scheduled notification', { 
        postId: post.postId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Send notification when a blog post is published
   */
  async sendPublishedNotification(post: BlogPostNotification): Promise<void> {
    try {
      logger.info('Sending published notification', { postId: post.postId });

      const notification: EmailNotification = {
        id: `published-${post.postId}-${Date.now()}`,
        type: 'published',
        recipient: post.author,
        subject: `Blog Post Published: ${post.title}`,
        content: this.generatePublishedEmailContent(post),
        sentAt: new Date().toISOString(),
        status: 'pending'
      };

      await this.sendEmail(notification);
      
      this.notifications.push(notification);
      
      logger.info('Published notification sent successfully', { 
        postId: post.postId,
        notificationId: notification.id 
      });
    } catch (error) {
      logger.error('Failed to send published notification', { 
        postId: post.postId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Send notification when a blog post publishing fails
   */
  async sendFailedNotification(post: BlogPostNotification): Promise<void> {
    try {
      logger.info('Sending failed notification', { postId: post.postId });

      const notification: EmailNotification = {
        id: `failed-${post.postId}-${Date.now()}`,
        type: 'failed',
        recipient: post.author,
        subject: `Blog Post Publishing Failed: ${post.title}`,
        content: this.generateFailedEmailContent(post),
        sentAt: new Date().toISOString(),
        status: 'pending'
      };

      await this.sendEmail(notification);
      
      this.notifications.push(notification);
      
      logger.info('Failed notification sent successfully', { 
        postId: post.postId,
        notificationId: notification.id 
      });
    } catch (error) {
      logger.error('Failed to send failed notification', { 
        postId: post.postId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Send reminder notification before scheduled publishing
   */
  async sendReminderNotification(post: BlogPostNotification, hoursBefore: number = 1): Promise<void> {
    try {
      logger.info('Sending reminder notification', { 
        postId: post.postId, 
        hoursBefore 
      });

      const reminderTime = new Date(post.scheduledAt);
      reminderTime.setHours(reminderTime.getHours() - hoursBefore);

      const notification: EmailNotification = {
        id: `reminder-${post.postId}-${Date.now()}`,
        type: 'reminder',
        recipient: post.author,
        subject: `Reminder: Blog Post Publishing in ${hoursBefore} hour(s) - ${post.title}`,
        content: this.generateReminderEmailContent(post, hoursBefore),
        scheduledAt: reminderTime.toISOString(),
        status: 'pending'
      };

      // Schedule the reminder
      setTimeout(async () => {
        await this.sendEmail(notification);
        this.notifications.push(notification);
      }, reminderTime.getTime() - Date.now());
      
      logger.info('Reminder notification scheduled', { 
        postId: post.postId,
        reminderTime: reminderTime.toISOString() 
      });
    } catch (error) {
      logger.error('Failed to schedule reminder notification', { 
        postId: post.postId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limit: number = 50): Promise<EmailNotification[]> {
    logger.info('Fetching notification history', { limit });
    
    return this.notifications
      .sort((a, b) => new Date(b.sentAt || b.scheduledAt || '').getTime() - new Date(a.sentAt || a.scheduledAt || '').getTime())
      .slice(0, limit);
  }

  /**
   * Send email (mock implementation)
   */
  private async sendEmail(notification: EmailNotification): Promise<void> {
    // In production, this would integrate with an email service
    logger.info('Sending email notification', { 
      type: notification.type,
      recipient: notification.recipient,
      subject: notification.subject 
    });

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    notification.status = 'sent';
    notification.sentAt = new Date().toISOString();
  }

  /**
   * Generate email content for scheduled posts
   */
  private generateScheduledEmailContent(post: BlogPostNotification): string {
    const scheduledDate = new Date(post.scheduledAt).toLocaleString();
    
    return `
      <h2>Blog Post Scheduled Successfully</h2>
      <p>Your blog post has been scheduled for publication.</p>
      
      <h3>Post Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${post.title}</li>
        <li><strong>Scheduled Date:</strong> ${scheduledDate}</li>
        <li><strong>Author:</strong> ${post.author}</li>
      </ul>
      
      <p>You will receive a notification when the post is published.</p>
      
      <p>Best regards,<br>
      Healthcare Blog Management System</p>
    `;
  }

  /**
   * Generate email content for published posts
   */
  private generatePublishedEmailContent(post: BlogPostNotification): string {
    const publishedDate = new Date(post.publishedAt || '').toLocaleString();
    
    return `
      <h2>Blog Post Published Successfully</h2>
      <p>Your blog post has been published and is now live.</p>
      
      <h3>Post Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${post.title}</li>
        <li><strong>Published Date:</strong> ${publishedDate}</li>
        <li><strong>Author:</strong> ${post.author}</li>
      </ul>
      
      <p>You can view your post in the blog management system.</p>
      
      <p>Best regards,<br>
      Healthcare Blog Management System</p>
    `;
  }

  /**
   * Generate email content for failed posts
   */
  private generateFailedEmailContent(post: BlogPostNotification): string {
    const scheduledDate = new Date(post.scheduledAt).toLocaleString();
    
    return `
      <h2>Blog Post Publishing Failed</h2>
      <p>Unfortunately, your scheduled blog post failed to publish.</p>
      
      <h3>Post Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${post.title}</li>
        <li><strong>Scheduled Date:</strong> ${scheduledDate}</li>
        <li><strong>Author:</strong> ${post.author}</li>
        <li><strong>Error:</strong> ${post.errorMessage || 'Unknown error'}</li>
      </ul>
      
      <p>Please check the blog management system to retry publishing or contact support.</p>
      
      <p>Best regards,<br>
      Healthcare Blog Management System</p>
    `;
  }

  /**
   * Generate email content for reminder notifications
   */
  private generateReminderEmailContent(post: BlogPostNotification, hoursBefore: number): string {
    const scheduledDate = new Date(post.scheduledAt).toLocaleString();
    
    return `
      <h2>Blog Post Publishing Reminder</h2>
      <p>This is a reminder that your blog post will be published in ${hoursBefore} hour(s).</p>
      
      <h3>Post Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${post.title}</li>
        <li><strong>Scheduled Date:</strong> ${scheduledDate}</li>
        <li><strong>Author:</strong> ${post.author}</li>
      </ul>
      
      <p>If you need to make any last-minute changes, please do so in the blog management system.</p>
      
      <p>Best regards,<br>
      Healthcare Blog Management System</p>
    `;
  }
}
