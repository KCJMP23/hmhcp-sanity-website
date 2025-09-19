// Email Webhook Handler
// Created: 2025-01-27
// Purpose: Process email service webhooks and update analytics

import { EmailServiceError } from './EmailServiceProvider';

export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: Date;
  email: string;
  messageId: string;
  campaignId?: string;
  templateId?: string;
  provider: string;
  data: Record<string, any>;
  processed: boolean;
  createdAt: Date;
}

export interface WebhookProcessor {
  canProcess(event: WebhookEvent): boolean;
  process(event: WebhookEvent): Promise<void>;
}

export class WebhookHandler {
  private static instance: WebhookHandler;
  private processors: WebhookProcessor[] = [];
  private eventQueue: WebhookEvent[] = [];
  private isProcessing = false;

  private constructor() {
    // Register default processors
    this.registerProcessor(new DeliveryEventProcessor());
    this.registerProcessor(new BounceEventProcessor());
    this.registerProcessor(new OpenEventProcessor());
    this.registerProcessor(new ClickEventProcessor());
    this.registerProcessor(new UnsubscribeEventProcessor());
    this.registerProcessor(new SpamReportEventProcessor());
  }

  static getInstance(): WebhookHandler {
    if (!WebhookHandler.instance) {
      WebhookHandler.instance = new WebhookHandler();
    }
    return WebhookHandler.instance;
  }

  registerProcessor(processor: WebhookProcessor): void {
    this.processors.push(processor);
  }

  async processWebhook(
    provider: string,
    payload: any,
    signature?: string
  ): Promise<{ processed: number; errors: number }> {
    try {
      // Validate webhook signature if provided
      if (signature && !this.validateSignature(provider, payload, signature)) {
        throw new EmailServiceError(
          'Invalid webhook signature',
          'INVALID_SIGNATURE',
          401,
          provider
        );
      }

      // Parse events from payload
      const events = this.parseWebhookPayload(provider, payload);
      
      // Add events to queue
      this.eventQueue.push(...events);
      
      // Process events asynchronously
      this.processEventQueue();
      
      return {
        processed: events.length,
        errors: 0
      };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return {
        processed: 0,
        errors: 1
      };
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) break;

        await this.processEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      // Find processors that can handle this event
      const applicableProcessors = this.processors.filter(processor => 
        processor.canProcess(event)
      );

      if (applicableProcessors.length === 0) {
        console.warn(`No processor found for event: ${event.event}`);
        return;
      }

      // Process with all applicable processors
      await Promise.all(
        applicableProcessors.map(processor => processor.process(event))
      );

      event.processed = true;
    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error);
      // Event remains unprocessed and can be retried later
    }
  }

  private parseWebhookPayload(provider: string, payload: any): WebhookEvent[] {
    switch (provider) {
      case 'sendgrid':
        return this.parseSendGridPayload(payload);
      case 'mailchimp':
        return this.parseMailchimpPayload(payload);
      case 'ses':
        return this.parseSESPayload(payload);
      default:
        throw new EmailServiceError(
          `Unknown webhook provider: ${provider}`,
          'UNKNOWN_PROVIDER',
          undefined,
          provider
        );
    }
  }

  private parseSendGridPayload(payload: any): WebhookEvent[] {
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.map((event: any) => ({
      id: event.sg_event_id || this.generateEventId(),
      event: event.event,
      timestamp: new Date(event.timestamp * 1000),
      email: event.email,
      messageId: event.sg_message_id,
      campaignId: event.category?.[0], // SendGrid uses categories for campaign tracking
      templateId: event.template_id,
      provider: 'sendgrid',
      data: event,
      processed: false,
      createdAt: new Date()
    }));
  }

  private parseMailchimpPayload(payload: any): WebhookEvent[] {
    // Mailchimp webhook format
    const events: WebhookEvent[] = [];
    
    if (payload.type === 'unsubscribe') {
      events.push({
        id: this.generateEventId(),
        event: 'unsubscribe',
        timestamp: new Date(payload.fired_at),
        email: payload.data.email,
        messageId: payload.data.id,
        campaignId: payload.data.campaign_id,
        provider: 'mailchimp',
        data: payload,
        processed: false,
        createdAt: new Date()
      });
    }
    
    return events;
  }

  private parseSESPayload(payload: any): WebhookEvent[] {
    // AWS SES webhook format
    const events: WebhookEvent[] = [];
    
    if (payload.eventType) {
      events.push({
        id: this.generateEventId(),
        event: payload.eventType,
        timestamp: new Date(payload.mail.timestamp),
        email: payload.mail.destination[0],
        messageId: payload.mail.messageId,
        provider: 'ses',
        data: payload,
        processed: false,
        createdAt: new Date()
      });
    }
    
    return events;
  }

  private validateSignature(provider: string, payload: any, signature: string): boolean {
    // In a real implementation, this would validate the webhook signature
    // using the provider's secret key
    switch (provider) {
      case 'sendgrid':
        return this.validateSendGridSignature(payload, signature);
      case 'mailchimp':
        return this.validateMailchimpSignature(payload, signature);
      case 'ses':
        return this.validateSESSignature(payload, signature);
      default:
        return false;
    }
  }

  private validateSendGridSignature(payload: any, signature: string): boolean {
    // SendGrid signature validation would go here
    // This is a simplified version
    return true;
  }

  private validateMailchimpSignature(payload: any, signature: string): boolean {
    // Mailchimp signature validation would go here
    return true;
  }

  private validateSESSignature(payload: any, signature: string): boolean {
    // AWS SES signature validation would go here
    return true;
  }

  private generateEventId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEventQueue(): WebhookEvent[] {
    return [...this.eventQueue];
  }

  getProcessedEvents(): WebhookEvent[] {
    return this.eventQueue.filter(event => event.processed);
  }

  getUnprocessedEvents(): WebhookEvent[] {
    return this.eventQueue.filter(event => !event.processed);
  }

  clearProcessedEvents(): void {
    this.eventQueue = this.eventQueue.filter(event => !event.processed);
  }
}

