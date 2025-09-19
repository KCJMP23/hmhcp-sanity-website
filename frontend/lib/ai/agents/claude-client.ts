/**
 * Claude AI Client Wrapper
 * Healthcare-optimized content generation client for Anthropic's Claude API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import HealthcareAILogger from '../logger';

// Claude model information
export const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1MInput: 3,
    costPer1MOutput: 15,
    bestFor: 'complex reasoning and content generation',
    healthcareOptimized: true
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1MInput: 0.8,
    costPer1MOutput: 4,
    bestFor: 'fast, lightweight tasks',
    healthcareOptimized: true
  },
  'claude-3-opus-20240229': {
    name: 'Claude 3 Opus',
    maxTokens: 4096,
    contextWindow: 200000,
    costPer1MInput: 15,
    costPer1MOutput: 75,
    bestFor: 'complex analysis and research',
    healthcareOptimized: true
  }
} as const;

export type ClaudeModel = keyof typeof CLAUDE_MODELS;

// Request/Response interfaces
export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeRequest {
  model: ClaudeModel | string;
  messages: ClaudeMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  system?: string;
  metadata?: ClaudeMetadata;
}

export interface ClaudeMetadata {
  user_id?: string;
  session_id?: string;
  request_id?: string;
  healthcare_context?: {
    contentType?: string;
    complianceLevel?: string;
    targetAudience?: string;
  };
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export interface ClaudeError {
  type: string;
  message: string;
  code?: string;
  status?: number;
}

export interface ClaudeClientConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: ClaudeModel;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  maxTokensPerMinute?: number;
  logger?: HealthcareAILogger;
}

// Healthcare-specific options
export interface ClaudeHealthcareOptions {
  contentType?: 'patient_education' | 'clinical_notes' | 'research_article' | 
    'marketing_copy' | 'regulatory_document' | 'case_study' | 'general';
  targetAudience?: 'patients' | 'providers' | 'administrators' | 'researchers' | 
    'executives' | 'general' | 'public';
  complianceLevel?: 'hipaa' | 'fda' | 'gdpr' | 'public' | 'professional' | 'general';
  includeDisclaimer?: boolean;
  requiresCitations?: boolean;
  medicalAccuracyLevel?: 'high' | 'medium' | 'general';
  temperature?: number;
  maxTokens?: number;
}

/**
 * Claude AI Client
 * Handles communication with Anthropic's Claude API for healthcare content generation
 */
export class ClaudeClient {
  private readonly axiosClient: AxiosInstance;
  private readonly config: ClaudeClientConfig;
  private readonly logger: HealthcareAILogger;
  private tokenUsage: Map<string, { count: number; timestamp: number }>;
  private readonly tokenWindow = 60000; // 1 minute window for rate limiting
  private requestCount = 0;
  private totalTokensUsed = 0;
  private totalCost = 0;

