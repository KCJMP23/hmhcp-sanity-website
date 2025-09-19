import { Webhook, WebhookEvent, WebhookDelivery, WebhookConfig } from '@/types/plugins/webhooks';

export class WebhookManager {
  private webhooks: Map<string, Webhook> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private deliveryHistory: Map<string, WebhookDelivery[]> = new Map();
  private config: WebhookManagerConfig;

  constructor(config: WebhookManagerConfig) {
    this.config = config;
    this.startEventProcessor();
  }

  async registerWebhook(webhookConfig: WebhookConfig): Promise<Webhook> {
    const webhook: Webhook = {
      id: this.generateWebhookId(),
      event: webhookConfig.event,
      url: webhookConfig.url,
      headers: webhookConfig.headers || {},
      retryPolicy: webhookConfig.retryPolicy || {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastTriggered: null,
      successCount: 0,
      failureCount: 0,
      successRate: 0
    };

    this.webhooks.set(webhook.id, webhook);
    
    // Log webhook registration
    await this.logWebhookEvent('registered', webhook.id, {
      event: webhook.event,
      url: webhook.url
    });

    return webhook;
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    this.webhooks.delete(webhookId);
    
    // Log webhook unregistration
    await this.logWebhookEvent('unregistered', webhookId, {
      event: webhook.event,
      url: webhook.url
    });
  }

  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<Webhook> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const updatedWebhook: Webhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date()
    };

    this.webhooks.set(webhookId, updatedWebhook);
    
    // Log webhook update
    await this.logWebhookEvent('updated', webhookId, updates);

