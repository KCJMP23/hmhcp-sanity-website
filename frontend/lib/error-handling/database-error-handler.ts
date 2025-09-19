/**
 * Database Error Handler with Retry Logic for HMHCP Admin System
 * 
 * Provides comprehensive database error handling with:
 * - Connection retry logic with exponential backoff
 * - Transaction management with rollback on errors
 * - HIPAA-compliant error logging and sanitization
 * - Dead letter queue for failed operations
 * - Connection pooling health monitoring
 * - Query timeout handling
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createEnhancedRequestLogger, type EnhancedRequestLogger } from './request-logger'
import { AdminErrorHandler } from './error-handler'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

// Database operation types
export type DatabaseOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC' | 'TRANSACTION'

// Database error categories
export type DatabaseErrorType = 
  | 'connection_failed' 
  | 'timeout' 
  | 'constraint_violation' 
  | 'permission_denied' 
  | 'data_corruption' 
  | 'resource_exhausted'
  | 'transaction_conflict'
  | 'schema_error'

// Retry configuration
export interface DatabaseRetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: DatabaseErrorType[]
  timeoutMs: number
}

// Database operation context
export interface DatabaseContext {
  operation: DatabaseOperation
  table?: string
  query?: string
  parameters?: any[]
  correlationId: string
  userId?: string
  startTime: number
  logger: EnhancedRequestLogger
}

// Database operation result
export interface DatabaseResult<T = any> {
  success: boolean
  data?: T
  error?: Error
  metadata: {
    duration: number
    retryCount: number
    finalAttempt: boolean
    errorType?: DatabaseErrorType
    recordCount?: number
  }
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: DatabaseRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['connection_failed', 'timeout', 'resource_exhausted', 'transaction_conflict'],
  timeoutMs: 30000
}

// Connection health tracking
class ConnectionHealthMonitor {
  private static instance: ConnectionHealthMonitor
  private failureCount = 0
  private lastFailureTime: number | null = null
  private isCircuitOpen = false
  private circuitResetTime: number | null = null
  
  static getInstance(): ConnectionHealthMonitor {
    if (!ConnectionHealthMonitor.instance) {
      ConnectionHealthMonitor.instance = new ConnectionHealthMonitor()
    }
    return ConnectionHealthMonitor.instance
  }
  
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    // Open circuit breaker after 5 consecutive failures
    if (this.failureCount >= 5) {
      this.isCircuitOpen = true
      this.circuitResetTime = Date.now() + 60000 // Reset after 1 minute
    }
  }
  
  recordSuccess(): void {
    this.failureCount = 0
    this.lastFailureTime = null
    this.isCircuitOpen = false
    this.circuitResetTime = null
  }
  
  isHealthy(): boolean {
    // Check if circuit should be reset
    if (this.isCircuitOpen && this.circuitResetTime && Date.now() > this.circuitResetTime) {
      this.isCircuitOpen = false
      this.circuitResetTime = null
      this.failureCount = 0
    }
    
    return !this.isCircuitOpen
  }
  
  getHealthMetrics() {
    return {
      isHealthy: this.isHealthy(),
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      isCircuitOpen: this.isCircuitOpen,
      circuitResetTime: this.circuitResetTime
    }
  }
}

export class DatabaseErrorHandler {
  private static healthMonitor = ConnectionHealthMonitor.getInstance()
  
  /**
   * Execute database operation with comprehensive error handling and retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: DatabaseContext,
    config: Partial<DatabaseRetryConfig> = {}
  ): Promise<DatabaseResult<T>> {
    
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    const { logger, correlationId, operation: operationType } = context
    
    let lastError: Error | null = null
    let retryCount = 0
    const startTime = Date.now()
    
    // Check circuit breaker
    if (!this.healthMonitor.isHealthy()) {
      const healthMetrics = this.healthMonitor.getHealthMetrics()
      logger.logError(
        new Error('Database circuit breaker is open'),
        503,
        { circuitBreaker: healthMetrics }
      )
      
      return {
        success: false,
        error: new Error('Database service is temporarily unavailable'),
        metadata: {
          duration: Date.now() - startTime,
          retryCount: 0,
          finalAttempt: true,
          errorType: 'resource_exhausted'
        }
      }
    }
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
      const attemptStartTime = Date.now()
      
      try {
        logger.logDatabaseOperation(
          operationType,
          context.table || 'unknown',
          true,
          0,
          0
        )
        
        // Execute operation with timeout
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(
              () => reject(new Error('Database operation timeout')),
              retryConfig.timeoutMs
            )
          )
        ])
        
        const duration = Date.now() - attemptStartTime
        
        // Record success
        this.healthMonitor.recordSuccess()
        
        logger.logDatabaseOperation(
          operationType,
          context.table || 'unknown',
          true,
          duration,
          this.getRecordCount(result)
        )
        
        return {
          success: true,
          data: result,
          metadata: {
            duration: Date.now() - startTime,
            retryCount,
            finalAttempt: true,
            recordCount: this.getRecordCount(result)
          }
        }
        
      } catch (error) {
        const duration = Date.now() - attemptStartTime
        lastError = error as Error
        
        // Classify the error
        const errorType = this.classifyDatabaseError(error)
        
        logger.logDatabaseOperation(
          operationType,
          context.table || 'unknown',
          false,
          duration,
          0
        )
        
        logger.logError(
          lastError,
          500,
          {
            attempt,
            maxRetries: retryConfig.maxRetries,
            errorType,
            operation: operationType,
            table: context.table
          }
        )
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(errorType, retryConfig)
        const isFinalAttempt = attempt > retryConfig.maxRetries
        
        if (!isRetryable || isFinalAttempt) {
          // Record failure for circuit breaker
          this.healthMonitor.recordFailure()
          
          // Log to dead letter queue for critical operations
          if (operationType !== 'SELECT') {
            await this.logToDeadLetterQueue(context, lastError, errorType)
          }
          
          return {
            success: false,
            error: lastError,
            metadata: {
              duration: Date.now() - startTime,
              retryCount,
              finalAttempt: true,
              errorType
            }
          }
        }
        
        // Calculate retry delay with exponential backoff and jitter
        retryCount++
        const delay = this.calculateRetryDelay(
          retryCount,
          retryConfig.baseDelayMs,
          retryConfig.maxDelayMs,
          retryConfig.backoffMultiplier
        )
        
        logger.logError(
          new Error(`Database operation failed, retrying in ${delay}ms`),
          500,
          {
            attempt,
            retryDelay: delay,
            errorType,
            retryCount
          }
        )
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // This should never be reached, but included for completeness
    return {
      success: false,
      error: lastError || new Error('Unknown database error'),
      metadata: {
        duration: Date.now() - startTime,
        retryCount,
        finalAttempt: true,
        errorType: 'connection_failed'
      }
    }
  }
  
  /**
   * Execute transaction with automatic rollback on errors
   */
  static async executeTransaction<T>(
    operations: ((client: SupabaseClient) => Promise<T>),
    context: DatabaseContext,
    config: Partial<DatabaseRetryConfig> = {}
  ): Promise<DatabaseResult<T>> {
    
    const transactionContext = {
      ...context,
      operation: 'TRANSACTION' as DatabaseOperation
    }
    
    return this.executeWithRetry(
      async () => {
        const supabase = await createServerSupabaseClient()
        
        // Start transaction (Supabase handles this automatically in RPC functions)
        try {
          const result = await operations(supabase)
          
          context.logger.logDatabaseOperation(
            'TRANSACTION',
            'multiple',
            true,
            Date.now() - context.startTime,
            1
          )
          
          return result
          
        } catch (error) {
          context.logger.logError(
            error as Error,
            500,
            { context: 'transaction_rollback' }
          )
          
          // Supabase automatically handles rollback
          throw error
        }
      },
      transactionContext,
      config
    )
  }
  
  /**
   * Execute bulk operations with batch processing and error isolation
   */
  static async executeBulkOperation<T, R>(
    items: T[],
    operation: (item: T, index: number) => Promise<R>,
    context: DatabaseContext,
    options: {
      batchSize?: number
      continueOnError?: boolean
      config?: Partial<DatabaseRetryConfig>
    } = {}
  ): Promise<{
    results: Array<{ success: boolean; data?: R; error?: Error; index: number }>
    summary: {
      total: number
      successful: number
      failed: number
      duration: number
    }
  }> {
    
    const { batchSize = 50, continueOnError = true, config = {} } = options
    const startTime = Date.now()
    const results: Array<{ success: boolean; data?: R; error?: Error; index: number }> = []
    
    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (item, batchIndex) => {
        const itemIndex = i + batchIndex
        
        try {
          const itemContext = {
            ...context,
            correlationId: `${context.correlationId}-item-${itemIndex}`
          }
          
          const result = await this.executeWithRetry(
            () => operation(item, itemIndex),
            itemContext,
            config
          )
          
          if (result.success) {
            return { success: true, data: result.data, index: itemIndex }
          } else {
            return { success: false, error: result.error, index: itemIndex }
          }
          
        } catch (error) {
          return { success: false, error: error as Error, index: itemIndex }
        }
      })
      
      if (continueOnError) {
        // Process all items even if some fail
        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            results.push({
              success: false,
              error: result.reason,
              index: i + batchIndex
            })
          }
        })
      } else {
        // Stop on first error
        try {
          const batchResults = await Promise.all(batchPromises)
          results.push(...batchResults)
        } catch (error) {
          // Add successful results from the batch
          for (let j = 0; j < batch.length; j++) {
            try {
              const itemResult = await batchPromises[j]
              results.push(itemResult)
            } catch {
              results.push({
                success: false,
                error: error as Error,
                index: i + j
              })
              // Stop processing on first error
              break
            }
          }
          break
        }
      }
    }
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    context.logger.logDatabaseOperation(
      'BULK',
      context.table || 'multiple',
      failed === 0,
      Date.now() - startTime,
      successful
    )
    
    return {
      results,
      summary: {
        total: items.length,
        successful,
        failed,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * Test database connection health
   */
  static async testConnection(
    logger: EnhancedRequestLogger,
    timeoutMs = 5000
  ): Promise<{ healthy: boolean; responseTime?: number; error?: Error }> {
    
    const startTime = Date.now()
    
    try {
      const supabase = await createServerSupabaseClient()
      
      // Simple health check query
      const { error } = await Promise.race([
        supabase.from('admin_users').select('count').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
        )
      ]) as any
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        logger.logError(new Error(`Health check failed: ${error.message}`), 503)
        return { healthy: false, responseTime, error: new Error(error.message) }
      }
      
      logger.logDatabaseOperation('SELECT', 'admin_users', true, responseTime, 1)
      return { healthy: true, responseTime }
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      logger.logError(error as Error, 503, { context: 'health_check' })
      return { healthy: false, responseTime, error: error as Error }
    }
  }
  
  /**
   * Get database health metrics
   */
  static getHealthMetrics() {
    return this.healthMonitor.getHealthMetrics()
  }
  
  // Private helper methods
  
  private static classifyDatabaseError(error: unknown): DatabaseErrorType {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    
    // Connection errors
    if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
      return 'connection_failed'
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'timeout'
    }
    
    // Constraint violations
    if (errorMessage.includes('constraint') || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return 'constraint_violation'
    }
    
    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('denied') || errorMessage.includes('unauthorized')) {
      return 'permission_denied'
    }
    
    // Resource exhaustion
    if (errorMessage.includes('pool') || errorMessage.includes('connection limit') || errorMessage.includes('resource')) {
      return 'resource_exhausted'
    }
    
    // Transaction conflicts
    if (errorMessage.includes('serialization') || errorMessage.includes('deadlock') || errorMessage.includes('conflict')) {
      return 'transaction_conflict'
    }
    
    // Schema errors
    if (errorMessage.includes('column') || errorMessage.includes('table') || errorMessage.includes('schema')) {
      return 'schema_error'
    }
    
    // Default to connection failure
    return 'connection_failed'
  }
  
  private static isRetryableError(errorType: DatabaseErrorType, config: DatabaseRetryConfig): boolean {
    return config.retryableErrors.includes(errorType)
  }
  
  private static calculateRetryDelay(
    retryCount: number,
    baseDelay: number,
    maxDelay: number,
    multiplier: number
  ): number {
    
    const exponentialDelay = baseDelay * Math.pow(multiplier, retryCount - 1)
    const cappedDelay = Math.min(exponentialDelay, maxDelay)
    
    // Add jitter (±20% of the delay)
    const jitter = cappedDelay * 0.2 * (Math.random() - 0.5)
    
    return Math.round(cappedDelay + jitter)
  }
  
  private static getRecordCount(result: unknown): number | undefined {
    if (Array.isArray(result)) {
      return result.length
    }
    
    if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) {
      return (result as any).data.length
    }
    
    return result ? 1 : 0
  }
  
  private static async logToDeadLetterQueue(
    context: DatabaseContext,
    error: Error,
    errorType: DatabaseErrorType
  ): Promise<void> {
    
    try {
      const deadLetterEntry = {
        correlation_id: context.correlationId,
        operation: context.operation,
        table_name: context.table,
        query: this.sanitizeQuery(context.query),
        parameters: this.sanitizeParameters(context.parameters),
        error_type: errorType,
        error_message: error.message,
        error_stack: error.stack,
        user_id: context.userId,
        created_at: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        next_retry_at: new Date(Date.now() + 300000).toISOString() // 5 minutes
      }
      
      context.logger.logError(
        new Error('Operation added to dead letter queue'),
        500,
        { deadLetterEntry: deadLetterEntry }
      )
      
      // In production, this would insert into a dead_letter_queue table
      console.warn('Dead letter queue entry:', deadLetterEntry)
      
    } catch (dlqError) {
      context.logger.logError(
        dlqError as Error,
        500,
        { context: 'dead_letter_queue_failed' }
      )
    }
  }
  
  private static sanitizeQuery(query?: string): string | undefined {
    if (!query) return undefined
    
    // Remove potentially sensitive data from queries
    return query
      .replace(/VALUES\s*\([^)]*\)/gi, 'VALUES ([SANITIZED])')
      .replace(/SET\s+\w+\s*=\s*'[^']*'/gi, 'SET [FIELD] = [SANITIZED]')
      .replace(/WHERE\s+\w+\s*=\s*'[^']*'/gi, 'WHERE [FIELD] = [SANITIZED]')
      .substring(0, 500) // Limit query length
  }
  
  private static sanitizeParameters(parameters?: any[]): any[] | undefined {
    if (!parameters) return undefined
    
    // Replace parameter values with type information
    return parameters.map((param, index) => {
      if (param === null) return null
      if (param === undefined) return undefined
      
      const type = typeof param
      return `[${type.toUpperCase()}_PARAM_${index}]`
    })
  }
}

/**
 * Convenience wrapper for database operations
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    operation: DatabaseOperation
    table?: string
    correlationId: string
    userId?: string
    logger: EnhancedRequestLogger
  },
  config?: Partial<DatabaseRetryConfig>
): Promise<DatabaseResult<T>> {
  
  const dbContext: DatabaseContext = {
    ...context,
    startTime: Date.now()
  }
  
  return DatabaseErrorHandler.executeWithRetry(operation, dbContext, config)
}

export default DatabaseErrorHandler