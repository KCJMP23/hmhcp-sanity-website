// SendGrid Email Service Implementation
// Created: 2025-01-27
// Purpose: SendGrid API integration for email sending

import { 
  EmailServiceProvider, 
  EmailServiceConfig, 
  SendEmailParams, 
  SendBulkEmailParams,
  SendEmailResult,
  SendBulkEmailResult,
  DeliveryStatus,
  ServiceEmailTemplate,
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

export class SendGridService implements EmailServiceProvider {
  public readonly name = 'sendgrid';
  public isConfigured = false;
  public isHealthy = false;
  public lastHealthCheck = new Date();
  
  private apiKey: string;
  private config: EmailServiceConfig;
  private baseUrl = 'https://api.sendgrid.com/v3';
  private rateLimitCache = new Map<string, { count: number; resetTime: Date }>();

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.apiKey = config.apiKey || '';
    this.isConfigured = !!this.apiKey;
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      await this.checkRateLimit();
      
      const payload = this.buildSendGridPayload(params);
      const response = await this.makeRequest('/mail/send', 'POST', payload);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          messageId: response.headers['x-message-id'] || this.generateMessageId(),
          providerResponse: response.body
        };
      } else {
        throw new EmailServiceError(
          `SendGrid API error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_API_ERROR',
          response.statusCode,
          'sendgrid',
          this.isRetryableError(response.statusCode)
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to send email via SendGrid: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_SEND_ERROR',
        undefined,
        'sendgrid',
        true
      );
    }
  }

  async sendBulkEmail(params: SendBulkEmailParams): Promise<SendBulkEmailResult> {
    try {
      const results: SendEmailResult[] = [];
      const batchSize = params.batchSize || 100;
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
        `Failed to send bulk email via SendGrid: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_BULK_SEND_ERROR',
        undefined,
        'sendgrid',
        true
      );
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      // SendGrid doesn't provide direct delivery status API
      // This would typically be handled via webhooks
      return {
        messageId,
        status: 'sent',
        timestamp: new Date(),
        reason: 'Status not available via API'
      };
    } catch (error) {
      throw new EmailServiceError(
        `Failed to get delivery status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_STATUS_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async createTemplate(template: ServiceEmailTemplate): Promise<EmailTemplateResult> {
    try {
      const payload = {
        name: template.name,
        generation: 'dynamic',
        subject: template.subject,
        html_content: template.htmlContent,
        plain_content: template.textContent
      };
      
      const response = await this.makeRequest('/templates', 'POST', payload);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          template: {
            ...template,
            id: response.body.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid template creation error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_TEMPLATE_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_TEMPLATE_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async updateTemplate(templateId: string, template: Partial<ServiceEmailTemplate>): Promise<EmailTemplateResult> {
    try {
      const payload: any = {};
      if (template.name) payload.name = template.name;
      if (template.subject) payload.subject = template.subject;
      if (template.htmlContent) payload.html_content = template.htmlContent;
      if (template.textContent) payload.plain_content = template.textContent;
      
      const response = await this.makeRequest(`/templates/${templateId}`, 'PATCH', payload);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          template: {
            ...template,
            id: templateId,
            updatedAt: new Date()
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid template update error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_TEMPLATE_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_TEMPLATE_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/templates/${templateId}`, 'DELETE');
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (error) {
      throw new EmailServiceError(
        `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_TEMPLATE_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async getTemplate(templateId: string): Promise<EmailTemplateResult> {
    try {
      const response = await this.makeRequest(`/templates/${templateId}`, 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const template = response.body;
        return {
          success: true,
          template: {
            id: template.id,
            name: template.name,
            subject: template.subject,
            htmlContent: template.html_content,
            textContent: template.plain_content,
            createdAt: new Date(template.created_at),
            updatedAt: new Date(template.updated_at)
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid template retrieval error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_TEMPLATE_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_TEMPLATE_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async listTemplates(): Promise<EmailTemplateResult[]> {
    try {
      const response = await this.makeRequest('/templates', 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.body.templates.map((template: any) => ({
          success: true,
          template: {
            id: template.id,
            name: template.name,
            subject: template.subject,
            htmlContent: template.html_content,
            textContent: template.plain_content,
            createdAt: new Date(template.created_at),
            updatedAt: new Date(template.updated_at)
          }
        }));
      } else {
        throw new EmailServiceError(
          `SendGrid template list error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_TEMPLATE_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_TEMPLATE_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async createContact(contact: ContactData): Promise<ContactResult> {
    try {
      const payload = {
        contacts: [{
          email: contact.email,
          first_name: contact.firstName,
          last_name: contact.lastName,
          custom_fields: contact.customFields,
          tags: contact.tags
        }]
      };
      
      const response = await this.makeRequest('/marketing/contacts', 'PUT', payload);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          contact: {
            ...contact,
            id: response.body.persisted_recipients?.[0] || this.generateMessageId()
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid contact creation error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_CONTACT_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_CONTACT_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async updateContact(contactId: string, contact: Partial<ContactData>): Promise<ContactResult> {
    // SendGrid doesn't support direct contact updates via API
    // This would typically be handled via contact management
    throw new EmailServiceError(
      'Contact updates not supported via SendGrid API',
      'SENDGRID_CONTACT_ERROR',
      undefined,
      'sendgrid'
    );
  }

  async deleteContact(contactId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/marketing/contacts/${contactId}`, 'DELETE');
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (error) {
      throw new EmailServiceError(
        `Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_CONTACT_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async getContact(contactId: string): Promise<ContactResult> {
    try {
      const response = await this.makeRequest(`/marketing/contacts/${contactId}`, 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const contact = response.body;
        return {
          success: true,
          contact: {
            id: contact.id,
            email: contact.email,
            firstName: contact.first_name,
            lastName: contact.last_name,
            customFields: contact.custom_fields,
            tags: contact.tags,
            createdAt: new Date(contact.created_at),
            updatedAt: new Date(contact.updated_at)
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid contact retrieval error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_CONTACT_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to get contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_CONTACT_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async listContacts(): Promise<ContactResult[]> {
    try {
      const response = await this.makeRequest('/marketing/contacts', 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.body.contacts.map((contact: any) => ({
          success: true,
          contact: {
            id: contact.id,
            email: contact.email,
            firstName: contact.first_name,
            lastName: contact.last_name,
            customFields: contact.custom_fields,
            tags: contact.tags,
            createdAt: new Date(contact.created_at),
            updatedAt: new Date(contact.updated_at)
          }
        }));
      } else {
        throw new EmailServiceError(
          `SendGrid contact list error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_CONTACT_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to list contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_CONTACT_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async createWebhook(webhook: WebhookConfig): Promise<WebhookResult> {
    try {
      const payload = {
        url: webhook.url,
        events: webhook.events,
        enabled: webhook.isActive !== false
      };
      
      const response = await this.makeRequest('/webhooks/event', 'POST', payload);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          webhook: {
            ...webhook,
            id: response.body.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid webhook creation error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_WEBHOOK_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_WEBHOOK_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async updateWebhook(webhookId: string, webhook: Partial<WebhookConfig>): Promise<WebhookResult> {
    try {
      const payload: any = {};
      if (webhook.url) payload.url = webhook.url;
      if (webhook.events) payload.events = webhook.events;
      if (webhook.isActive !== undefined) payload.enabled = webhook.isActive;
      
      const response = await this.makeRequest(`/webhooks/event/${webhookId}`, 'PATCH', payload);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          webhook: {
            ...webhook,
            id: webhookId,
            updatedAt: new Date()
          }
        };
      } else {
        throw new EmailServiceError(
          `SendGrid webhook update error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_WEBHOOK_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to update webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_WEBHOOK_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/webhooks/event/${webhookId}`, 'DELETE');
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (error) {
      throw new EmailServiceError(
        `Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_WEBHOOK_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async listWebhooks(): Promise<WebhookResult[]> {
    try {
      const response = await this.makeRequest('/webhooks/event', 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.body.webhooks.map((webhook: any) => ({
          success: true,
          webhook: {
            id: webhook.id,
            url: webhook.url,
            events: webhook.events,
            isActive: webhook.enabled,
            createdAt: new Date(webhook.created_at),
            updatedAt: new Date(webhook.updated_at)
          }
        }));
      } else {
        throw new EmailServiceError(
          `SendGrid webhook list error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_WEBHOOK_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error;
      }
      throw new EmailServiceError(
        `Failed to list webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_WEBHOOK_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/user/account', 'GET');
      const responseTime = Date.now() - startTime;
      
      this.isHealthy = response.statusCode >= 200 && response.statusCode < 300;
      this.lastHealthCheck = new Date();
      
      return {
        isHealthy: this.isHealthy,
        status: this.isHealthy ? 'operational' : 'down',
        message: this.isHealthy ? 'Service is operational' : 'Service is down',
        lastChecked: this.lastHealthCheck,
        responseTime,
        details: {
          statusCode: response.statusCode,
          provider: 'sendgrid'
        }
      };
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      
      return {
        isHealthy: false,
        status: 'down',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: this.lastHealthCheck,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: 'sendgrid'
        }
      };
    }
  }

  async getMetrics(): Promise<ServiceMetrics> {
    try {
      const response = await this.makeRequest('/stats', 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const stats = response.body.stats[0] || {};
        return {
          totalEmailsSent: stats.blocks + stats.bounces + stats.deferred + stats.delivered + stats.drops + stats.opens + stats.processed + stats.requests + stats.spam_reports + stats.unsubscribes,
          totalEmailsDelivered: stats.delivered || 0,
          totalEmailsBounced: stats.bounces || 0,
          totalEmailsDropped: stats.drops || 0,
          averageDeliveryTime: 0, // Not available in SendGrid stats
          successRate: stats.delivered && stats.requests ? (stats.delivered / stats.requests) * 100 : 0,
          lastUpdated: new Date()
        };
      } else {
        throw new EmailServiceError(
          `SendGrid metrics error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_METRICS_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      throw new EmailServiceError(
        `Failed to get metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_METRICS_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  async getRateLimits(): Promise<RateLimits> {
    try {
      const response = await this.makeRequest('/user/account', 'GET');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const account = response.body;
        return {
          dailyLimit: account.daily_limit || 0,
          hourlyLimit: account.hourly_limit || 0,
          perSecondLimit: account.per_second_limit || 0,
          remainingDaily: account.remaining_daily || 0,
          remainingHourly: account.remaining_hourly || 0,
          resetTime: new Date(account.reset_time || Date.now() + 24 * 60 * 60 * 1000)
        };
      } else {
        throw new EmailServiceError(
          `SendGrid rate limits error: ${response.body?.message || 'Unknown error'}`,
          'SENDGRID_RATE_LIMITS_ERROR',
          response.statusCode,
          'sendgrid'
        );
      }
    } catch (error) {
      throw new EmailServiceError(
        `Failed to get rate limits: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SENDGRID_RATE_LIMITS_ERROR',
        undefined,
        'sendgrid'
      );
    }
  }

  private buildSendGridPayload(params: SendEmailParams): any {
    const payload: any = {
      personalizations: [{
        to: Array.isArray(params.to) ? params.to.map(email => ({ email })) : [{ email: params.to }],
        subject: params.subject
      }],
      from: { email: params.from, name: this.config.fromName },
      content: []
    };

    if (params.replyTo) {
      payload.reply_to = { email: params.replyTo };
    }

    if (params.cc) {
      payload.personalizations[0].cc = Array.isArray(params.cc) 
        ? params.cc.map(email => ({ email })) 
        : [{ email: params.cc }];
    }

    if (params.bcc) {
      payload.personalizations[0].bcc = Array.isArray(params.bcc) 
        ? params.bcc.map(email => ({ email })) 
        : [{ email: params.bcc }];
    }

    if (params.htmlContent) {
      payload.content.push({
        type: 'text/html',
        value: params.htmlContent
      });
    }

    if (params.textContent) {
      payload.content.push({
        type: 'text/plain',
        value: params.textContent
      });
    }

    if (params.templateId) {
      payload.template_id = params.templateId;
      if (params.templateData) {
        payload.personalizations[0].dynamic_template_data = params.templateData;
      }
    }

    if (params.attachments && params.attachments.length > 0) {
      payload.attachments = params.attachments.map(attachment => ({
        content: attachment.content,
        type: attachment.type,
        filename: attachment.filename,
        disposition: attachment.disposition || 'attachment',
        content_id: attachment.cid
      }));
    }

    if (params.headers) {
      payload.headers = params.headers;
    }

    if (params.tags) {
      payload.categories = params.tags;
    }

    if (params.metadata) {
      payload.custom_args = params.metadata;
    }

    return payload;
  }

  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(url, options);
    const responseBody = await response.json();

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody
    };
  }

  private async checkRateLimit(): Promise<void> {
    const now = new Date();
    const key = 'sendgrid_api';
    const cached = this.rateLimitCache.get(key);
    
    if (cached && cached.resetTime > now) {
      if (cached.count >= 100) { // Assuming 100 requests per minute limit
        throw new EmailServiceError(
          'Rate limit exceeded',
          'RATE_LIMITED',
          429,
          'sendgrid',
          true
        );
      }
      cached.count++;
    } else {
      this.rateLimitCache.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + 60000) // Reset in 1 minute
      });
    }
  }

  private isRetryableError(statusCode: number): boolean {
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  private generateMessageId(): string {
    return `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
