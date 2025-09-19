// Email Service Manager
// Created: 2025-01-27
// Purpose: Manage multiple email service providers with failover

import { 
  EmailServiceProvider, 
  EmailServiceManager as IEmailServiceManager,
  EmailServiceConfig,
  SendEmailParams,
  SendBulkEmailParams,
  SendEmailResult,
  SendBulkEmailResult,
  HealthStatus,
  EmailServiceError,
  DEFAULT_RETRY_CONFIG,
  RetryConfig
} from './EmailServiceProvider';
import { SendGridService } from './SendGridService';
import { SMTPService } from './SMTPService';

export class EmailServiceManager implements IEmailServiceManager {
  public providers = new Map<string, EmailServiceProvider>();
  public primaryProvider = '';
  public fallbackProviders: string[] = [];
  
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  constructor() {
    // Initialize with default providers if configured
    this.initializeDefaultProviders();
  }

  addProvider(name: string, provider: EmailServiceProvider): void {
    this.providers.set(name, provider);
  }

  removeProvider(name: string): void {
    this.providers.delete(name);
    
    if (this.primaryProvider === name) {
      this.primaryProvider = '';
    }
    
    this.fallbackProviders = this.fallbackProviders.filter(p => p !== name);
  }

  setPrimaryProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new EmailServiceError(
        `Provider '${name}' not found`,
        'PROVIDER_NOT_FOUND',
        undefined,
        'manager'
      );
    }
    this.primaryProvider = name;
  }

  addFallbackProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new EmailServiceError(
        `Provider '${name}' not found`,
        'PROVIDER_NOT_FOUND',
        undefined,
        'manager'
      );
    }
    
    if (!this.fallbackProviders.includes(name)) {
      this.fallbackProviders.push(name);
    }
  }

  removeFallbackProvider(name: string): void {
    this.fallbackProviders = this.fallbackProviders.filter(p => p !== name);
  }

  async sendEmail(params: SendEmailParams, preferredProvider?: string): Promise<SendEmailResult> {
    const providers = this.getProviderOrder(preferredProvider);
    
    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;
      
      try {
        // Check if provider is healthy
        if (!provider.isHealthy) {
          const healthStatus = await provider.healthCheck();
          if (!healthStatus.isHealthy) {
            console.warn(`Provider ${providerName} is not healthy, trying next provider`);
            continue;
          }
        }
        
        const result = await this.retryOperation(
          () => provider.sendEmail(params),
          `sendEmail with ${providerName}`
        );
        
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Provider ${providerName} failed:`, error);
        
        if (error instanceof EmailServiceError && !error.retryable) {
          // Non-retryable error, try next provider
          continue;
        }
        
        // Retryable error, try next provider
        continue;
      }
    }
    
    throw new EmailServiceError(
      'All email providers failed',
      'ALL_PROVIDERS_FAILED',
      undefined,
      'manager',
      false
    );
  }

  async sendBulkEmail(params: SendBulkEmailParams, preferredProvider?: string): Promise<SendBulkEmailResult> {
    const providers = this.getProviderOrder(preferredProvider);
    
    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;
      
      try {
        // Check if provider is healthy
        if (!provider.isHealthy) {
          const healthStatus = await provider.healthCheck();
          if (!healthStatus.isHealthy) {
            console.warn(`Provider ${providerName} is not healthy, trying next provider`);
            continue;
          }
        }
        
        const result = await this.retryOperation(
          () => provider.sendBulkEmail(params),
          `sendBulkEmail with ${providerName}`
        );
        
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Provider ${providerName} failed:`, error);
        
        if (error instanceof EmailServiceError && !error.retryable) {
          // Non-retryable error, try next provider
          continue;
        }
        
        // Retryable error, try next provider
        continue;
      }
    }
    
    throw new EmailServiceError(
      'All email providers failed',
      'ALL_PROVIDERS_FAILED',
      undefined,
      'manager',
      false
    );
  }

  async checkAllProviders(): Promise<Map<string, HealthStatus>> {
    const results = new Map<string, HealthStatus>();
    
    for (const [name, provider] of this.providers) {
      try {
        const healthStatus = await provider.healthCheck();
        results.set(name, healthStatus);
      } catch (error) {
        results.set(name, {
          isHealthy: false,
          status: 'down',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastChecked: new Date(),
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: name
          }
        });
      }
    }
    
    return results;
  }

  async getHealthyProviders(): Promise<EmailServiceProvider[]> {
    const healthyProviders: EmailServiceProvider[] = [];
    
    for (const [name, provider] of this.providers) {
      try {
        const healthStatus = await provider.healthCheck();
        if (healthStatus.isHealthy) {
          healthyProviders.push(provider);
        }
      } catch (error) {
        console.warn(`Provider ${name} health check failed:`, error);
      }
    }
    
    return healthyProviders;
  }

  async configureProvider(name: string, config: EmailServiceConfig): Promise<void> {
    let provider: EmailServiceProvider;
    
    switch (config.provider) {
      case 'sendgrid':
        provider = new SendGridService(config);
        break;
      case 'smtp':
        provider = new SMTPService(config);
        break;
      case 'mailchimp':
        // TODO: Implement Mailchimp service
        throw new EmailServiceError(
          'Mailchimp provider not implemented',
          'PROVIDER_NOT_IMPLEMENTED',
          undefined,
          'manager'
        );
      case 'ses':
        // TODO: Implement AWS SES service
        throw new EmailServiceError(
          'AWS SES provider not implemented',
          'PROVIDER_NOT_IMPLEMENTED',
          undefined,
          'manager'
        );
      default:
        throw new EmailServiceError(
          `Unknown provider type: ${config.provider}`,
          'UNKNOWN_PROVIDER',
          undefined,
          'manager'
        );
    }
    
    this.addProvider(name, provider);
    
    // Set as primary if it's the first provider
    if (!this.primaryProvider) {
      this.primaryProvider = name;
    }
  }

  getProviderConfig(name: string): EmailServiceConfig | undefined {
    const provider = this.providers.get(name);
    if (!provider) return undefined;
    
    // Return a basic config - in a real implementation, this would store the original config
    return {
      provider: name as any,
      fromEmail: 'noreply@example.com'
    };
  }

  setRetryConfig(config: RetryConfig): void {
    this.retryConfig = { ...config };
  }

  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  private initializeDefaultProviders(): void {
    // Initialize with environment variables if available
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    
    if (sendgridApiKey) {
      const sendgridConfig: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: sendgridApiKey,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.SENDGRID_FROM_NAME || 'Email Service'
      };
      
      this.configureProvider('sendgrid', sendgridConfig);
    }
    
    if (smtpHost) {
      const smtpConfig: EmailServiceConfig = {
        provider: 'smtp',
        smtpHost,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUsername: process.env.SMTP_USERNAME || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        smtpSecure: process.env.SMTP_SECURE === 'true',
        fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.SMTP_FROM_NAME || 'Email Service'
      };
      
      this.configureProvider('smtp', smtpConfig);
    }
  }

  private getProviderOrder(preferredProvider?: string): string[] {
    const providers: string[] = [];
    
    // Add preferred provider first if specified and available
    if (preferredProvider && this.providers.has(preferredProvider)) {
      providers.push(preferredProvider);
    }
    
    // Add primary provider if not already added
    if (this.primaryProvider && !providers.includes(this.primaryProvider)) {
      providers.push(this.primaryProvider);
    }
    
    // Add fallback providers
    for (const fallback of this.fallbackProviders) {
      if (!providers.includes(fallback)) {
        providers.push(fallback);
      }
    }
    
    // Add any remaining providers
    for (const [name] of this.providers) {
      if (!providers.includes(name)) {
        providers.push(name);
      }
    }
    
    return providers;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if error is retryable
        if (error instanceof EmailServiceError) {
          if (!error.retryable || !this.retryConfig.retryableErrors.includes(error.code)) {
            throw error;
          }
        }
        
        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        console.warn(
          `${operationName} failed (attempt ${attempt}/${this.retryConfig.maxAttempts}), retrying in ${delay}ms:`,
          lastError.message
        );
        
        await this.delay(delay);
      }
    }
    
    throw lastError || new Error('Operation failed after all retry attempts');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const emailServiceManager = new EmailServiceManager();
