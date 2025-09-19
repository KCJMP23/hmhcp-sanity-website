// SMTP Email Service Implementation
// Created: 2025-01-27
// Purpose: SMTP integration for email sending

import { 
  EmailServiceProvider, 
  EmailServiceConfig, 
  SendEmailParams, 
  SendBulkEmailParams,
  SendEmailResult,
  SendBulkEmailResult,
  DeliveryStatus,
  EmailTemplate,
  EmailTemplateResult,
  ContactData,
  ContactResult,
  WebhookConfig,
  WebhookResult,
  HealthStatus,
  ServiceMetrics,
  RateLimits,
  EmailServiceError
} from './EmailServiceProvider';

export class SMTPService implements EmailServiceProvider {
  public readonly name = 'smtp';
  public isConfigured = false;
  public isHealthy = false;
  public lastHealthCheck = new Date();
  
  private config: EmailServiceConfig;
  private transporter: any;
  private metrics: ServiceMetrics = {
    totalEmailsSent: 0,
    totalEmailsDelivered: 0,
    totalEmailsBounced: 0,
    totalEmailsDropped: 0,
    averageDeliveryTime: 0,
    successRate: 0,
    lastUpdated: new Date()
  };

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.isConfigured = !!(
      config.smtpHost && 
      config.smtpPort && 
      config.smtpUsername && 
      config.smtpPassword
    );
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = this.buildMailOptions(params);
      const result = await this.transporter.sendMail(mailOptions);
      
      this.updateMetrics(true, false, false);
      
