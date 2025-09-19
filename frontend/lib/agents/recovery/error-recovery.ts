/**
 * Error Recovery System
 * Handles error recovery strategies and fallback mechanisms
 */

import { RecoveryStrategy, AgentError } from '../healthcare-types';

interface RecoveryContext {
  error: Error;
  agentId: string;
  step: string;
  attemptCount: number;
  maxAttempts: number;
  strategy: RecoveryStrategy;
  metadata?: any;
}

interface RecoveryResult {
  success: boolean;
  recovered: boolean;
  result?: any;
  fallbackUsed?: string;
  retryCount?: number;
  error?: string;
}

export class ErrorRecovery {
  private recoveryHistory: Map<string, RecoveryContext[]>;
  private fallbackProviders: Map<string, any>;
  private circuitBreakers: Map<string, CircuitBreaker>;

  constructor() {
    this.recoveryHistory = new Map();
    this.fallbackProviders = new Map();
    this.circuitBreakers = new Map();
    this.initializeFallbacks();
  }

  /**
   * Initialize fallback providers
   */
  private initializeFallbacks(): void {
    // API fallbacks
    this.fallbackProviders.set('perplexity', ['openai', 'anthropic', 'google']);
    this.fallbackProviders.set('claude', ['openai', 'cohere', 'huggingface']);
    this.fallbackProviders.set('dalle', ['midjourney', 'stable-diffusion', 'leonardo']);
    this.fallbackProviders.set('dataforseo', ['semrush', 'ahrefs', 'moz']);
  }

  /**
   * Attempt recovery based on strategy
   */
  public async attemptRecovery(context: RecoveryContext): Promise<RecoveryResult> {
    // Record recovery attempt
    this.recordRecoveryAttempt(context);

    // Check circuit breaker
    const breaker = this.getCircuitBreaker(context.agentId);
    if (!breaker.allowRequest()) {
      return {
        success: false,
        recovered: false,
        error: 'Circuit breaker open - service temporarily unavailable'
      };
    }

    try {
      let result: RecoveryResult;

      switch (context.strategy) {
        case RecoveryStrategy.RETRY:
          result = await this.retryWithBackoff(context);
          break;

        case RecoveryStrategy.FALLBACK:
          result = await this.executeFallback(context);
          break;

        case RecoveryStrategy.SKIP:
          result = this.skipStep(context);
          break;

        case RecoveryStrategy.ALTERNATIVE:
          result = await this.findAlternative(context);
          break;

        case RecoveryStrategy.MANUAL:
          result = await this.requestManualIntervention(context);
          break;

        case RecoveryStrategy.ABORT:
        default:
          result = this.abortExecution(context);
          break;
      }

      // Update circuit breaker
      if (result.success) {
        breaker.recordSuccess();
      } else {
        breaker.recordFailure();
      }

      return result;

    } catch (error) {
      breaker.recordFailure();
      return {
        success: false,
        recovered: false,
        error: `Recovery failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff(context: RecoveryContext): Promise<RecoveryResult> {
    const delays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
    const maxRetries = Math.min(context.maxAttempts, delays.length);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait before retry (except first attempt)
        if (attempt > 1) {
          const delay = delays[Math.min(attempt - 2, delays.length - 1)];
          await this.delay(delay);
          console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
        }

        // Attempt the operation
        // This would call back to the original operation
        // For now, we'll simulate it
        const success = await this.simulateRetry(context, attempt);

        if (success) {
          return {
            success: true,
            recovered: true,
            retryCount: attempt,
            result: { retried: true, attempt }
          };
        }

      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            recovered: false,
            retryCount: attempt,
            error: `All retry attempts failed: ${(error as Error).message}`
          };
        }
      }
    }

    return {
      success: false,
      recovered: false,
      retryCount: maxRetries,
      error: 'Max retry attempts reached'
    };
  }

  /**
   * Execute fallback provider
   */
  private async executeFallback(context: RecoveryContext): Promise<RecoveryResult> {
    const fallbacks = this.fallbackProviders.get(context.agentId);
    
    if (!fallbacks || fallbacks.length === 0) {
      return {
        success: false,
        recovered: false,
        error: 'No fallback providers available'
      };
    }

    for (const fallbackProvider of fallbacks) {
      try {
        console.log(`Attempting fallback with ${fallbackProvider}`);
        
        // Execute fallback
        const result = await this.executeFallbackProvider(
          fallbackProvider, 
          context
        );

        if (result) {
          return {
            success: true,
            recovered: true,
            fallbackUsed: fallbackProvider,
            result
          };
        }

      } catch (error) {
        console.warn(`Fallback ${fallbackProvider} failed:`, error);
      }
    }

    return {
      success: false,
      recovered: false,
      error: 'All fallback providers failed'
    };
  }

  /**
   * Skip the failed step
   */
  private skipStep(context: RecoveryContext): RecoveryResult {
    console.log(`Skipping step ${context.step} due to error`);
    
    return {
      success: true,
      recovered: false,
      result: {
        skipped: true,
        reason: context.error.message,
        step: context.step
      }
    };
  }

  /**
   * Find alternative execution path
   */
  private async findAlternative(context: RecoveryContext): Promise<RecoveryResult> {
    // Determine alternative based on error type
    const alternative = this.determineAlternative(context);
    
    if (!alternative) {
      return {
        success: false,
        recovered: false,
        error: 'No alternative path available'
      };
    }

    try {
      const result = await this.executeAlternative(alternative, context);
      
      return {
        success: true,
        recovered: true,
        result: {
          alternative: alternative.name,
          result
        }
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        error: `Alternative execution failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Request manual intervention
   */
  private async requestManualIntervention(context: RecoveryContext): Promise<RecoveryResult> {
    console.log('Manual intervention requested');
    
    // Send notification for manual intervention
    await this.sendInterventionRequest(context);
    
    // Wait for manual resolution (with timeout)
    const resolved = await this.waitForManualResolution(context, 300000); // 5 minutes
    
    if (resolved) {
      return {
        success: true,
        recovered: true,
        result: { manual: true, resolved: true }
      };
    }

    return {
      success: false,
      recovered: false,
      error: 'Manual intervention timeout'
    };
  }

  /**
   * Abort execution
   */
  private abortExecution(context: RecoveryContext): RecoveryResult {
    console.error(`Aborting execution due to error in ${context.step}`);
    
    return {
      success: false,
      recovered: false,
      error: `Execution aborted: ${context.error.message}`
    };
  }

  /**
   * Analyze error for smart recovery
   */
  public analyzeError(error: Error): {
    recoverable: boolean;
    suggestedStrategy: RecoveryStrategy;
    confidence: number;
  } {
    const errorMessage = error.message.toLowerCase();
    
    // Rate limit errors - retry with backoff
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests')) {
      return {
        recoverable: true,
        suggestedStrategy: RecoveryStrategy.RETRY,
        confidence: 0.9
      };
    }
    
    // API errors - use fallback
    if (errorMessage.includes('api error') || 
        errorMessage.includes('service unavailable')) {
      return {
        recoverable: true,
        suggestedStrategy: RecoveryStrategy.FALLBACK,
        confidence: 0.8
      };
    }
    
    // Timeout errors - retry or alternative
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('timed out')) {
      return {
        recoverable: true,
        suggestedStrategy: RecoveryStrategy.ALTERNATIVE,
        confidence: 0.7
      };
    }
    
    // Validation errors - skip or manual
    if (errorMessage.includes('validation') || 
        errorMessage.includes('invalid')) {
      return {
        recoverable: false,
        suggestedStrategy: RecoveryStrategy.MANUAL,
        confidence: 0.6
      };
    }
    
    // Critical errors - abort
    if (errorMessage.includes('critical') || 
        errorMessage.includes('fatal')) {
      return {
        recoverable: false,
        suggestedStrategy: RecoveryStrategy.ABORT,
        confidence: 0.9
      };
    }
    
    // Default - attempt retry
    return {
      recoverable: true,
      suggestedStrategy: RecoveryStrategy.RETRY,
      confidence: 0.5
    };
  }

  /**
   * Get or create circuit breaker for agent
   */
  private getCircuitBreaker(agentId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(agentId)) {
      this.circuitBreakers.set(agentId, new CircuitBreaker(agentId));
    }
    return this.circuitBreakers.get(agentId)!;
  }

