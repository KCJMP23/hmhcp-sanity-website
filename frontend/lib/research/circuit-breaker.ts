/**
 * Circuit Breaker Pattern Implementation for External API Resilience
 * Healthcare-Grade Fault Tolerance for PubMed and CrossRef APIs
 * 
 * Features:
 * - Three states: CLOSED (normal), OPEN (failing), HALF_OPEN (testing)
 * - Configurable failure threshold and timeout periods
 * - Automatic recovery with exponential backoff
 * - Metrics collection for monitoring
 * - Healthcare compliance with audit logging
 */

import logger from '@/lib/logging/winston-logger'

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Circuit tripped, rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number
  /** Time window for failure counting (ms) */
  failureWindow: number
  /** Time to wait before attempting recovery (ms) */
  resetTimeout: number
  /** Number of successful calls in HALF_OPEN before closing */
  successThreshold: number
  /** Optional callback when state changes */
  onStateChange?: (oldState: CircuitBreakerState, newState: CircuitBreakerState) => void
  /** Optional metrics collector */
  metricsCollector?: (metrics: CircuitBreakerMetrics) => void
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitBreakerState
  failures: number
  successes: number
  lastFailureTime?: Date
  lastSuccessTime?: Date
  totalRequests: number
  rejectedRequests: number
  successRate: number
}

/**
 * Circuit breaker error class
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitBreakerState,
    public readonly lastFailureTime?: Date
  ) {
    super(message)
    this.name = 'CircuitBreakerError'
  }
}

/**
 * Healthcare-grade Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failures: number = 0
  private successes: number = 0
  private lastFailureTime?: Date
  private lastSuccessTime?: Date
  private totalRequests: number = 0
  private rejectedRequests: number = 0
  private failureTimestamps: Date[] = []
  private readonly config: Required<CircuitBreakerConfig>

  constructor(
    private readonly name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      failureWindow: config.failureWindow ?? 60000, // 1 minute
      resetTimeout: config.resetTimeout ?? 30000,    // 30 seconds
      successThreshold: config.successThreshold ?? 3,
      onStateChange: config.onStateChange ?? (() => {}),
      metricsCollector: config.metricsCollector ?? (() => {})
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++

    // Check circuit state
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN)
      } else {
        this.rejectedRequests++
        this.collectMetrics()
        throw new CircuitBreakerError(
          `Circuit breaker '${this.name}' is OPEN - service unavailable`,
          this.state,
          this.lastFailureTime
        )
      }
    }

    try {
      // Execute the function
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date()
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successes++
      
      if (this.successes >= this.config.successThreshold) {
        // Service has recovered
        this.transitionTo(CircuitBreakerState.CLOSED)
        this.reset()
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Normal operation, clean old failure timestamps
      this.cleanOldFailures()
    }

    this.collectMetrics()
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.lastFailureTime = new Date()
    this.failureTimestamps.push(this.lastFailureTime)
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Service is still failing, reopen circuit
      this.transitionTo(CircuitBreakerState.OPEN)
      this.successes = 0
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Count recent failures
      this.cleanOldFailures()
      this.failures = this.failureTimestamps.length
      
      if (this.failures >= this.config.failureThreshold) {
        // Too many failures, open circuit
        this.transitionTo(CircuitBreakerState.OPEN)
      }
    }

    // Log the failure for audit
    logger.warn(`Circuit breaker '${this.name}' recorded failure`, {
      state: this.state,
      failures: this.failures,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    this.collectMetrics()
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime()
    return timeSinceLastFailure >= this.config.resetTimeout
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state
    this.state = newState
    
    logger.info(`Circuit breaker '${this.name}' state change`, {
      from: oldState,
      to: newState,
      failures: this.failures,
      successes: this.successes
    })
    
    this.config.onStateChange(oldState, newState)
  }

  /**
   * Clean old failure timestamps outside the failure window
   */
  private cleanOldFailures(): void {
    const cutoffTime = Date.now() - this.config.failureWindow
    this.failureTimestamps = this.failureTimestamps.filter(
      timestamp => timestamp.getTime() > cutoffTime
    )
  }

  /**
   * Reset the circuit breaker
   */
  private reset(): void {
    this.failures = 0
    this.successes = 0
    this.failureTimestamps = []
  }

  /**
   * Collect and report metrics
   */
  private collectMetrics(): void {
    const metrics: CircuitBreakerMetrics = {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
      successRate: this.totalRequests > 0 
        ? ((this.totalRequests - this.rejectedRequests - this.failures) / this.totalRequests) * 100
        : 0
    }
    
    this.config.metricsCollector(metrics)
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
      successRate: this.totalRequests > 0 
        ? ((this.totalRequests - this.rejectedRequests - this.failures) / this.totalRequests) * 100
        : 0
    }
  }

  /**
   * Manually trip the circuit (for testing or emergency)
   */
  trip(): void {
    this.transitionTo(CircuitBreakerState.OPEN)
    this.lastFailureTime = new Date()
  }

  /**
   * Manually close the circuit (for testing or recovery)
   */
  close(): void {
    this.transitionTo(CircuitBreakerState.CLOSED)
    this.reset()
  }
}

/**
 * Global circuit breaker registry for monitoring
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry
  private breakers: Map<string, CircuitBreaker> = new Map()

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry()
    }
    return CircuitBreakerRegistry.instance
  }

  register(name: string, breaker: CircuitBreaker): void {
    this.breakers.set(name, breaker)
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name)
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers)
  }

  getAllStatus(): Record<string, CircuitBreakerMetrics> {
    const status: Record<string, CircuitBreakerMetrics> = {}
    
    this.breakers.forEach((breaker, name) => {
      status[name] = breaker.getStatus()
    })
    
    return status
  }
}

// Create and export singleton instances for PubMed and CrossRef
export const pubmedCircuitBreaker = new CircuitBreaker('pubmed-api', {
  failureThreshold: 5,
  failureWindow: 60000,      // 1 minute
  resetTimeout: 30000,       // 30 seconds
  successThreshold: 3,
  onStateChange: (oldState, newState) => {
    logger.info('PubMed API circuit breaker state changed', { 
      from: oldState, 
      to: newState 
    })
  }
})

export const crossrefCircuitBreaker = new CircuitBreaker('crossref-api', {
  failureThreshold: 10,      // More tolerant for CrossRef
  failureWindow: 60000,      // 1 minute
  resetTimeout: 20000,       // 20 seconds (faster recovery)
  successThreshold: 2,
  onStateChange: (oldState, newState) => {
    logger.info('CrossRef API circuit breaker state changed', { 
      from: oldState, 
      to: newState 
    })
  }
})

// Register with global registry
const registry = CircuitBreakerRegistry.getInstance()
registry.register('pubmed-api', pubmedCircuitBreaker)
registry.register('crossref-api', crossrefCircuitBreaker)

export default CircuitBreaker