      return {
        success: true,
        messageId: result.messageId,
        providerResponse: result
      };
    } catch (error) {
      this.updateMetrics(false, false, true);
      
      throw new EmailServiceError(
        `Failed to send email via SMTP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SMTP_SEND_ERROR',
        undefined,
        'smtp',
        this.isRetryableError(error)
      );
    }
  }

  async sendBulkEmail(params: SendBulkEmailParams): Promise<SendBulkEmailResult> {
    try {
      const results: SendEmailResult[] = [];
      const batchSize = params.batchSize || 10;
      const delay = params.delayBetweenBatches || 1000;
      
      // Split recipients into batches
      const batches = this.chunkArray(params.recipients, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchParams: SendEmailParams = {
          to: batch.map(r => r.email),
          from: params.from,
          replyTo: params.replyTo,
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent,
          templateId: params.templateId,
          templateData: params.templateData,
          attachments: params.attachments,
          headers: params.headers,
          tags: params.tags,
          metadata: params.metadata
        };
        
        try {
          const result = await this.sendEmail(batchParams);
          results.push(result);
        } catch (error) {
          // Add failed results for this batch
          batch.forEach(recipient => {
            results.push({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          });
        }
        
        // Add delay between batches if not the last batch
        if (i < batches.length - 1) {
          await this.delay(delay);
        }
      }
      
      const totalSent = results.filter(r => r.success).length;
      const totalFailed = results.filter(r => !r.success).length;
      
      return {
        success: totalSent > 0,
        totalSent,
        totalFailed,
        results,
        batchId: this.generateMessageId()
      };
    } catch (error) {
      throw new EmailServiceError(
        `Failed to send bulk email via SMTP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SMTP_BULK_SEND_ERROR',
        undefined,
        'smtp',
        true
      );
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    // SMTP doesn't provide delivery status tracking
    // This would typically be handled via bounce handling or webhooks
    return {
      messageId,
      status: 'sent',
      timestamp: new Date(),
      reason: 'Status not available via SMTP'
    };
  }

  async createTemplate(template: EmailTemplate): Promise<EmailTemplateResult> {
    // SMTP doesn't support template management
    // Templates would be handled at the application level
    throw new EmailServiceError(
      'Template management not supported via SMTP',
      'SMTP_TEMPLATE_ERROR',
      undefined,
      'smtp'
    );
  }

  async updateTemplate(templateId: string, template: Partial<EmailTemplate>): Promise<EmailTemplateResult> {
    throw new EmailServiceError(
      'Template management not supported via SMTP',
      'SMTP_TEMPLATE_ERROR',
      undefined,
      'smtp'
    );
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    throw new EmailServiceError(
      'Template management not supported via SMTP',
      'SMTP_TEMPLATE_ERROR',
      undefined,
      'smtp'
    );
  }

  async getTemplate(templateId: string): Promise<EmailTemplateResult> {
    throw new EmailServiceError(
      'Template management not supported via SMTP',
      'SMTP_TEMPLATE_ERROR',
      undefined,
      'smtp'
    );
  }

  async listTemplates(): Promise<EmailTemplateResult[]> {
    throw new EmailServiceError(
      'Template management not supported via SMTP',
      'SMTP_TEMPLATE_ERROR',
      undefined,
      'smtp'
    );
  }

  async createContact(contact: ContactData): Promise<ContactResult> {
    // SMTP doesn't support contact management
    // Contacts would be handled at the application level
    throw new EmailServiceError(
      'Contact management not supported via SMTP',
      'SMTP_CONTACT_ERROR',
      undefined,
      'smtp'
    );
  }

  async updateContact(contactId: string, contact: Partial<ContactData>): Promise<ContactResult> {
    throw new EmailServiceError(
      'Contact management not supported via SMTP',
      'SMTP_CONTACT_ERROR',
      undefined,
      'smtp'
    );
  }

  async deleteContact(contactId: string): Promise<boolean> {
    throw new EmailServiceError(
      'Contact management not supported via SMTP',
      'SMTP_CONTACT_ERROR',
      undefined,
      'smtp'
    );
  }

  async getContact(contactId: string): Promise<ContactResult> {
    throw new EmailServiceError(
      'Contact management not supported via SMTP',
      'SMTP_CONTACT_ERROR',
      undefined,
      'smtp'
    );
  }

  async listContacts(): Promise<ContactResult[]> {
    throw new EmailServiceError(
      'Contact management not supported via SMTP',
      'SMTP_CONTACT_ERROR',
      undefined,
      'smtp'
    );
  }

  async createWebhook(webhook: WebhookConfig): Promise<WebhookResult> {
    // SMTP doesn't support webhooks
    // Webhooks would be handled at the application level
    throw new EmailServiceError(
      'Webhook management not supported via SMTP',
      'SMTP_WEBHOOK_ERROR',
      undefined,
      'smtp'
    );
  }

  async updateWebhook(webhookId: string, webhook: Partial<WebhookConfig>): Promise<WebhookResult> {
    throw new EmailServiceError(
      'Webhook management not supported via SMTP',
      'SMTP_WEBHOOK_ERROR',
      undefined,
      'smtp'
    );
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    throw new EmailServiceError(
      'Webhook management not supported via SMTP',
      'SMTP_WEBHOOK_ERROR',
      undefined,
      'smtp'
    );
  }

  async listWebhooks(): Promise<WebhookResult[]> {
    throw new EmailServiceError(
      'Webhook management not supported via SMTP',
      'SMTP_WEBHOOK_ERROR',
      undefined,
      'smtp'
    );
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      
      if (!this.transporter) {
        await this.initializeTransporter();
      }
      
      // Test SMTP connection
      await this.transporter.verify();
      const responseTime = Date.now() - startTime;
      
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      
      return {
        isHealthy: true,
        status: 'operational',
        message: 'SMTP service is operational',
        lastChecked: this.lastHealthCheck,
        responseTime,
        details: {
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          provider: 'smtp'
        }
      };
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      
      return {
        isHealthy: false,
        status: 'down',
        message: `SMTP health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: this.lastHealthCheck,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          provider: 'smtp'
        }
      };
    }
  }

  async getMetrics(): Promise<ServiceMetrics> {
    return { ...this.metrics };
  }

  async getRateLimits(): Promise<RateLimits> {
    // SMTP doesn't have built-in rate limiting
    // Rate limiting would be handled at the application level
    return {
      dailyLimit: 0,
      hourlyLimit: 0,
      perSecondLimit: 0,
      remainingDaily: 0,
      remainingHourly: 0,
      resetTime: new Date()
    };
  }

  private async initializeTransporter(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const nodemailer = await import('nodemailer');
      
      const smtpConfig = {
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure || false,
        auth: {
          user: this.config.smtpUsername,
          pass: this.config.smtpPassword
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      };

      this.transporter = nodemailer.createTransporter(smtpConfig);
    } catch (error) {
      throw new EmailServiceError(
        `Failed to initialize SMTP transporter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SMTP_INIT_ERROR',
        undefined,
        'smtp',
        true
      );
    }
  }

  private buildMailOptions(params: SendEmailParams): any {
    const mailOptions: any = {
      from: {
        address: params.from,
        name: this.config.fromName
      },
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject
    };

    if (params.replyTo) {
      mailOptions.replyTo = params.replyTo;
    }

    if (params.cc) {
      mailOptions.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
    }

    if (params.bcc) {
      mailOptions.bcc = Array.isArray(params.bcc) ? params.bcc : [params.bcc];
    }

    if (params.htmlContent) {
      mailOptions.html = params.htmlContent;
    }

    if (params.textContent) {
      mailOptions.text = params.textContent;
    }

    if (params.attachments && params.attachments.length > 0) {
      mailOptions.attachments = params.attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.type,
        cid: attachment.cid
      }));
    }

    if (params.headers) {
      mailOptions.headers = params.headers;
    }

    if (params.tags) {
      mailOptions.categories = params.tags;
    }

    if (params.metadata) {
      mailOptions.customArgs = params.metadata;
    }

    return mailOptions;
  }

  private updateMetrics(success: boolean, bounced: boolean, dropped: boolean): void {
    this.metrics.totalEmailsSent++;
    
    if (success) {
      this.metrics.totalEmailsDelivered++;
    } else if (bounced) {
      this.metrics.totalEmailsBounced++;
    } else if (dropped) {
      this.metrics.totalEmailsDropped++;
    }
    
    this.metrics.successRate = this.metrics.totalEmailsSent > 0 
      ? (this.metrics.totalEmailsDelivered / this.metrics.totalEmailsSent) * 100 
      : 0;
    
    this.metrics.lastUpdated = new Date();
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('timeout') || 
             message.includes('connection') || 
             message.includes('network') ||
             message.includes('temporary');
    }
    return false;
  }

  private generateMessageId(): string {
    return `smtp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
