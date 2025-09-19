/**
 * Webhook Management System
 * 
 * Manages webhook endpoints for real-time event handling and integration
 * with healthcare compliance and security validation.
 */

import { HealthcareComplianceLevel } from '../types/healthcare-types';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  authentication: WebhookAuthentication;
  retryPolicy: RetryPolicy;
  validation: WebhookValidation;
  status: 'active' | 'inactive' | 'error' | 'testing';
  organizationId: string;
  pluginId?: string;
  complianceLevel: HealthcareComplianceLevel;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

export interface WebhookAuthentication {
  type: 'none' | 'api_key' | 'jwt' | 'oauth2' | 'hmac';
  credentials: Record<string, any>;
  headers?: Record<string, string>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  retryableStatusCodes: number[];
}

export interface WebhookValidation {
  signatureValidation: boolean;
  payloadValidation: boolean;
  schema?: any;
  customValidation?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  organizationId: string;
  pluginId?: string;
  metadata: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastAttemptAt?: Date;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface WebhookManagerConfig {
  maxConcurrentDeliveries: number;
  defaultRetryPolicy: RetryPolicy;
  healthCheckInterval: number;
  complianceValidation: boolean;
  auditLogging: boolean;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private config: WebhookManagerConfig;
  private isRunning: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: WebhookManagerConfig) {
    this.config = config;
  }