    return updatedWebhook;
  }

  async triggerWebhook(event: WebhookEvent): Promise<void> {
    // Find webhooks that match the event
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      webhook => webhook.status === 'active' && this.matchesEvent(webhook.event, event.type)
    );

    if (matchingWebhooks.length === 0) {
      console.log(`No webhooks found for event: ${event.type}`);
      return;
    }

    // Add event to queue for processing
    this.eventQueue.push(event);

    // Process webhooks for this event
    for (const webhook of matchingWebhooks) {
      await this.deliverWebhook(webhook, event);
    }
  }

  private async deliverWebhook(webhook: Webhook, event: WebhookEvent): Promise<void> {
    const deliveryId = this.generateDeliveryId();
    const startTime = Date.now();

    try {
      // Prepare webhook payload
      const payload = this.preparePayload(event, webhook);
      
      // Make HTTP request
      const response = await this.makeWebhookRequest(webhook, payload);
      
      const delivery: WebhookDelivery = {
        id: deliveryId,
        webhookId: webhook.id,
        eventId: event.id,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        requestPayload: payload,
        responseBody: await response.text(),
        retryCount: 0
      };

      // Store delivery record
      this.storeDeliveryRecord(delivery);

      // Update webhook statistics
      await this.updateWebhookStats(webhook.id, delivery.status === 'success');

      // Log delivery
      await this.logWebhookEvent('delivered', webhook.id, {
        eventType: event.type,
        status: delivery.status,
        responseTime: delivery.responseTime
      });

    } catch (error) {
      const delivery: WebhookDelivery = {
        id: deliveryId,
        webhookId: webhook.id,
        eventId: event.id,
        status: 'failed',
        statusCode: 0,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        requestPayload: this.preparePayload(event, webhook),
        responseBody: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.storeDeliveryRecord(delivery);
      await this.updateWebhookStats(webhook.id, false);

      // Retry if configured
      if (webhook.retryPolicy && webhook.retryPolicy.maxRetries > 0) {
        await this.scheduleRetry(webhook, event, delivery);
      }
    }
  }

  private async makeWebhookRequest(webhook: Webhook, payload: any): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HMHCP-Webhook/1.0',
          'X-Webhook-Event': webhook.event,
          'X-Webhook-Signature': await this.generateSignature(payload, webhook),
          ...webhook.headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private preparePayload(event: WebhookEvent, webhook: Webhook): any {
    return {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      webhook: {
        id: webhook.id,
        event: webhook.event
      }
    };
  }

  private async generateSignature(payload: any, webhook: Webhook): Promise<string> {
    // In a real implementation, this would use HMAC-SHA256 with a secret key
    const secret = this.config.secretKey;
    const payloadString = JSON.stringify(payload);
    
    // Simulate HMAC generation
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadString));
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `sha256=${hashHex}`;
  }

  private async scheduleRetry(webhook: Webhook, event: WebhookEvent, failedDelivery: WebhookDelivery): Promise<void> {
    const retryCount = failedDelivery.retryCount + 1;
    
    if (retryCount > webhook.retryPolicy!.maxRetries) {
      console.log(`Max retries exceeded for webhook ${webhook.id}`);
      return;
    }

    const delay = webhook.retryPolicy!.initialDelay * Math.pow(webhook.retryPolicy!.backoffMultiplier, retryCount - 1);
    
    setTimeout(async () => {
      try {
        await this.deliverWebhook(webhook, event);
      } catch (error) {
        console.error(`Retry failed for webhook ${webhook.id}:`, error);
      }
    }, delay);
  }

  private matchesEvent(webhookEvent: string, eventType: string): boolean {
    // Support wildcard matching
    if (webhookEvent === '*') return true;
    if (webhookEvent === eventType) return true;
    
    // Support pattern matching (e.g., 'patient.*' matches 'patient.created', 'patient.updated')
    if (webhookEvent.endsWith('.*')) {
      const prefix = webhookEvent.slice(0, -2);
      return eventType.startsWith(prefix + '.');
    }
    
    return false;
  }

  private startEventProcessor(): void {
    // Process events from the queue
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          this.processEvent(event);
        }
      }
    }, 100);
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    // Process the event and trigger matching webhooks
    await this.triggerWebhook(event);
  }

  private storeDeliveryRecord(delivery: WebhookDelivery): void {
    const webhookDeliveries = this.deliveryHistory.get(delivery.webhookId) || [];
    webhookDeliveries.push(delivery);
    
    // Keep only last 100 deliveries per webhook
    if (webhookDeliveries.length > 100) {
      webhookDeliveries.splice(0, webhookDeliveries.length - 100);
    }
    
    this.deliveryHistory.set(delivery.webhookId, webhookDeliveries);
  }

  private async updateWebhookStats(webhookId: string, success: boolean): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return;

    if (success) {
      webhook.successCount++;
    } else {
      webhook.failureCount++;
    }

    const total = webhook.successCount + webhook.failureCount;
    webhook.successRate = total > 0 ? (webhook.successCount / total) * 100 : 0;
    webhook.lastTriggered = new Date();

    this.webhooks.set(webhookId, webhook);
  }

  private async logWebhookEvent(action: string, webhookId: string, details: any): Promise<void> {
    // In a real implementation, this would log to a proper logging system
    console.log(`Webhook ${action}:`, {
      webhookId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeliveryId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for querying webhooks
  getWebhook(webhookId: string): Webhook | undefined {
    return this.webhooks.get(webhookId);
  }

  getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  getWebhooksByEvent(eventType: string): Webhook[] {
    return Array.from(this.webhooks.values()).filter(
      webhook => webhook.status === 'active' && this.matchesEvent(webhook.event, eventType)
    );
  }

  getDeliveryHistory(webhookId: string): WebhookDelivery[] {
    return this.deliveryHistory.get(webhookId) || [];
  }

  getWebhookStats(webhookId: string): WebhookStats | undefined {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return undefined;

    const deliveries = this.getDeliveryHistory(webhookId);
    const recentDeliveries = deliveries.filter(
      d => d.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    return {
      webhookId,
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter(d => d.status === 'success').length,
      failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
      successRate: webhook.successRate,
      averageResponseTime: deliveries.length > 0 
        ? deliveries.reduce((sum, d) => sum + d.responseTime, 0) / deliveries.length 
        : 0,
      recentDeliveries: recentDeliveries.length,
      lastTriggered: webhook.lastTriggered
    };
  }

  // Health check methods
  async healthCheck(): Promise<WebhookHealthStatus> {
    const activeWebhooks = Array.from(this.webhooks.values()).filter(w => w.status === 'active');
    const totalDeliveries = Array.from(this.deliveryHistory.values())
      .flat()
      .length;
    
    const recentFailures = Array.from(this.deliveryHistory.values())
      .flat()
      .filter(d => d.timestamp > new Date(Date.now() - 60 * 60 * 1000) && d.status === 'failed')
      .length;

    return {
      status: recentFailures > 10 ? 'degraded' : 'healthy',
      activeWebhooks: activeWebhooks.length,
      totalWebhooks: this.webhooks.size,
      totalDeliveries,
      recentFailures,
      queueSize: this.eventQueue.length,
      timestamp: new Date()
    };
  }
}

interface WebhookManagerConfig {
  timeout: number;
  secretKey: string;
  maxQueueSize: number;
  retryDelay: number;
}

interface WebhookStats {
  webhookId: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageResponseTime: number;
  recentDeliveries: number;
  lastTriggered: Date | null;
}

interface WebhookHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  activeWebhooks: number;
  totalWebhooks: number;
  totalDeliveries: number;
  recentFailures: number;
  queueSize: number;
  timestamp: Date;
}
