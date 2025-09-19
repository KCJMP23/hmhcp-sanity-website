export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
  halfOpenRequests: number
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime?: number
  private halfOpenAttempts: number = 0
  private readonly options: CircuitBreakerOptions

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
      halfOpenRequests: options.halfOpenRequests || 3
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const now = Date.now()
      if (this.lastFailureTime && (now - this.lastFailureTime) >= this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN
        this.halfOpenAttempts = 0
        console.log('[Circuit Breaker] Transitioning to HALF_OPEN state')
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      this.halfOpenAttempts++

      if (this.halfOpenAttempts >= this.options.halfOpenRequests) {
        this.state = CircuitState.CLOSED
        this.successCount = 0
        console.log('[Circuit Breaker] Circuit CLOSED - service recovered')
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN
      console.log('[Circuit Breaker] Circuit OPEN - half-open test failed')
      return
    }

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN
      console.log(`[Circuit Breaker] Circuit OPEN - failure threshold reached (${this.failureCount})`)
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getStats(): {
    state: CircuitState
    failureCount: number
    successCount: number
    lastFailureTime?: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = undefined
    this.halfOpenAttempts = 0
  }
}

// Circuit breaker registry for different services
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry
  private breakers: Map<string, CircuitBreaker> = new Map()

  static getInstance(): CircuitBreakerRegistry {
    if (!this.instance) {
      this.instance = new CircuitBreakerRegistry()
    }
    return this.instance
  }

  getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(options))
    }
    return this.breakers.get(name)!
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats()
    }
    return stats
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
  }
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries || 3
  const initialDelay = options.initialDelay || 1000
  const maxDelay = options.maxDelay || 30000
  const backoffFactor = options.backoffFactor || 2

  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )
      
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}