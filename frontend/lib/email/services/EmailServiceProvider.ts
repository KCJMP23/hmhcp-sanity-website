// Email Service Provider
// Created: 2025-01-27
// Purpose: Abstract email service provider interface

export interface EmailServiceProvider {
  name: string;
  isConfigured: boolean;
  isHealthy: boolean;
  lastHealthCheck: Date;
  
  // Core email operations
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  sendBulkEmail(params: SendBulkEmailParams): Promise<SendBulkEmailResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  
  // Template operations
  createTemplate(template: ServiceEmailTemplate): Promise<EmailTemplateResult>;
  updateTemplate(templateId: string, template: Partial<ServiceEmailTemplate>): Promise<EmailTemplateResult>;
  deleteTemplate(templateId: string): Promise<boolean>;
  getTemplate(templateId: string): Promise<EmailTemplateResult>;
  listTemplates(): Promise<EmailTemplateResult[]>;
  
  // Contact/List operations
  createContact(contact: ContactData): Promise<ContactResult>;
  updateContact(contactId: string, contact: Partial<ContactData>): Promise<ContactResult>;
  deleteContact(contactId: string): Promise<boolean>;
  getContact(contactId: string): Promise<ContactResult>;
  listContacts(): Promise<ContactResult[]>;
  
  // Webhook operations
  createWebhook(webhook: WebhookConfig): Promise<WebhookResult>;
  updateWebhook(webhookId: string, webhook: Partial<WebhookConfig>): Promise<WebhookResult>;
  deleteWebhook(webhookId: string): Promise<boolean>;
  listWebhooks(): Promise<WebhookResult[]>;
  
  // Health and monitoring
  healthCheck(): Promise<HealthStatus>;
  getMetrics(): Promise<ServiceMetrics>;
  getRateLimits(): Promise<RateLimits>;
}

export interface SendEmailParams {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from: string;
  replyTo?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SendBulkEmailParams {
  recipients: BulkRecipient[];
  from: string;
  replyTo?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface BulkRecipient {
  email: string;
  name?: string;
  data?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  type: string;
  disposition?: 'attachment' | 'inline';
  cid?: string; // Content ID for inline attachments
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  providerResponse?: any;
  deliveryStatus?: DeliveryStatus;
}

export interface SendBulkEmailResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: SendEmailResult[];
  batchId?: string;
  error?: string;
}

export interface DeliveryStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'bounced' | 'deferred' | 'dropped' | 'spam' | 'unsubscribed';
  timestamp: Date;
  reason?: string;
  details?: Record<string, any>;
}

export interface ServiceEmailTemplate {
  id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  category?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailTemplateResult {
  success: boolean;
  template?: ServiceEmailTemplate;
  error?: string;
  providerResponse?: any;
}

export interface ContactData {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  lists?: string[];
  unsubscribed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactResult {
  success: boolean;
  contact?: ContactData;
  error?: string;
  providerResponse?: any;
}

export interface WebhookConfig {
  id?: string;
  url: string;
  events: string[];
  secret?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WebhookResult {
  success: boolean;
  webhook?: WebhookConfig;
  error?: string;
  providerResponse?: any;
}

export interface HealthStatus {
  isHealthy: boolean;
  status: 'operational' | 'degraded' | 'down';
  message?: string;
  lastChecked: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface ServiceMetrics {
  totalEmailsSent: number;
  totalEmailsDelivered: number;
  totalEmailsBounced: number;
  totalEmailsDropped: number;
  averageDeliveryTime: number;
  successRate: number;
  lastUpdated: Date;
}

export interface RateLimits {
  dailyLimit: number;
  hourlyLimit: number;
  perSecondLimit: number;
  remainingDaily: number;
  remainingHourly: number;
  resetTime: Date;
}

export interface EmailServiceConfig {
  provider: 'sendgrid' | 'mailchimp' | 'ses' | 'smtp';
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  endpoint?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  webhookSecret?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface EmailServiceError extends Error {
  code: string;
  statusCode?: number;
  provider?: string;
  retryable: boolean;
  details?: Record<string, any>;
}

export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public provider?: string,
    public retryable: boolean = false,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'TIMEOUT',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
    'NETWORK_ERROR'
  ]
};

export interface EmailServiceManager {
  providers: Map<string, EmailServiceProvider>;
  primaryProvider: string;
  fallbackProviders: string[];
  
  // Provider management
  addProvider(name: string, provider: EmailServiceProvider): void;
  removeProvider(name: string): void;
  setPrimaryProvider(name: string): void;
  addFallbackProvider(name: string): void;
  removeFallbackProvider(name: string): void;
  
  // Email operations with failover
  sendEmail(params: SendEmailParams, preferredProvider?: string): Promise<SendEmailResult>;
  sendBulkEmail(params: SendBulkEmailParams, preferredProvider?: string): Promise<SendBulkEmailResult>;
  
  // Health monitoring
  checkAllProviders(): Promise<Map<string, HealthStatus>>;
  getHealthyProviders(): Promise<EmailServiceProvider[]>;
  
  // Configuration
  configureProvider(name: string, config: EmailServiceConfig): Promise<void>;
  getProviderConfig(name: string): EmailServiceConfig | undefined;
}