  /**
   * Start the webhook manager
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startHealthChecks();
    console.log('Webhook Manager started');
  }

  /**
   * Stop the webhook manager
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    console.log('Webhook Manager stopped');
  }

  /**
   * Register a new webhook endpoint
   */
  async registerWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'successCount' | 'failureCount'>): Promise<string> {
    const webhookId = this.generateId();
    const now = new Date();
    
    const fullWebhook: WebhookEndpoint = {
      ...webhook,
      id: webhookId,
      createdAt: now,
      updatedAt: now,
      successCount: 0,
      failureCount: 0
    };

    // Validate webhook configuration
    const validation = await this.validateWebhook(fullWebhook);
    if (!validation.valid) {
      throw new Error(`Webhook validation failed: ${validation.errors.join(', ')}`);
    }

    this.webhooks.set(webhookId, fullWebhook);
    
    // Audit log
    if (this.config.auditLogging) {
      await this.logWebhookAction('register', webhookId, {
        organizationId: webhook.organizationId,
        pluginId: webhook.pluginId,
        events: webhook.events
      });
    }

    return webhookId;
  }

  /**
   * Update an existing webhook endpoint
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookEndpoint>): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated webhook
    const validation = await this.validateWebhook(updatedWebhook);
    if (!validation.valid) {
      throw new Error(`Webhook validation failed: ${validation.errors.join(', ')}`);
    }

    this.webhooks.set(webhookId, updatedWebhook);

    // Audit log
    if (this.config.auditLogging) {
      await this.logWebhookAction('update', webhookId, updates);
    }

    return true;
  }

  /**
   * Delete a webhook endpoint
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    this.webhooks.delete(webhookId);

    // Audit log
    if (this.config.auditLogging) {
      await this.logWebhookAction('delete', webhookId, {
        organizationId: webhook.organizationId,
        pluginId: webhook.pluginId
      });
    }

    return true;
  }

  /**
   * Trigger webhook delivery for an event
   */
  async triggerWebhook(event: WebhookEvent): Promise<void> {
    const relevantWebhooks = this.getWebhooksForEvent(event);
    
    for (const webhook of relevantWebhooks) {
      if (webhook.status !== 'active') continue;
      
      const delivery = await this.createDelivery(webhook, event);
      this.deliveries.set(delivery.id, delivery);
      
      // Process delivery asynchronously
      this.processDelivery(delivery).catch(error => {
        console.error(`Webhook delivery failed for ${webhook.id}:`, error);
      });
    }
  }

  /**
   * Get webhook endpoints for an event
   */
  private getWebhooksForEvent(event: WebhookEvent): WebhookEndpoint[] {
    return Array.from(this.webhooks.values()).filter(webhook => 
      webhook.status === 'active' &&
      webhook.organizationId === event.organizationId &&
      (webhook.pluginId === event.pluginId || !webhook.pluginId) &&
      webhook.events.includes(event.type)
    );
  }

  /**
   * Create a webhook delivery
   */
  private async createDelivery(webhook: WebhookEndpoint, event: WebhookEvent): Promise<WebhookDelivery> {
    const deliveryId = this.generateId();
    
    return {
      id: deliveryId,
      webhookId: webhook.id,
      eventId: event.id,
      status: 'pending',
      attempts: 0,
      maxAttempts: webhook.retryPolicy.maxAttempts,
      createdAt: new Date()
    };
  }

  /**
   * Process webhook delivery
   */
  private async processDelivery(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook) {
      console.error(`Webhook not found for delivery ${delivery.id}`);
      return;
    }

    const event = await this.getEvent(delivery.eventId);
    if (!event) {
      console.error(`Event not found for delivery ${delivery.id}`);
      return;
    }

    try {
      delivery.attempts++;
      delivery.lastAttemptAt = new Date();
      delivery.status = 'retrying';

      // Prepare webhook payload
      const payload = this.preparePayload(webhook, event);
      
      // Prepare headers
      const headers = this.prepareHeaders(webhook, payload);
      
      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        delivery.status = 'delivered';
        delivery.completedAt = new Date();
        webhook.successCount++;
        webhook.lastTriggered = new Date();
        
        // Audit log
        if (this.config.auditLogging) {
          await this.logWebhookAction('delivery_success', webhook.id, {
            deliveryId: delivery.id,
            eventId: event.id,
            responseStatus: response.status
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      delivery.status = 'failed';
      webhook.failureCount++;
      
      // Check if we should retry
      if (delivery.attempts < delivery.maxAttempts) {
        const retryDelay = this.calculateRetryDelay(webhook.retryPolicy, delivery.attempts);
        delivery.nextRetryAt = new Date(Date.now() + retryDelay);
        delivery.status = 'retrying';
        
        // Schedule retry
        setTimeout(() => {
          this.processDelivery(delivery).catch(console.error);
        }, retryDelay);
      } else {
        delivery.completedAt = new Date();
        delivery.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Audit log
        if (this.config.auditLogging) {
          await this.logWebhookAction('delivery_failed', webhook.id, {
            deliveryId: delivery.id,
            eventId: event.id,
            error: delivery.errorMessage,
            attempts: delivery.attempts
          });
        }
      }
    }

    this.deliveries.set(delivery.id, delivery);
    this.webhooks.set(webhook.id, webhook);
  }

  /**
   * Prepare webhook payload
   */
  private preparePayload(webhook: WebhookEndpoint, event: WebhookEvent): Record<string, any> {
    const payload = {
      id: event.id,
      type: event.type,
      source: event.source,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      organizationId: event.organizationId,
      pluginId: event.pluginId,
      metadata: event.metadata
    };

    // Add webhook-specific metadata
    if (webhook.complianceLevel !== 'standard') {
      payload['complianceLevel'] = webhook.complianceLevel;
      payload['auditRequired'] = true;
    }

    return payload;
  }

  /**
   * Prepare webhook headers
   */
  private prepareHeaders(webhook: WebhookEndpoint, payload: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'HMHCP-WebhookManager/1.0',
      'X-Webhook-Id': webhook.id,
      'X-Webhook-Event': payload.type,
      'X-Webhook-Timestamp': payload.timestamp
    };

    // Add authentication headers
    if (webhook.authentication.type !== 'none') {
      switch (webhook.authentication.type) {
        case 'api_key':
          headers['X-API-Key'] = webhook.authentication.credentials.apiKey;
          break;
        case 'jwt':
          headers['Authorization'] = `Bearer ${webhook.authentication.credentials.token}`;
          break;
        case 'hmac':
          const signature = this.generateHMACSignature(payload, webhook.authentication.credentials.secret);
          headers['X-Webhook-Signature'] = signature;
          break;
      }
    }

    // Add custom headers
    if (webhook.authentication.headers) {
      Object.assign(headers, webhook.authentication.headers);
    }

    return headers;
  }

  /**
   * Calculate retry delay based on policy
   */
  private calculateRetryDelay(policy: RetryPolicy, attempt: number): number {
    switch (policy.backoffStrategy) {
      case 'linear':
        return Math.min(policy.initialDelay * attempt, policy.maxDelay);
      case 'exponential':
        return Math.min(policy.initialDelay * Math.pow(2, attempt - 1), policy.maxDelay);
      case 'fixed':
        return policy.initialDelay;
      default:
        return policy.initialDelay;
    }
  }

  /**
   * Generate HMAC signature for webhook validation
   */
  private generateHMACSignature(payload: Record<string, any>, secret: string): string {
    // In a real implementation, this would use crypto.createHmac
    const payloadString = JSON.stringify(payload);
    return `sha256=${Buffer.from(payloadString + secret).toString('base64')}`;
  }

  /**
   * Validate webhook configuration
   */
  private async validateWebhook(webhook: WebhookEndpoint): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!webhook.url || !this.isValidUrl(webhook.url)) {
      errors.push('Invalid webhook URL');
    }

    if (!webhook.events || webhook.events.length === 0) {
      errors.push('At least one event type must be specified');
    }

    if (webhook.authentication.type === 'api_key' && !webhook.authentication.credentials.apiKey) {
      errors.push('API key is required for api_key authentication');
    }

    if (webhook.authentication.type === 'jwt' && !webhook.authentication.credentials.token) {
      errors.push('JWT token is required for jwt authentication');
    }

    if (webhook.authentication.type === 'hmac' && !webhook.authentication.credentials.secret) {
      errors.push('Secret is required for HMAC authentication');
    }

    // Healthcare compliance validation
    if (this.config.complianceValidation && webhook.complianceLevel === 'enterprise') {
      if (!webhook.validation.signatureValidation) {
        errors.push('Signature validation is required for enterprise compliance');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get event by ID (placeholder - would query event store)
   */
  private async getEvent(eventId: string): Promise<WebhookEvent | null> {
    // In a real implementation, this would query the event store
    return null;
  }

  /**
   * Start health checks for webhook endpoints
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on webhook endpoints
   */
  private async performHealthChecks(): Promise<void> {
    for (const webhook of this.webhooks.values()) {
      if (webhook.status !== 'active') continue;
      
      try {
        const response = await fetch(webhook.url, {
          method: 'HEAD',
          timeout: 5000
        });
        
        if (!response.ok) {
          webhook.status = 'error';
        }
      } catch (error) {
        webhook.status = 'error';
        console.error(`Health check failed for webhook ${webhook.id}:`, error);
      }
    }
  }

  /**
   * Log webhook action for audit trail
   */
  private async logWebhookAction(action: string, webhookId: string, metadata: Record<string, any>): Promise<void> {
    // In a real implementation, this would log to an audit system
    console.log(`Webhook ${action}: ${webhookId}`, metadata);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(): {
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
  } {
    const webhooks = Array.from(this.webhooks.values());
    const deliveries = Array.from(this.deliveries.values());
    
    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.status === 'active').length,
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter(d => d.status === 'delivered').length,
      failedDeliveries: deliveries.filter(d => d.status === 'failed').length
    };
  }
}
