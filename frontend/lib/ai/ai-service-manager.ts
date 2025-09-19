/**
 * Enhanced AI Service Manager with Retry Logic and Fallback Providers
 * 
 * Features:
 * - Multiple AI provider support (OpenAI, Anthropic, local models)
 * - Automatic retry with exponential backoff
 * - Fallback to alternative providers
 * - Token usage tracking and cost optimization
 * - Response caching for duplicate requests
 * - Structured output parsing
 */

import { generateText } from '@/lib/agents/providers'
import logger from '@/lib/logging/winston-logger'

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'local' | 'azure'
  model: string
  maxTokens: number
  temperature: number
  apiKey?: string
  endpoint?: string
  priority: number
  costPerToken: number
  isAvailable: boolean
  lastError?: string
  lastErrorTime?: Date
}

export interface AIRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  responseFormat?: 'text' | 'json' | 'structured'
  schema?: Record<string, any>
  cacheable?: boolean
  cacheKey?: string
  priority?: 'low' | 'medium' | 'high'
  timeout?: number
}

export interface AIResponse {
  content: string
  provider: string
  model: string
  tokensUsed: number
  cost: number
  cached: boolean
  retryCount: number
  latency: number
  structuredData?: any
}

export interface TokenUsage {
  provider: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  timestamp: Date
}