  constructor(config: ClaudeClientConfig) {
    this.config = {
      baseURL: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 60000,
      maxTokensPerMinute: 100000,
      ...config
    };

    this.logger = config.logger || new HealthcareAILogger({
      component: 'ClaudeClient',
      enableConsole: true,
      enableFile: true,
      logLevel: 'info'
    });

    this.tokenUsage = new Map();

    // Initialize Axios client
    this.axiosClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-beta': 'messages-2023-12-15'
      }
    });

    // Add request interceptor for logging
    this.axiosClient.interceptors.request.use(
      (config) => {
        this.logger.debug('Claude API Request', {
          method: config.method,
          url: config.url,
          model: config.data?.model
        });
        return config;
      },
      (error) => {
        this.logger.error('Claude API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and metrics
    this.axiosClient.interceptors.response.use(
      (response) => {
        this.logger.debug('Claude API Response', {
          status: response.status,
          model: response.data?.model,
          usage: response.data?.usage
        });
        return response;
      },
      (error) => {
        this.logger.error('Claude API Response Error', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate content using Claude API
   */
  public async generateContent(request: ClaudeRequest): Promise<ClaudeResponse> {
    // Check rate limits
    await this.checkRateLimit(request.max_tokens);

    // Add healthcare system prompt if not provided
    if (!request.system) {
      request.system = this.getDefaultSystemPrompt();
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        const response = await this.axiosClient.post<ClaudeResponse>('/messages', request);
        
        // Track usage
        this.updateUsageMetrics(response.data.usage);
        
        // Validate response for healthcare compliance
        this.validateHealthcareResponse(response.data);
        
        return response.data;
        
      } catch (error) {
        lastError = error as Error;
        
        if (this.shouldRetry(error as AxiosError, attempt)) {
          const delay = this.calculateRetryDelay(attempt, error as AxiosError);
          this.logger.warn(`Retrying Claude API request (attempt ${attempt}/${this.config.maxRetries})`, {
            delay,
            error: (error as Error).message
          });
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Failed to generate content with Claude API');
  }

  /**
   * Generate healthcare-specific content with built-in compliance
   */
  public async generateHealthcareContent(
    prompt: string,
    options: ClaudeHealthcareOptions = {}
  ): Promise<ClaudeResponse> {
    const systemPrompt = this.buildHealthcareSystemPrompt(options);
    const userPrompt = this.enhancePromptForHealthcare(prompt, options);

    const request: ClaudeRequest = {
      model: this.config.defaultModel || 'claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? this.getOptimalTemperature(options.contentType),
      metadata: {
        healthcare_context: {
          contentType: options.contentType,
          complianceLevel: options.complianceLevel,
          targetAudience: options.targetAudience
        }
      }
    };

    const response = await this.generateContent(request);

    // Add disclaimer if required
    if (options.includeDisclaimer) {
      response.content[0].text = this.addHealthcareDisclaimer(
        response.content[0].text,
        options
      );
    }

    return response;
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateContent({
        model: this.config.defaultModel || 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });
      return !!response.id;
    } catch (error) {
      this.logger.error('Claude API connection test failed', error as Error);
      return false;
    }
  }

  /**
   * Get recommended model based on use case
   */
  public getRecommendedModel(options: {
    contentType?: string;
    complexity?: 'low' | 'medium' | 'high';
    costSensitive?: boolean;
    speedRequired?: boolean;
  }): ClaudeModel {
    if (options.costSensitive || options.speedRequired) {
      return 'claude-3-5-haiku-20241022';
    }
    
    if (options.complexity === 'high' || options.contentType === 'research_article') {
      return 'claude-3-opus-20240229';
    }
    
    return 'claude-3-5-sonnet-20241022';
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): {
    requestCount: number;
    totalTokens: number;
    totalCost: number;
    averageTokensPerRequest: number;
  } {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokensUsed,
      totalCost: this.totalCost,
      averageTokensPerRequest: this.requestCount > 0 
        ? Math.round(this.totalTokensUsed / this.requestCount)
        : 0
    };
  }

  /**
   * Estimate cost for a request
   */
  public estimateCost(model: ClaudeModel | string, inputTokens: number, outputTokens: number): number {
    const modelInfo = CLAUDE_MODELS[model as ClaudeModel];
    if (!modelInfo) {
      // Default to Sonnet pricing if model not found
      return (inputTokens * 3 + outputTokens * 15) / 1000000;
    }
    
    return (
      (inputTokens * modelInfo.costPer1MInput) +
      (outputTokens * modelInfo.costPer1MOutput)
    ) / 1000000;
  }

  // Private helper methods

  private async checkRateLimit(requestedTokens: number): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.tokenWindow;
    
    // Clean up old entries
    for (const [key, value] of this.tokenUsage.entries()) {
      if (value.timestamp < windowStart) {
        this.tokenUsage.delete(key);
      }
    }
    
    // Calculate current usage
    let currentUsage = 0;
    for (const value of this.tokenUsage.values()) {
      currentUsage += value.count;
    }
    
    // Check if request would exceed limit
    if (currentUsage + requestedTokens > (this.config.maxTokensPerMinute || 100000)) {
      const waitTime = Math.min(...Array.from(this.tokenUsage.values()).map(v => 
        this.tokenWindow - (now - v.timestamp)
      ));
      
      this.logger.warn(`Rate limit approaching, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    
    // Add current request to usage
    const requestId = `req-${Date.now()}-${Math.random()}`;
    this.tokenUsage.set(requestId, {
      count: requestedTokens,
      timestamp: now
    });
  }

  private updateUsageMetrics(usage: ClaudeResponse['usage']): void {
    this.requestCount++;
    this.totalTokensUsed += usage.total_tokens;
    
    // Estimate cost (using default Sonnet pricing if model not specified)
    const estimatedCost = this.estimateCost(
      this.config.defaultModel || 'claude-3-5-sonnet-20241022',
      usage.input_tokens,
      usage.output_tokens
    );
    this.totalCost += estimatedCost;
    
    this.logger.info('Token usage updated', {
      request: this.requestCount,
      tokensUsed: usage.total_tokens,
      totalTokens: this.totalTokensUsed,
      estimatedCost
    });
  }

  private validateHealthcareResponse(response: ClaudeResponse): void {
    const content = response.content[0].text.toLowerCase();
    
    // Check for potential compliance violations
    const violations: string[] = [];
    
    // Check for unsubstantiated medical claims
    if (content.includes('cure') && !content.includes('may') && !content.includes('potential')) {
      violations.push('Unqualified cure claim detected');
    }
    
    if (content.includes('guarantee') && (content.includes('health') || content.includes('medical'))) {
      violations.push('Medical guarantee claim detected');
    }
    
    // Check for missing disclaimers in patient-facing content
    if (content.includes('treatment') && !content.includes('consult') && !content.includes('physician')) {
      violations.push('Missing medical consultation disclaimer');
    }
    
    if (violations.length > 0) {
      this.logger.warn('Healthcare compliance violations detected', { violations });
    }
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    if (attempt >= (this.config.maxRetries || 3)) {
      return false;
    }
    
    // Retry on rate limit errors
    if (error.response?.status === 429) {
      return true;
    }
    
    // Retry on server errors
    if (error.response?.status && error.response.status >= 500) {
      return true;
    }
    
    // Retry on network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    return false;
  }

  private calculateRetryDelay(attempt: number, error: AxiosError): number {
    // Check for rate limit header
    if (error.response?.headers['retry-after']) {
      return parseInt(error.response.headers['retry-after']) * 1000;
    }
    
    // Exponential backoff
    const baseDelay = this.config.retryDelay || 1000;
    return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
  }

  private getDefaultSystemPrompt(): string {
    return `You are a healthcare content generation assistant specialized in creating 
    medically accurate, compliant, and engaging content. Always ensure content is:
    1. Factually accurate with proper medical terminology
    2. Compliant with healthcare regulations (HIPAA, FDA guidelines)
    3. Appropriate for the target audience
    4. Include necessary disclaimers when discussing medical topics
    5. Cite sources when making medical claims`;
  }

  private buildHealthcareSystemPrompt(options: ClaudeHealthcareOptions): string {
    let prompt = 'You are a healthcare content specialist. ';
    
    // Add content type specific instructions
    switch (options.contentType) {
      case 'patient_education':
        prompt += 'Create clear, accessible content for patients. Use simple language and explain medical terms. ';
        break;
      case 'clinical_notes':
        prompt += 'Generate professional clinical documentation using standard medical terminology. ';
        break;
      case 'research_article':
        prompt += 'Produce evidence-based content with proper citations and academic rigor. ';
        break;
      case 'marketing_copy':
        prompt += 'Create engaging healthcare marketing content that is compliant with advertising regulations. ';
        break;
      case 'regulatory_document':
        prompt += 'Generate formal regulatory documentation following FDA and healthcare compliance standards. ';
        break;
    }
    
    // Add audience-specific instructions
    switch (options.targetAudience) {
      case 'patients':
        prompt += 'Write at a 6th-8th grade reading level. Avoid jargon and include helpful explanations. ';
        break;
      case 'providers':
        prompt += 'Use professional medical terminology and evidence-based information. ';
        break;
      case 'executives':
        prompt += 'Focus on strategic insights, ROI, and business implications. ';
        break;
    }
    
    // Add compliance requirements
    if (options.complianceLevel === 'hipaa') {
      prompt += 'Ensure all content is HIPAA-compliant and protects patient privacy. ';
    }
    
    if (options.requiresCitations) {
      prompt += 'Include proper medical citations in AMA format. ';
    }
    
    if (options.medicalAccuracyLevel === 'high') {
      prompt += 'Ensure highest level of medical accuracy with current clinical guidelines. ';
    }
    
    return prompt;
  }

  private enhancePromptForHealthcare(
    prompt: string,
    options: ClaudeHealthcareOptions
  ): string {
    let enhancedPrompt = prompt;
    
    // Add context about target audience
    if (options.targetAudience) {
      enhancedPrompt += `\n\nTarget Audience: ${options.targetAudience}`;
    }
    
    // Add compliance requirements
    if (options.complianceLevel) {
      enhancedPrompt += `\nCompliance Level: ${options.complianceLevel}`;
    }
    
    // Add content type
    if (options.contentType) {
      enhancedPrompt += `\nContent Type: ${options.contentType}`;
    }
    
    return enhancedPrompt;
  }

  private addHealthcareDisclaimer(
    content: string,
    options: ClaudeHealthcareOptions
  ): string {
    let disclaimer = '\n\n---\n\n**Medical Disclaimer**: ';
    
    switch (options.targetAudience) {
      case 'patients':
        disclaimer += 'This information is for educational purposes only and is not intended as medical advice. ' +
          'Always consult with a qualified healthcare provider for medical guidance.';
        break;
      case 'providers':
        disclaimer += 'This content is for informational purposes. Clinical decisions should be based on ' +
          'individual patient assessment and current clinical guidelines.';
        break;
      default:
        disclaimer += 'This content is for informational purposes only and should not replace ' +
          'professional medical advice, diagnosis, or treatment.';
    }
    
    return content + disclaimer;
  }

  private getOptimalTemperature(contentType?: string): number {
    // Lower temperature for factual medical content
    switch (contentType) {
      case 'clinical_notes':
      case 'regulatory_document':
        return 0.3;
      case 'research_article':
      case 'patient_education':
        return 0.5;
      case 'marketing_copy':
      case 'case_study':
        return 0.7;
      default:
        return 0.5;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ClaudeClient;