// Default event processors
class DeliveryEventProcessor implements WebhookProcessor {
  canProcess(event: WebhookEvent): boolean {
    return event.event === 'delivered';
  }

  async process(event: WebhookEvent): Promise<void> {
    // Update delivery status in database
    console.log(`Processing delivery event for ${event.email}: ${event.messageId}`);
    // TODO: Update database with delivery status
  }
}

class BounceEventProcessor implements WebhookProcessor {
  canProcess(event: WebhookEvent): boolean {
    return event.event === 'bounce' || event.event === 'blocked';
  }

  async process(event: WebhookEvent): Promise<void> {
    // Update bounce status in database
    console.log(`Processing bounce event for ${event.email}: ${event.messageId}`);
    // TODO: Update database with bounce status
  }
}

class OpenEventProcessor implements WebhookProcessor {
  canProcess(event: WebhookEvent): boolean {
    return event.event === 'open';
  }

  async process(event: WebhookEvent): Promise<void> {
    // Update open tracking in database
    console.log(`Processing open event for ${event.email}: ${event.messageId}`);
    // TODO: Update database with open tracking
  }
}

class ClickEventProcessor implements WebhookProcessor {
  canProcess(event: WebhookEvent): boolean {
    return event.event === 'click';
  }

  async process(event: WebhookEvent): Promise<void> {
    // Update click tracking in database
    console.log(`Processing click event for ${event.email}: ${event.messageId}`);
    // TODO: Update database with click tracking
  }
}

class UnsubscribeEventProcessor implements WebhookProcessor {
  canProcess(event: WebhookEvent): boolean {
    return event.event === 'unsubscribe' || event.event === 'group_unsubscribe';
  }

  async process(event: WebhookEvent): Promise<void> {
    // Update unsubscribe status in database
    console.log(`Processing unsubscribe event for ${event.email}: ${event.messageId}`);
    // TODO: Update database with unsubscribe status
  }
}

class SpamReportEventProcessor implements WebhookProcessor {
  canProcess(event: WebhookEvent): boolean {
    return event.event === 'spam_report';
  }

  async process(event: WebhookEvent): Promise<void> {
    // Update spam report status in database
    console.log(`Processing spam report event for ${event.email}: ${event.messageId}`);
    // TODO: Update database with spam report status
  }
}

// Export singleton instance
export const webhookHandler = WebhookHandler.getInstance();
