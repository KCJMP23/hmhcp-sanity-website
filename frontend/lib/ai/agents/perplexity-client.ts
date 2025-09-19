/**
 * Perplexity AI Client
 * Healthcare-optimized client for Perplexity AI API integration
 */

import { EventEmitter } from 'events';
import HealthcareAILogger from '../logger';

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  top_p?: number;
  return_citations?: boolean;
  return_images?: boolean;
  return_related_questions?: boolean;
  search_domain_filter?: string[];
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  choices: PerplexityChoice[];
  usage?: PerplexityUsage;
  citations?: string[];
}

export interface PerplexityChoice {
  index: number;
  message: PerplexityMessage;
  finish_reason: string;
}

export interface PerplexityUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PerplexityClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  logger: HealthcareAILogger;
}

export class PerplexityClient extends EventEmitter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly logger: HealthcareAILogger;
  private requestCount: number = 0;
  private totalTokensUsed: number = 0;

  constructor(config: PerplexityClientConfig) {
    super();
    
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
    this.maxRetries = config.maxRetries;
    this.logger = config.logger;
    
    if (!this.apiKey) {
      throw new Error('Perplexity API key is required');
    }
  }

  /**
   * Make a request to Perplexity AI API
   */
  async chat(request: PerplexityRequest): Promise<PerplexityResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    // Add healthcare-specific parameters
    const enhancedRequest = this.enhanceRequestForHealthcare(request);
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this.logger.info('perplexity-request', {
          attempt: attempt + 1,
          model: request.model,
          tokenEstimate: this.estimateTokens(request)
        });

        const response = await this.makeRequest(enhancedRequest);
        
        // Track usage
        if (response.usage) {
          this.totalTokensUsed += response.usage.total_tokens;
        }
        this.requestCount++;
        
        this.logger.info('perplexity-response', {
          requestId: response.id,
          tokensUsed: response.usage?.total_tokens || 0,
          duration: Date.now() - startTime,
          citations: response.citations?.length || 0
        });

        this.emit('request-completed', {
          requestId: response.id,
          duration: Date.now() - startTime,
          tokensUsed: response.usage?.total_tokens || 0
        });

        return response;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        this.logger.warn('perplexity-request-failed', {
          attempt: attempt + 1,
          error: lastError.message,
          willRetry: attempt < this.maxRetries - 1
        });

        // Handle rate limiting
        if (this.isRateLimitError(lastError)) {
          const backoffTime = this.calculateBackoff(attempt);
          await this.sleep(backoffTime);
        } else if (!this.isRetryableError(lastError)) {
          // Non-retryable error, throw immediately
          break;
        }
        
        // Exponential backoff for other retryable errors
        if (attempt < this.maxRetries - 1) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.sleep(backoffTime);
        }
      }
    }
    
    throw lastError || new Error('Failed to complete Perplexity request');
  }

  /**
   * Enhance request with healthcare-specific parameters
   */
  private enhanceRequestForHealthcare(request: PerplexityRequest): PerplexityRequest {
    const enhanced = { ...request };
    
    // Add healthcare search domains if not specified
    if (!enhanced.search_domain_filter) {
      enhanced.search_domain_filter = [
        'pubmed.ncbi.nlm.nih.gov',
        'www.ncbi.nlm.nih.gov',
        'clinicaltrials.gov',
        'www.fda.gov',
        'www.cdc.gov',
        'www.who.int',
        'www.nejm.org',
        'www.thelancet.com',
        'jamanetwork.com',
        'www.bmj.com',
        'www.nature.com/nm',
        'www.cell.com',
        'www.sciencedirect.com',
        'www.cochrane.org',
        'www.uptodate.com'
      ];
    }
    
    // Enable citations for medical content
    if (enhanced.return_citations === undefined) {
      enhanced.return_citations = true;
    }
    
    // Set appropriate temperature for factual medical information
    if (enhanced.temperature === undefined) {
      enhanced.temperature = 0.2; // Lower temperature for more consistent medical information
    }
    
    // Set recency filter for medical information (prefer recent studies)
    if (!enhanced.search_recency_filter) {
      enhanced.search_recency_filter = 'year'; // Focus on recent year by default
    }
    
    return enhanced;
  }

  /**
   * Make the actual HTTP request to Perplexity API
   */
  private async makeRequest(request: PerplexityRequest): Promise<PerplexityResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'HMHCP-Healthcare-AI/1.0'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      return data as PerplexityResponse;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Perplexity request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Build healthcare-optimized system prompt
   */
  buildHealthcareSystemPrompt(): string {
    return `You are a medical research assistant with expertise in healthcare and clinical medicine. 
    Your responses should:
    1. Be based on peer-reviewed medical literature and clinical guidelines
    2. Include proper medical terminology and be clinically accurate
    3. Cite credible medical sources (journals, clinical trials, FDA, CDC, WHO)
    4. Distinguish between established medical facts and emerging research
    5. Note any contraindications, warnings, or safety considerations
    6. Comply with medical information accuracy standards
    7. Avoid making diagnostic or treatment recommendations without proper context
    8. Focus on evidence-based medicine and current best practices
    
    When discussing medications, always mention:
    - Generic and brand names
    - FDA approval status
    - Common side effects and contraindications
    - Drug interactions if relevant
    
    For medical conditions, include:
    - ICD-10 codes when applicable
    - Prevalence and epidemiology
    - Standard diagnostic criteria
    - Evidence-based treatment options`;
  }

  /**
   * Format research query for optimal Perplexity results
   */
  formatResearchQuery(query: string, options?: {
    includeGuidelines?: boolean;
    includeClinicalTrials?: boolean;
    includeSystematicReviews?: boolean;
    yearRange?: { start: number; end: number };
  }): string {
    let formattedQuery = query;
    
    const additions: string[] = [];
    
    if (options?.includeGuidelines) {
      additions.push('clinical guidelines');
    }
    
    if (options?.includeClinicalTrials) {
      additions.push('clinical trials');
    }
    
    if (options?.includeSystematicReviews) {
      additions.push('systematic review meta-analysis');
    }
    
    if (options?.yearRange) {
      additions.push(`published ${options.yearRange.start}-${options.yearRange.end}`);
    }
    
    if (additions.length > 0) {
      formattedQuery += ` (${additions.join(' OR ')})`;
    }
    
    return formattedQuery;
  }

  /**
   * Extract citations from Perplexity response
   */
  extractCitations(response: PerplexityResponse): string[] {
    const citations: string[] = [];
    
    // Get citations from the response if available
    if (response.citations) {
      citations.push(...response.citations);
    }
    
    // Also extract URLs from the message content
    const content = response.choices[0]?.message?.content || '';
    const urlPattern = /https?:\/\/[^\s\]]+/g;
    const urls = content.match(urlPattern) || [];
    
    // Filter for medical/scientific sources
    const medicalUrls = urls.filter(url => 
      this.isMedicalSource(url)
    );
    
    citations.push(...medicalUrls);
    
    // Remove duplicates
    return [...new Set(citations)];
  }

  /**
   * Check if URL is from a medical/scientific source
   */
  private isMedicalSource(url: string): boolean {
    const medicalDomains = [
      'pubmed', 'ncbi.nlm.nih.gov', 'clinicaltrials.gov',
      'fda.gov', 'cdc.gov', 'who.int', 'nejm.org',
      'thelancet.com', 'jamanetwork.com', 'bmj.com',
      'nature.com', 'cell.com', 'sciencedirect.com',
      'cochrane.org', 'uptodate.com', 'medscape.com',
      'mayoclinic.org', 'clevelandclinic.org'
    ];
    
    return medicalDomains.some(domain => url.includes(domain));
  }

  /**
   * Estimate tokens for a request
   */
  private estimateTokens(request: PerplexityRequest): number {
    // Rough estimation: 1 token ~= 4 characters
    let totalChars = 0;
    
    for (const message of request.messages) {
      totalChars += message.content.length;
    }
    
    return Math.ceil(totalChars / 4);
  }

  /**
   * Check if error is rate limit error
   */
  private isRateLimitError(error: Error): boolean {
    return error.message.includes('429') || 
           error.message.toLowerCase().includes('rate limit');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'timeout', 'network', 'ECONNRESET', 'ETIMEDOUT',
      'ENOTFOUND', '500', '502', '503', '504'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Calculate backoff time for rate limiting
   */
  private calculateBackoff(attempt: number): number {
    // Start with 5 seconds, double each time, max 60 seconds
    return Math.min(5000 * Math.pow(2, attempt), 60000);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    requestCount: number;
    totalTokensUsed: number;
    averageTokensPerRequest: number;
  } {
    return {
      requestCount: this.requestCount,
      totalTokensUsed: this.totalTokensUsed,
      averageTokensPerRequest: this.requestCount > 0 
        ? Math.round(this.totalTokensUsed / this.requestCount)
        : 0
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.requestCount = 0;
    this.totalTokensUsed = 0;
  }
}

export default PerplexityClient;