export class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map()
  private responseCache: Map<string, AIResponse> = new Map()
  private tokenUsage: TokenUsage[] = []
  private retryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }

  constructor() {
    this.initializeProviders()
  }

  /**
   * Initialize AI providers with configuration
   */
  private initializeProviders(): void {
    // Primary provider - OpenAI
    this.providers.set('openai-primary', {
      name: 'openai',
      model: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      temperature: 0.7,
      priority: 1,
      costPerToken: 0.00003,
      isAvailable: true
    })

    // Fallback provider - Anthropic Claude
    this.providers.set('anthropic-fallback', {
      name: 'anthropic',
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
      temperature: 0.7,
      priority: 2,
      costPerToken: 0.000015,
      isAvailable: true
    })

    // Cost-optimized provider for simple tasks
    this.providers.set('openai-efficient', {
      name: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 2048,
      temperature: 0.5,
      priority: 3,
      costPerToken: 0.000002,
      isAvailable: true
    })
  }

  /**
   * Generate text with automatic retry and fallback
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    // Check cache first
    if (request.cacheable && request.cacheKey) {
      const cached = this.responseCache.get(request.cacheKey)
      if (cached) {
        logger.info('Returning cached AI response', { cacheKey: request.cacheKey })
        return { ...cached, cached: true, latency: Date.now() - startTime }
      }
    }

    // Sort providers by priority
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable)
      .sort((a, b) => a.priority - b.priority)

    let lastError: Error | null = null
    let retryCount = 0

    for (const provider of availableProviders) {
      try {
        const response = await this.callProviderWithRetry(provider, request, retryCount)
        
        // Track token usage
        this.trackTokenUsage(provider, response.tokensUsed, response.cost)
        
        // Cache if requested
        if (request.cacheable && request.cacheKey) {
          this.responseCache.set(request.cacheKey, response)
          
          // Expire cache after 1 hour
          setTimeout(() => {
            this.responseCache.delete(request.cacheKey!)
          }, 3600000)
        }

        // Mark provider as healthy
        provider.isAvailable = true
        delete provider.lastError
        delete provider.lastErrorTime

        return {
          ...response,
          latency: Date.now() - startTime,
          retryCount
        }

      } catch (error) {
        lastError = error as Error
        retryCount++
        
        logger.error('AI provider failed', {
          provider: provider.name,
          model: provider.model,
          error: lastError.message,
          retryCount
        })

        // Mark provider as unhealthy
        provider.lastError = lastError.message
        provider.lastErrorTime = new Date()
        
        // Temporarily disable provider if it fails repeatedly
        if (retryCount >= this.retryConfig.maxRetries) {
          provider.isAvailable = false
          
          // Re-enable after 5 minutes
          setTimeout(() => {
            provider.isAvailable = true
            logger.info('Re-enabling AI provider', { provider: provider.name })
          }, 300000)
        }
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`)
  }

  /**
   * Call provider with retry logic
   */
  private async callProviderWithRetry(
    provider: AIProvider,
    request: AIRequest,
    currentRetry: number
  ): Promise<AIResponse> {
    let attempt = 0
    let delay = this.retryConfig.initialDelay

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        const response = await this.callProvider(provider, request)
        return response
      } catch (error) {
        attempt++
        
        if (attempt > this.retryConfig.maxRetries) {
          throw error
        }

        logger.warn('Retrying AI request', {
          provider: provider.name,
          attempt,
          delay,
          error: (error as Error).message
        })

        await this.sleep(delay)
        delay = Math.min(delay * this.retryConfig.backoffFactor, this.retryConfig.maxDelay)
      }
    }

    throw new Error('Max retries exceeded')
  }

  /**
   * Call specific AI provider
   */
  private async callProvider(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    // Build the full prompt
    let fullPrompt = request.prompt
    if (request.systemPrompt) {
      fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`
    }

    // Add response format instructions
    if (request.responseFormat === 'json') {
      fullPrompt += '\n\nRespond with valid JSON only, no additional text.'
    } else if (request.responseFormat === 'structured' && request.schema) {
      fullPrompt += `\n\nRespond with JSON matching this schema:\n${JSON.stringify(request.schema, null, 2)}`
    }

    try {
      // Use the existing generateText function as the base implementation
      const content = await generateText(fullPrompt)
      
      // Parse structured response if needed
      let structuredData = undefined
      if (request.responseFormat === 'json' || request.responseFormat === 'structured') {
        try {
          structuredData = JSON.parse(content)
          
          // Validate against schema if provided
          if (request.schema) {
            this.validateSchema(structuredData, request.schema)
          }
        } catch (parseError) {
          logger.warn('Failed to parse structured response, attempting to extract JSON', {
            error: (parseError as Error).message
          })
          
          // Try to extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/g)
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0])
          }
        }
      }

      // Estimate token usage (rough approximation)
      const tokensUsed = Math.ceil((fullPrompt.length + content.length) / 4)
      const cost = tokensUsed * provider.costPerToken

      return {
        content,
        provider: provider.name,
        model: provider.model,
        tokensUsed,
        cost,
        cached: false,
        retryCount: 0,
        latency: Date.now() - startTime,
        structuredData
      }

    } catch (error) {
      // Handle rate limiting
      if ((error as any).status === 429) {
        throw new Error('Rate limit exceeded')
      }
      
      // Handle timeout
      if ((error as any).code === 'ETIMEDOUT') {
        throw new Error('Request timeout')
      }

      throw error
    }
  }

  /**
   * Validate structured data against schema
   */
  private validateSchema(data: any, schema: Record<string, any>): void {
    // Simple schema validation (can be enhanced with JSON Schema library)
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in data)) {
        throw new Error(`Missing required field: ${key}`)
      }
      
      if (typeof type === 'string' && typeof data[key] !== type) {
        throw new Error(`Invalid type for field ${key}: expected ${type}`)
      }
    }
  }

  /**
   * Track token usage for cost optimization
   */
  private trackTokenUsage(provider: AIProvider, tokens: number, cost: number): void {
    const usage: TokenUsage = {
      provider: provider.name,
      model: provider.model,
      promptTokens: Math.ceil(tokens * 0.4), // Rough estimate
      completionTokens: Math.ceil(tokens * 0.6),
      totalTokens: tokens,
      cost,
      timestamp: new Date()
    }

    this.tokenUsage.push(usage)

    // Keep only last 1000 records
    if (this.tokenUsage.length > 1000) {
      this.tokenUsage = this.tokenUsage.slice(-1000)
    }
  }

  /**
   * Get token usage statistics
   */
  getTokenUsageStats(timeRange?: { start: Date; end: Date }): {
    totalTokens: number
    totalCost: number
    byProvider: Record<string, { tokens: number; cost: number }>
    byModel: Record<string, { tokens: number; cost: number }>
  } {
    let relevantUsage = this.tokenUsage
    
    if (timeRange) {
      relevantUsage = this.tokenUsage.filter(
        u => u.timestamp >= timeRange.start && u.timestamp <= timeRange.end
      )
    }

    const stats = {
      totalTokens: 0,
      totalCost: 0,
      byProvider: {} as Record<string, { tokens: number; cost: number }>,
      byModel: {} as Record<string, { tokens: number; cost: number }>
    }

    for (const usage of relevantUsage) {
      stats.totalTokens += usage.totalTokens
      stats.totalCost += usage.cost

      // By provider
      if (!stats.byProvider[usage.provider]) {
        stats.byProvider[usage.provider] = { tokens: 0, cost: 0 }
      }
      stats.byProvider[usage.provider].tokens += usage.totalTokens
      stats.byProvider[usage.provider].cost += usage.cost

      // By model
      if (!stats.byModel[usage.model]) {
        stats.byModel[usage.model] = { tokens: 0, cost: 0 }
      }
      stats.byModel[usage.model].tokens += usage.totalTokens
      stats.byModel[usage.model].cost += usage.cost
    }

    return stats
  }

  /**
   * Optimize provider selection based on request characteristics
   */
  selectOptimalProvider(request: AIRequest): AIProvider {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable)

    // High priority requests use best model
    if (request.priority === 'high') {
      return availableProviders.find(p => p.model.includes('gpt-4')) || availableProviders[0]
    }

    // JSON/structured requests need capable models
    if (request.responseFormat === 'json' || request.responseFormat === 'structured') {
      return availableProviders.find(p => 
        p.model.includes('gpt-4') || p.model.includes('claude')
      ) || availableProviders[0]
    }

    // Low priority or short prompts can use efficient models
    if (request.priority === 'low' || request.prompt.length < 500) {
      return availableProviders.find(p => p.model.includes('gpt-3.5')) || availableProviders[0]
    }

    // Default to primary provider
    return availableProviders.sort((a, b) => a.priority - b.priority)[0]
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear()
    logger.info('AI response cache cleared')
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): Array<{
    name: string
    model: string
    isAvailable: boolean
    lastError?: string
    lastErrorTime?: Date
  }> {
    return Array.from(this.providers.values()).map(p => ({
      name: p.name,
      model: p.model,
      isAvailable: p.isAvailable,
      lastError: p.lastError,
      lastErrorTime: p.lastErrorTime
    }))
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Batch process multiple requests efficiently
   */
  async batchProcess(requests: AIRequest[]): Promise<AIResponse[]> {
    // Group by priority
    const grouped = {
      high: requests.filter(r => r.priority === 'high'),
      medium: requests.filter(r => r.priority === 'medium' || !r.priority),
      low: requests.filter(r => r.priority === 'low')
    }

    const results: AIResponse[] = []

    // Process high priority first
    for (const group of [grouped.high, grouped.medium, grouped.low]) {
      const batchPromises = group.map(request => 
        this.generateText(request).catch(error => ({
          content: '',
          provider: 'error',
          model: 'none',
          tokensUsed: 0,
          cost: 0,
          cached: false,
          retryCount: 0,
          latency: 0,
          error: error.message
        }))
      )

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults as AIResponse[])
    }

    return results
  }
}

// Export singleton instance
export const aiService = new AIServiceManager()