  /**
   * Record recovery attempt
   */
  private recordRecoveryAttempt(context: RecoveryContext): void {
    const key = `${context.agentId}:${context.step}`;
    
    if (!this.recoveryHistory.has(key)) {
      this.recoveryHistory.set(key, []);
    }
    
    this.recoveryHistory.get(key)!.push({
      ...context,
      timestamp: Date.now()
    } as any);
  }

  /**
   * Helper methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateRetry(context: RecoveryContext, attempt: number): Promise<boolean> {
    // Simulate retry with decreasing failure probability
    const successProbability = attempt * 0.25;
    return Math.random() < successProbability;
  }

  private async executeFallbackProvider(provider: string, context: RecoveryContext): Promise<any> {
    // Implementation would execute actual fallback provider
    console.log(`Executing fallback provider: ${provider}`);
    return { fallback: provider, success: true };
  }

  private determineAlternative(context: RecoveryContext): any {
    // Determine alternative based on context
    return {
      name: 'alternative_path',
      steps: ['step1', 'step2']
    };
  }

  private async executeAlternative(alternative: any, context: RecoveryContext): Promise<any> {
    // Execute alternative path
    return { alternative: alternative.name, executed: true };
  }

  private async sendInterventionRequest(context: RecoveryContext): Promise<void> {
    // Send notification for manual intervention
    console.log('Sending manual intervention request');
  }

  private async waitForManualResolution(context: RecoveryContext, timeout: number): Promise<boolean> {
    // Wait for manual resolution with timeout
    return new Promise((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });
  }

  /**
   * Get recovery statistics
   */
  public getRecoveryStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    byStrategy: Record<string, number>;
  } {
    let totalAttempts = 0;
    let successfulRecoveries = 0;
    const byStrategy: Record<string, number> = {};

    for (const attempts of this.recoveryHistory.values()) {
      totalAttempts += attempts.length;
      attempts.forEach(attempt => {
        const strategy = attempt.strategy.toString();
        byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
      });
    }

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries: totalAttempts - successfulRecoveries,
      byStrategy
    };
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private agentId: string;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold: number = 5;
  private readonly timeout: number = 60000; // 1 minute
  private readonly resetTimeout: number = 120000; // 2 minutes

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  public allowRequest(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        if (now - this.lastFailureTime > this.timeout) {
          this.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return false;
    }
  }

  public recordSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failureCount = 0;
    }
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.warn(`Circuit breaker opened for ${this.agentId}`);
      
      // Auto-reset after timeout
      setTimeout(() => {
        this.state = 'half-open';
        console.log(`Circuit breaker half-opened for ${this.agentId}`);
      }, this.resetTimeout);
    }
  }

  public getState(): string {
    return this.state;
  }

  public reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}