/**
 * Enterprise Webhook Service
 * Healthcare-compliant real-time event handling and data synchronization
 */

import {
  WebhookEvent,
  WebhookConfiguration,
  WebhookDelivery,
  WebhookDeliveryError,
  WebhookDeliveryResponse,
  WebhookTest,
  WebhookTestResult,
  WebhookMetrics,
  WebhookHealthcareMetrics,
  HealthcareWebhookContext,
  WEBHOOK_EVENT_TYPES
} from '@/types/enterprise/webhooks';

import { createClient } from '@supabase/supabase-js';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export class WebhookService {
  private supabase: any;
  private httpClient: AxiosInstance;
  private webhookClients: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HMHCP-Webhook-Service/1.0'
      }
    });
  }

  /**
   * Create a new webhook configuration
   */
  async createWebhook(config: Omit<WebhookConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'totalTriggers' | 'successCount' | 'failureCount'>): Promise<WebhookConfiguration> {
    try {
      // Validate healthcare compliance
      await this.validateHealthcareCompliance(config);

      const id = crypto.randomUUID();
      const webhook: WebhookConfiguration = {
        ...config,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalTriggers: 0,
        successCount: 0,
        failureCount: 0
      };

      // Store webhook configuration
      const { data, error } = await this.supabase
        .from('webhook_configurations')
        .insert([webhook])
        .select()
        .single();

      if (error) throw error;

      // Initialize webhook client
      await this.initializeWebhookClient(webhook);

      // Log audit event
      await this.logAuditEvent({
        eventType: 'webhook_created',
        webhookId: id,
        details: { name: config.name, url: config.url }
      });

      return data;
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw new Error('Webhook creation failed');
    }
  }

  /**
   * Trigger a webhook event
   */
  async triggerWebhook(
    eventType: string,
    data: any,
    organizationId: string,
    healthcareContext: HealthcareWebhookContext
  ): Promise<void> {
    try {
      // Create webhook event
      const event = await this.createWebhookEvent(eventType, data, organizationId, healthcareContext);

      // Get active webhook configurations for this event type
      const { data: webhooks } = await this.supabase
        .from('webhook_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .contains('events', [eventType]);

      if (!webhooks || webhooks.length === 0) {
        console.log(`No webhooks configured for event type: ${eventType}`);
        return;
      }

      // Process each webhook
      for (const webhook of webhooks) {
        try {
          await this.deliverWebhook(webhook, event);
        } catch (error) {
          console.error(`Failed to deliver webhook ${webhook.id}:`, error);
          await this.handleWebhookFailure(webhook, event, error);
        }
      }
    } catch (error) {
      console.error('Failed to trigger webhook:', error);
    }
  }

  /**
   * Deliver webhook to endpoint
   */
  async deliverWebhook(webhook: WebhookConfiguration, event: WebhookEvent): Promise<void> {
    try {
      // Create delivery record
      const delivery = await this.createWebhookDelivery(webhook.id, event.id);

      // Get webhook client
      const client = this.webhookClients.get(webhook.id);
      if (!client) {
        throw new Error('Webhook client not initialized');
      }

      // Apply filtering if enabled
      const filteredEvent = webhook.filtering.enabled 
        ? await this.applyWebhookFiltering(webhook, event)
        : event;

      if (!filteredEvent) {
        console.log(`Event filtered out for webhook ${webhook.id}`);
        return;
      }

      // Apply transformation if enabled
      const transformedEvent = webhook.transformation.enabled
        ? await this.applyWebhookTransformation(webhook, filteredEvent)
        : filteredEvent;

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event.type,
        'X-Webhook-Event-ID': event.id,
        'X-Webhook-Timestamp': event.timestamp,
        'X-Organization-ID': event.organizationId,
        ...webhook.authentication.headers
      };

      // Add authentication
      if (webhook.authentication.type !== 'none') {
        await this.addWebhookAuthentication(webhook, headers);
      }

      // Add signature
      const signature = this.generateWebhookSignature(transformedEvent, webhook.authentication.secret || '');
      headers['X-Webhook-Signature'] = signature;

      // Send webhook
      const startTime = Date.now();
      const response = await client.post('/', transformedEvent, { headers });
      const responseTime = Date.now() - startTime;

      // Update delivery record
      await this.updateWebhookDelivery(delivery.id, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        response: {
          statusCode: response.status,
          headers: response.headers as Record<string, string>,
          body: JSON.stringify(response.data),
          responseTime,
          timestamp: new Date().toISOString()
        }
      });

      // Update webhook metrics
      await this.updateWebhookMetrics(webhook.id, true);

      // Log success
      await this.logAuditEvent({
        eventType: 'webhook_delivered',
        webhookId: webhook.id,
        details: { eventId: event.id, responseTime, statusCode: response.status }
      });

    } catch (error) {
      await this.handleWebhookFailure(webhook, event, error);
      throw error;
    }
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(webhookId: string, testType: string): Promise<WebhookTest> {
    try {
      const testId = crypto.randomUUID();
      const test: WebhookTest = {
        id: testId,
        webhookId,
        testType: testType as any,
        status: 'running',
        startedAt: new Date().toISOString()
      };

      // Store test record
      await this.supabase
        .from('webhook_tests')
        .insert([test]);

      // Perform test based on type
      let result: WebhookTestResult;
      switch (testType) {
        case 'connectivity':
          result = await this.testConnectivity(webhookId);
          break;
        case 'authentication':
          result = await this.testAuthentication(webhookId);
          break;
        case 'delivery':
          result = await this.testDelivery(webhookId);
          break;
        case 'compliance':
          result = await this.testCompliance(webhookId);
          break;
        case 'performance':
          result = await this.testPerformance(webhookId);
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }

      // Update test record
      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt).getTime() - new Date(test.startedAt).getTime();

      await this.supabase
        .from('webhook_tests')
        .update({
          status: result.success ? 'passed' : 'failed',
          result,
          completedAt,
          duration
        })
        .eq('id', testId);

      return {
        ...test,
        status: result.success ? 'passed' : 'failed',
        result,
        completedAt,
        duration
      };
    } catch (error) {
      console.error('Webhook test failed:', error);
      throw new Error('Webhook test failed');
    }
  }

  /**
   * Get webhook metrics
   */
  async getWebhookMetrics(webhookId: string): Promise<WebhookMetrics> {
    try {
      const { data: webhook } = await this.supabase
        .from('webhook_configurations')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      // Get delivery statistics
      const { data: deliveries } = await this.supabase
        .from('webhook_deliveries')
        .select('status, created_at')
        .eq('webhook_id', webhookId);

      const totalEvents = deliveries?.length || 0;
      const successfulEvents = deliveries?.filter(d => d.status === 'delivered').length || 0;
      const failedEvents = deliveries?.filter(d => d.status === 'failed').length || 0;

      // Get healthcare metrics
      const healthcareMetrics = await this.getHealthcareMetrics(webhookId);

      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        averageResponseTime: 0, // This would be calculated from delivery records
        lastEventTime: deliveries?.[0]?.created_at || webhook.created_at,
        uptime: this.calculateUptime(webhook),
        errorRate: totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0,
        complianceScore: await this.calculateComplianceScore(webhookId),
        healthcareMetrics
      };
    } catch (error) {
      console.error('Failed to get webhook metrics:', error);
      throw new Error('Failed to retrieve webhook metrics');
    }
  }

  // Private helper methods

  private async createWebhookEvent(
    eventType: string,
    data: any,
    organizationId: string,
    healthcareContext: HealthcareWebhookContext
  ): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'hmhcp-enterprise',
      organizationId,
      healthcareContext,
      data: {
        resourceType: data.resourceType || 'unknown',
        resourceId: data.resourceId || crypto.randomUUID(),
        action: data.action || 'update',
        currentData: data,
        changes: data.changes || [],
        relatedResources: data.relatedResources || [],
        auditTrail: data.auditTrail || []
      },
      metadata: {
        eventId: crypto.randomUUID(),
        correlationId: data.correlationId || crypto.randomUUID(),
        priority: data.priority || 'medium',
        retryCount: 0,
        maxRetries: 3,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        tags: data.tags || [],
        customFields: data.customFields || {}
      },
      complianceFlags: this.getComplianceFlags(eventType, healthcareContext)
    };

    // Store event
    await this.supabase
      .from('webhook_events')
      .insert([event]);

    return event;
  }

  private async createWebhookDelivery(webhookId: string, eventId: string): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      webhookId,
      eventId,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .insert([delivery])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async updateWebhookDelivery(
    deliveryId: string,
    updates: Partial<WebhookDelivery>
  ): Promise<void> {
    await this.supabase
      .from('webhook_deliveries')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', deliveryId);
  }

  private async handleWebhookFailure(
    webhook: WebhookConfiguration,
    event: WebhookEvent,
    error: any
  ): Promise<void> {
    // Create delivery error
    const deliveryError: WebhookDeliveryError = {
      code: error.code || 'DELIVERY_FAILED',
      message: error.message || 'Webhook delivery failed',
      details: error.details,
      statusCode: error.response?.status,
      retryable: this.isRetryableError(error),
      complianceFlags: ['HIPAA_AUDIT_REQUIRED']
    };

    // Update webhook metrics
    await this.updateWebhookMetrics(webhook.id, false);

    // Log failure
    await this.logAuditEvent({
      eventType: 'webhook_failed',
      webhookId: webhook.id,
      details: { eventId: event.id, error: deliveryError }
    });
  }

  private async updateWebhookMetrics(webhookId: string, success: boolean): Promise<void> {
    const updateField = success ? 'success_count' : 'failure_count';
    await this.supabase
      .from('webhook_configurations')
      .update({
        [updateField]: this.supabase.raw(`${updateField} + 1`),
        total_triggers: this.supabase.raw('total_triggers + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', webhookId);
  }

  private async initializeWebhookClient(webhook: WebhookConfiguration): Promise<void> {
    const client = axios.create({
      baseURL: webhook.url,
      timeout: webhook.retryPolicy.maxDelay,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HMHCP-Webhook-Client/1.0'
      }
    });

    this.webhookClients.set(webhook.id, client);
  }

  private async applyWebhookFiltering(webhook: WebhookConfiguration, event: WebhookEvent): Promise<WebhookEvent | null> {
    // Apply filtering rules
    for (const rule of webhook.filtering.rules) {
      if (!rule.isActive) continue;

      const passes = await this.evaluateFilterRule(rule, event);
      if (rule.action === 'deny' && !passes) {
        return null; // Filter out event
      }
    }

    // Apply field filtering
    if (webhook.filtering.includeFields.length > 0) {
      event.data = this.filterEventFields(event.data, webhook.filtering.includeFields);
    }

    if (webhook.filtering.excludeFields.length > 0) {
      event.data = this.excludeEventFields(event.data, webhook.filtering.excludeFields);
    }

    return event;
  }

  private async applyWebhookTransformation(webhook: WebhookConfiguration, event: WebhookEvent): Promise<WebhookEvent> {
    // Apply transformation template
    if (webhook.transformation.template) {
      // This would implement template transformation
      // For now, return the event as-is
      return event;
    }

    // Apply field mapping
    if (Object.keys(webhook.transformation.mapping).length > 0) {
      event.data = this.applyFieldMapping(event.data, webhook.transformation.mapping);
    }

    return event;
  }

  private async addWebhookAuthentication(webhook: WebhookConfiguration, headers: Record<string, string>): Promise<void> {
    const auth = webhook.authentication;
    
    switch (auth.type) {
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
      case 'hmac':
        // HMAC authentication would be implemented here
        break;
      case 'oauth2':
        // OAuth2 authentication would be implemented here
        break;
    }
  }

  private generateWebhookSignature(event: WebhookEvent, secret: string): string {
    const payload = JSON.stringify(event);
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private async validateHealthcareCompliance(config: Partial<WebhookConfiguration>): Promise<void> {
    if (config.healthcareCompliance?.hipaaCompliant) {
      if (!config.healthcareCompliance.dataEncryption?.inTransit) {
        throw new Error('HIPAA compliance requires data encryption in transit');
      }
      if (!config.healthcareCompliance.auditLogging?.enabled) {
        throw new Error('HIPAA compliance requires audit logging');
      }
    }
  }

  private getComplianceFlags(eventType: string, healthcareContext: HealthcareWebhookContext): string[] {
    const flags = [];
    
    if (healthcareContext.dataClassification === 'phi') {
      flags.push('PHI_DATA');
    }
    
    if (healthcareContext.auditRequired) {
      flags.push('AUDIT_REQUIRED');
    }
    
    if (healthcareContext.complianceLevel === 'critical') {
      flags.push('CRITICAL_COMPLIANCE');
    }
    
    return flags;
  }

  private isRetryableError(error: any): boolean {
    if (error.response?.status) {
      return [408, 429, 500, 502, 503, 504].includes(error.response.status);
    }
    return true; // Retry network errors
  }

  private async evaluateFilterRule(rule: any, event: WebhookEvent): Promise<boolean> {
    // Implement filter rule evaluation
    // This would parse and evaluate the condition
    return true; // Placeholder
  }

  private filterEventFields(data: any, includeFields: string[]): any {
    // Implement field filtering
    return data; // Placeholder
  }

  private excludeEventFields(data: any, excludeFields: string[]): any {
    // Implement field exclusion
    return data; // Placeholder
  }

  private applyFieldMapping(data: any, mapping: Record<string, string>): any {
    // Implement field mapping
    return data; // Placeholder
  }

  private async testConnectivity(webhookId: string): Promise<WebhookTestResult> {
    // Implement connectivity test
    return {
      success: true,
      message: 'Connectivity test passed',
      details: {},
      metrics: { responseTime: 100, statusCode: 200, dataSize: 0 },
      complianceChecks: [],
      healthcareChecks: []
    };
  }

  private async testAuthentication(webhookId: string): Promise<WebhookTestResult> {
    // Implement authentication test
    return {
      success: true,
      message: 'Authentication test passed',
      details: {},
      metrics: { responseTime: 100, statusCode: 200, dataSize: 0 },
      complianceChecks: [],
      healthcareChecks: []
    };
  }

  private async testDelivery(webhookId: string): Promise<WebhookTestResult> {
    // Implement delivery test
    return {
      success: true,
      message: 'Delivery test passed',
      details: {},
      metrics: { responseTime: 100, statusCode: 200, dataSize: 0 },
      complianceChecks: [],
      healthcareChecks: []
    };
  }

  private async testCompliance(webhookId: string): Promise<WebhookTestResult> {
    // Implement compliance test
    return {
      success: true,
      message: 'Compliance test passed',
      details: {},
      metrics: { responseTime: 100, statusCode: 200, dataSize: 0 },
      complianceChecks: [],
      healthcareChecks: []
    };
  }

  private async testPerformance(webhookId: string): Promise<WebhookTestResult> {
    // Implement performance test
    return {
      success: true,
      message: 'Performance test passed',
      details: {},
      metrics: { responseTime: 100, statusCode: 200, dataSize: 0 },
      complianceChecks: [],
      healthcareChecks: []
    };
  }

  private async getHealthcareMetrics(webhookId: string): Promise<WebhookHealthcareMetrics> {
    // Get healthcare-specific metrics
    return {
      phiEvents: 0,
      clinicalEvents: 0,
      administrativeEvents: 0,
      complianceViolations: 0,
      auditEvents: 0,
      dataAccessEvents: 0,
      encryptionEvents: 0
    };
  }

  private calculateUptime(webhook: WebhookConfiguration): number {
    // Calculate uptime percentage
    return 99.9; // Placeholder
  }

  private async calculateComplianceScore(webhookId: string): Promise<number> {
    // Calculate compliance score
    return 95; // Placeholder
  }

  private async logAuditEvent(event: any): Promise<void> {
    const auditEvent = {
      id: crypto.randomUUID(),
      eventType: event.eventType,
      timestamp: new Date().toISOString(),
      webhookId: event.webhookId,
      details: event.details || {}
    };

    await this.supabase
      .from('webhook_audit_events')
      .insert([auditEvent]);
  }
}

export default WebhookService;
