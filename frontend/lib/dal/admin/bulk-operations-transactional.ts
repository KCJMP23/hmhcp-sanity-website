/**
 * Transactional Bulk Operations Manager
 * Enhanced bulk operations with comprehensive transaction rollback support
 * Ensures data integrity even under extreme failure conditions
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { memoryManager } from '@/lib/memory/memory-manager'
import DatabaseTransactionManager, {
  TransactionExecutionContext,
  TransactionResult,
  TransactionStatus,
  TransactionIsolationLevel
} from './transaction-manager'
import { DataAccessContext } from './types'
import { EventEmitter } from 'events'

// ================================
// Enhanced Bulk Operation Types
// ================================

export interface TransactionalBulkConfig {
  tableName: string
  operation: 'insert' | 'update' | 'delete' | 'upsert'
  data?: any[]
  filter?: Record<string, any>
  batchSize?: number
  maxConcurrent?: number
  dryRun?: boolean
  
  // Transaction-specific options
  isolationLevel?: TransactionIsolationLevel
  timeout?: number
  enableSavepoints?: boolean
  savepointFrequency?: number // Create savepoint every N operations
  rollbackStrategy?: BulkRollbackStrategy
  integrityChecks?: IntegrityCheckConfig[]
  
  // Error handling
  continueOnError?: boolean
  maxErrors?: number
  errorThreshold?: number // Percentage of operations that can fail
  retryFailedItems?: boolean
  
  // Callbacks
  progressCallback?: (progress: TransactionalBulkProgress) => void
  errorHandler?: (error: BulkOperationError, context: ErrorContext) => BulkErrorAction
  validateFn?: (item: any) => Promise<boolean>
  transformFn?: (item: any) => Promise<any>
  integrityValidator?: (operations: any[]) => Promise<IntegrityValidation[]>
}

export interface TransactionalBulkProgress {
  transactionId: string
  operation: string
  tableName: string
  total: number
  processed: number
  succeeded: number
  failed: number
  skipped: number
  percentage: number
  estimatedTimeRemaining: number
  currentBatch: number
  totalBatches: number
  savepointsCreated: number
  rollbacksPerformed: number
  memoryUsage: number
  throughput: number
  integrityIssues: number
  
  // Error tracking
  errors: BulkOperationError[]
  lastError?: BulkOperationError
  errorRate: number
  
  // Performance metrics
  averageOperationTime: number
  deadlockRetries: number
  connectionRetries: number
  
  // Status
  status: BulkOperationStatus
  phase: BulkOperationPhase
}

export interface TransactionalBulkResult {
  success: boolean
  transactionId: string
  processed: number
  succeeded: number
  failed: number
  skipped: number
  duration: number
  rollbackPerformed: boolean
  rollbackReason?: string
  
  // Detailed results
  errors: BulkOperationError[]
  savepointsUsed: number
  integrityViolations: IntegrityValidation[]
  performanceMetrics: BulkPerformanceMetrics
  
  // Recovery information
  recoveryData?: BulkRecoveryData
  partialResults?: PartialResult[]
}

export interface BulkOperationError {
  id: string
  type: BulkErrorType
  message: string
  item: any
  batchIndex: number
  itemIndex: number
  timestamp: number
  retryCount: number
  recoverable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Context information
  operation: string
  tableName: string
  transactionId: string
  savepointId?: string
  
  // Technical details
  sqlError?: any
  constraintViolation?: string
  deadlock?: boolean
  timeout?: boolean
}

export interface BulkPerformanceMetrics {
  totalDuration: number
  preparationTime: number
  executionTime: number
  validationTime: number
  rollbackTime: number
  
  // Throughput metrics
  operationsPerSecond: number
  rowsPerSecond: number
  batchesPerSecond: number
  
  // Resource usage
  memoryPeakUsage: number
  connectionsUsed: number
  deadlockCount: number
  savepointCount: number
  
  // Database metrics
  lockWaitTime: number
  indexUsage: string[]
  constraintChecks: number
}

export interface BulkRecoveryData {
  failedItems: any[]
  successfulItems: any[]
  rollbackData: any[]
  lastValidSavepoint?: string
  recoverableErrors: BulkOperationError[]
  suggestedActions: RecoveryAction[]
}

export interface PartialResult {
  batchIndex: number
  status: 'success' | 'partial' | 'failed'
  processedItems: number
  errors: BulkOperationError[]
  rollbackToSavepoint?: string
}

export interface IntegrityCheckConfig {
  type: 'foreign_key' | 'unique' | 'check' | 'not_null' | 'custom'
  constraint?: string
  validator?: (items: any[]) => Promise<IntegrityValidation[]>
  onViolation: 'abort' | 'skip' | 'fix' | 'ignore'
  autoFix?: (item: any, violation: IntegrityValidation) => any
}

export interface IntegrityValidation {
  id: string
  type: string
  constraint: string
  isValid: boolean
  violationDetails: string
  affectedItems: any[]
  severity: 'error' | 'warning'
  fixable: boolean
  suggestedFix?: any
}

export interface ErrorContext {
  transactionId: string
  batchIndex: number
  itemIndex: number
  operation: string
  tableName: string
  attemptNumber: number
  previousErrors: BulkOperationError[]
}

export interface RecoveryAction {
  type: 'retry' | 'skip' | 'rollback_to_savepoint' | 'manual_intervention' | 'partial_rollback'
  description: string
  automated: boolean
  riskLevel: 'low' | 'medium' | 'high'
  estimatedTime?: number
}

export enum BulkOperationStatus {
  INITIALIZING = 'initializing',
  VALIDATING = 'validating',
  EXECUTING = 'executing',
  COMPLETING = 'completing',
  ROLLING_BACK = 'rolling_back',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL_SUCCESS = 'partial_success'
}

export enum BulkOperationPhase {
  PREPARATION = 'preparation',
  INTEGRITY_CHECKS = 'integrity_checks',
  BATCH_PROCESSING = 'batch_processing',
  SAVEPOINT_MANAGEMENT = 'savepoint_management',
  VALIDATION = 'validation',
  FINALIZATION = 'finalization',
  ROLLBACK = 'rollback',
  CLEANUP = 'cleanup'
}

export enum BulkErrorType {
  VALIDATION_ERROR = 'validation_error',
  CONSTRAINT_VIOLATION = 'constraint_violation',
  DEADLOCK = 'deadlock',
  TIMEOUT = 'timeout',
  MEMORY_ERROR = 'memory_error',
  CONNECTION_ERROR = 'connection_error',
  INTEGRITY_VIOLATION = 'integrity_violation',
  BUSINESS_RULE_VIOLATION = 'business_rule_violation',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum BulkErrorAction {
  CONTINUE = 'continue',
  SKIP_ITEM = 'skip_item',
  RETRY_ITEM = 'retry_item',
  ROLLBACK_BATCH = 'rollback_batch',
  ROLLBACK_TO_SAVEPOINT = 'rollback_to_savepoint',
  ABORT_OPERATION = 'abort_operation'
}

export enum BulkRollbackStrategy {
  COMPLETE = 'complete',           // Rollback entire operation
  BATCH_LEVEL = 'batch_level',     // Rollback failed batches only
  SAVEPOINT_LEVEL = 'savepoint_level', // Rollback to last savepoint
  ITEM_LEVEL = 'item_level',       // Skip failed items, keep successful ones
  MANUAL = 'manual'                // Manual rollback decision
}

// ================================
// Transactional Bulk Operations Manager
// ================================

export class TransactionalBulkOperationsManager extends EventEmitter {
  private supabase: SupabaseClient
  private transactionManager: DatabaseTransactionManager
  private activeOperations = new Map<string, TransactionalBulkProgress>()
  
  private readonly maxActiveOperations = 5
  private readonly defaultBatchSize = 100
  private readonly defaultSavepointFrequency = 10 // Every 10 batches

  constructor(supabase: SupabaseClient) {
    super()
    this.supabase = supabase
    this.transactionManager = new DatabaseTransactionManager(supabase)
    
    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Execute transactional bulk operation with comprehensive rollback support
   */
  async executeBulkTransactional(
    config: TransactionalBulkConfig,
    userContext?: DataAccessContext
  ): Promise<TransactionalBulkResult> {
    const operationId = this.generateOperationId()
    const startTime = Date.now()
    
    // Validate configuration
    this.validateConfig(config)
    
    // Check operation limits
    if (this.activeOperations.size >= this.maxActiveOperations) {
      throw new Error('Maximum number of concurrent bulk operations reached')
    }

    // Initialize progress tracking
    const progress = this.initializeProgress(operationId, config)
    this.activeOperations.set(operationId, progress)
    
    this.emit('operation:started', { operationId, config, progress })

    try {
      // Execute within transaction with comprehensive error handling
      const transactionResult = await this.transactionManager.executeTransaction(
        async (txContext: TransactionExecutionContext) => {
          progress.transactionId = txContext.transactionId
          progress.status = BulkOperationStatus.EXECUTING
          
          return await this.executeOperationInTransaction(config, progress, txContext)
        },
        {
          isolationLevel: config.isolationLevel || 'READ_COMMITTED',
          timeout: config.timeout || 300000, // 5 minutes default
          retryCount: 3
        },
        userContext
      )

      // Process transaction result
      const result = this.createBulkResult(progress, transactionResult, startTime)
      
      this.emit('operation:completed', { operationId, result })
      return result

    } catch (error) {
      // Handle critical errors
      const result = this.createErrorResult(progress, error, startTime)
      
      this.emit('operation:failed', { operationId, error, result })
      return result

    } finally {
      this.activeOperations.delete(operationId)
    }
  }

  /**
   * Execute operation within transaction context
   */
  private async executeOperationInTransaction(
    config: TransactionalBulkConfig,
    progress: TransactionalBulkProgress,
    txContext: TransactionExecutionContext
  ): Promise<any> {
    // Phase 1: Preparation and validation
    progress.phase = BulkOperationPhase.PREPARATION
    await this.prepareOperation(config, progress)
    
    // Phase 2: Integrity checks
    if (config.integrityChecks?.length) {
      progress.phase = BulkOperationPhase.INTEGRITY_CHECKS
      await this.performIntegrityChecks(config, progress)
    }

    // Phase 3: Batch processing with savepoints
    progress.phase = BulkOperationPhase.BATCH_PROCESSING
    const result = await this.processBatchesWithSavepoints(config, progress, txContext)
    
    // Phase 4: Final validation
    progress.phase = BulkOperationPhase.VALIDATION
    await this.performFinalValidation(config, progress, result)
    
    // Phase 5: Finalization
    progress.phase = BulkOperationPhase.FINALIZATION
    return await this.finalizeOperation(config, progress, result)
  }

  /**
   * Process batches with savepoint management
   */
  private async processBatchesWithSavepoints(
    config: TransactionalBulkConfig,
    progress: TransactionalBulkProgress,
    txContext: TransactionExecutionContext
  ): Promise<any[]> {
    if (!config.data || config.data.length === 0) {
      return []
    }

    const batchSize = this.calculateOptimalBatchSize(config.batchSize)
    const batches = this.createBatches(config.data, batchSize)
    const results: any[] = []
    
    progress.totalBatches = batches.length
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      progress.currentBatch = batchIndex + 1
      
      try {
        // Create savepoint if enabled
        let savepointName: string | undefined
        if (config.enableSavepoints && 
            batchIndex % (config.savepointFrequency || this.defaultSavepointFrequency) === 0) {
          savepointName = `bulk_sp_${batchIndex}`
          const savepointResult = await txContext.createSavepoint(savepointName)
          
          if (savepointResult.success) {
            progress.savepointsCreated++
            logger.debug('Savepoint created for bulk operation', {
              transactionId: txContext.transactionId,
              savepointName,
              batchIndex
            })
          }
        }

        // Process batch with error handling
        const batchResult = await this.processBatch(
          config,
          batch,
          batchIndex,
          progress,
          txContext
        )
        
        results.push(...batchResult.items)
        progress.succeeded += batchResult.succeeded
        progress.failed += batchResult.failed
        progress.skipped += batchResult.skipped
        
        // Handle batch errors
        if (batchResult.errors.length > 0) {
          progress.errors.push(...batchResult.errors)
          
          const shouldRollback = await this.handleBatchErrors(
            batchResult.errors,
            config,
            progress,
            txContext,
            savepointName
          )
          
          if (shouldRollback) {
            break
          }
        }
        
        // Update progress
        progress.processed += batch.length
        this.updateProgress(progress)
        
        if (config.progressCallback) {
          config.progressCallback(progress)
        }
        
        // Check error thresholds
        if (this.shouldAbortOperation(config, progress)) {
          throw new Error(`Operation aborted: error threshold exceeded (${progress.errorRate}%)`)
        }
        
        // Memory pressure check
        if (!memoryManager.canAllocate(batch.length * 1000)) {
          logger.warn('Memory pressure detected, pausing bulk operation')
          await this.delay(1000)
        }

      } catch (error) {
        const bulkError = this.createBulkError(
          error,
          config,
          batchIndex,
          -1,
          progress.transactionId
        )
        
        progress.errors.push(bulkError)
        progress.lastError = bulkError
        
        // Handle critical batch error
        const action = config.errorHandler ? 
          await config.errorHandler(bulkError, {
            transactionId: progress.transactionId,
            batchIndex,
            itemIndex: -1,
            operation: config.operation,
            tableName: config.tableName,
            attemptNumber: 1,
            previousErrors: progress.errors
          }) : BulkErrorAction.ABORT_OPERATION

        if (action === BulkErrorAction.ABORT_OPERATION) {
          throw error
        }
        
        if (action === BulkErrorAction.ROLLBACK_TO_SAVEPOINT && savepointName) {
          const rollbackResult = await txContext.rollbackToSavepoint(
            savepointName,
            `Batch ${batchIndex} failed: ${bulkError.message}`
          )
          
          if (rollbackResult.success) {
            progress.rollbacksPerformed++
            logger.info('Rolled back to savepoint after batch failure', {
              transactionId: progress.transactionId,
              savepointName,
              batchIndex,
              affectedOperations: rollbackResult.affectedOperations
            })
          }
        }
      }
      
      // Add small delay between batches to prevent overwhelming the database
      if (batchIndex < batches.length - 1) {
        await this.delay(50)
      }
    }
    
    return results
  }

  /**
   * Process a single batch
   */
  private async processBatch(
    config: TransactionalBulkConfig,
    batch: any[],
    batchIndex: number,
    progress: TransactionalBulkProgress,
    txContext: TransactionExecutionContext
  ): Promise<{
    items: any[]
    succeeded: number
    failed: number
    skipped: number
    errors: BulkOperationError[]
  }> {
    const batchResult = {
      items: [] as any[],
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as BulkOperationError[]
    }

    // Memory allocation check
    const memoryAllocation = memoryManager.allocate(
      batch.length * 1000,
      `bulk_${config.operation}`
    )
    
    if (!memoryAllocation) {
      throw new Error('Unable to allocate memory for batch processing')
    }

    try {
      // Validate and transform batch items
      const processedBatch: any[] = []
      
      for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
        const item = batch[itemIndex]
        
        try {
          // Validate item if validator provided
          if (config.validateFn) {
            const isValid = await config.validateFn(item)
            if (!isValid) {
              batchResult.skipped++
              continue
            }
          }
          
          // Transform item if transformer provided
          const processedItem = config.transformFn ? 
            await config.transformFn(item) : item
          
          processedBatch.push(processedItem)
          
        } catch (error) {
          const bulkError = this.createBulkError(
            error,
            config,
            batchIndex,
            itemIndex,
            progress.transactionId
          )
          
          batchResult.errors.push(bulkError)
          
          if (!config.continueOnError) {
            throw error
          }
          
          batchResult.failed++
        }
      }

      // Execute database operation if not dry run
      if (processedBatch.length > 0 && !config.dryRun) {
        const dbResult = await this.executeDatabaseOperation(
          config,
          processedBatch,
          txContext
        )
        
        if (dbResult.success) {
          batchResult.items = dbResult.data || []
          batchResult.succeeded += processedBatch.length
          
          // Record operation for transaction tracking
          txContext.recordOperation({
            type: config.operation.toUpperCase() as any,
            table: config.tableName,
            data: processedBatch,
            affectedRows: processedBatch.length,
            duration: 0
          })
          
        } else {
          const dbError = this.createBulkError(
            new Error(dbResult.error || 'Database operation failed'),
            config,
            batchIndex,
            -1,
            progress.transactionId
          )
          
          batchResult.errors.push(dbError)
          batchResult.failed += processedBatch.length
        }
        
      } else if (config.dryRun) {
        // Dry run - simulate success
        batchResult.items = processedBatch
        batchResult.succeeded += processedBatch.length
      }

    } finally {
      memoryManager.release(memoryAllocation)
    }

    return batchResult
  }

  /**
   * Execute database operation based on type
   */
  private async executeDatabaseOperation(
    config: TransactionalBulkConfig,
    items: any[],
    txContext: TransactionExecutionContext
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      let result: any

      switch (config.operation) {
        case 'insert':
          result = await this.supabase
            .from(config.tableName)
            .insert(items)
            .select()
          break

        case 'update':
          // For bulk updates, items should have id and update data
          const updatePromises = items.map(item => {
            const { id, ...updateData } = item
            return this.supabase
              .from(config.tableName)
              .update(updateData)
              .eq('id', id)
              .select()
          })
          
          result = await Promise.all(updatePromises)
          break

        case 'delete':
          const ids = items.map(item => 
            typeof item === 'string' ? item : item.id
          ).filter(Boolean)
          
          result = await this.supabase
            .from(config.tableName)
            .delete()
            .in('id', ids)
          break

        case 'upsert':
          result = await this.supabase
            .from(config.tableName)
            .upsert(items, { onConflict: 'id' })
            .select()
          break

        default:
          throw new Error(`Unsupported operation: ${config.operation}`)
      }

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true, data: result.data }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Handle batch errors and determine rollback strategy
   */
  private async handleBatchErrors(
    errors: BulkOperationError[],
    config: TransactionalBulkConfig,
    progress: TransactionalBulkProgress,
    txContext: TransactionExecutionContext,
    savepointName?: string
  ): Promise<boolean> {
    const criticalErrors = errors.filter(e => e.severity === 'critical')
    
    if (criticalErrors.length > 0) {
      logger.error('Critical errors detected in bulk operation', {
        transactionId: progress.transactionId,
        criticalErrorCount: criticalErrors.length,
        totalErrors: errors.length
      })
      
      // Always rollback on critical errors
      return true
    }
    
    // Apply rollback strategy
    switch (config.rollbackStrategy) {
      case BulkRollbackStrategy.COMPLETE:
        return errors.length > 0
        
      case BulkRollbackStrategy.BATCH_LEVEL:
        return errors.length > config.batchSize! * 0.5 // More than 50% of batch failed
        
      case BulkRollbackStrategy.SAVEPOINT_LEVEL:
        if (savepointName && errors.length > 0) {
          const rollbackResult = await txContext.rollbackToSavepoint(
            savepointName,
            `Batch errors: ${errors.map(e => e.message).join('; ')}`
          )
          progress.rollbacksPerformed += rollbackResult.success ? 1 : 0
          return false // Continue operation after savepoint rollback
        }
        return false
        
      case BulkRollbackStrategy.ITEM_LEVEL:
        return false // Never rollback, handle individual item errors
        
      default:
        return false
    }
  }

  /**
   * Check if operation should be aborted based on error thresholds
   */
  private shouldAbortOperation(
    config: TransactionalBulkConfig,
    progress: TransactionalBulkProgress
  ): boolean {
    if (config.maxErrors && progress.failed >= config.maxErrors) {
      return true
    }
    
    if (config.errorThreshold && progress.processed > 0) {
      progress.errorRate = (progress.failed / progress.processed) * 100
      return progress.errorRate > config.errorThreshold
    }
    
    return false
  }

  /**
   * Perform integrity checks before operation
   */
  private async performIntegrityChecks(
    config: TransactionalBulkConfig,
    progress: TransactionalBulkProgress
  ): Promise<void> {
    if (!config.integrityChecks?.length || !config.data?.length) {
      return
    }

    for (const check of config.integrityChecks) {
      if (check.validator) {
        const violations = await check.validator(config.data)
        
        if (violations.length > 0) {
          progress.integrityIssues += violations.length
          
          switch (check.onViolation) {
            case 'abort':
              throw new Error(`Integrity check failed: ${violations.map(v => v.violationDetails).join('; ')}`)
              
            case 'fix':
              if (check.autoFix) {
                for (const violation of violations) {
                  violation.affectedItems.forEach(item => {
                    check.autoFix!(item, violation)
                  })
                }
              }
              break
              
            case 'skip':
              // Remove violating items from data
              const violatingItems = new Set(violations.flatMap(v => v.affectedItems))
              config.data = config.data.filter(item => !violatingItems.has(item))
              break
              
            case 'ignore':
              // Log warnings but continue
              logger.warn('Integrity violations detected but ignored', {
                checkType: check.type,
                violationCount: violations.length,
                violations: violations.map(v => v.violationDetails)
              })
              break
          }
        }
      }
    }
  }

  /**
   * Perform final validation after operation
   */
  private async performFinalValidation(
    config: TransactionalBulkConfig,
    progress: TransactionalBulkProgress,
    result: any
  ): Promise<void> {
    if (config.integrityValidator) {
      const violations = await config.integrityValidator(result)
      
      if (violations.length > 0) {
        progress.integrityIssues += violations.length
        
        logger.error('Final integrity validation failed', {
          transactionId: progress.transactionId,
          violationCount: violations.length,
          violations: violations.map(v => v.violationDetails)
        })
        
        throw new Error(`Final validation failed: ${violations.length} integrity violations`)
      }
    }
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(
    operationId: string,
    config: TransactionalBulkConfig
  ): TransactionalBulkProgress {
    return {
      transactionId: '',
      operation: config.operation,
      tableName: config.tableName,
      total: config.data?.length || 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      currentBatch: 0,
      totalBatches: 0,
      savepointsCreated: 0,
      rollbacksPerformed: 0,
      memoryUsage: 0,
      throughput: 0,
      integrityIssues: 0,
      errors: [],
      errorRate: 0,
      averageOperationTime: 0,
      deadlockRetries: 0,
      connectionRetries: 0,
      status: BulkOperationStatus.INITIALIZING,
      phase: BulkOperationPhase.PREPARATION
    }
  }

  /**
   * Create bulk operation error
   */
  private createBulkError(
    error: any,
    config: TransactionalBulkConfig,
    batchIndex: number,
    itemIndex: number,
    transactionId: string
  ): BulkOperationError {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return {
      id: this.generateId(),
      type: this.classifyError(error),
      message: errorMessage,
      item: batchIndex >= 0 && itemIndex >= 0 && config.data ? config.data[batchIndex * (config.batchSize || 100) + itemIndex] : null,
      batchIndex,
      itemIndex,
      timestamp: Date.now(),
      retryCount: 0,
      recoverable: this.isRecoverableError(error),
      severity: this.getErrorSeverity(error),
      operation: config.operation,
      tableName: config.tableName,
      transactionId,
      deadlock: this.isDeadlockError(error),
      timeout: this.isTimeoutError(error),
      sqlError: error
    }
  }

  /**
   * Classify error type
   */
  private classifyError(error: any): BulkErrorType {
    const message = error?.message?.toLowerCase() || ''
    
    if (message.includes('deadlock')) return BulkErrorType.DEADLOCK
    if (message.includes('timeout')) return BulkErrorType.TIMEOUT
    if (message.includes('constraint') || message.includes('violates')) return BulkErrorType.CONSTRAINT_VIOLATION
    if (message.includes('connection')) return BulkErrorType.CONNECTION_ERROR
    if (message.includes('memory') || message.includes('oom')) return BulkErrorType.MEMORY_ERROR
    if (message.includes('validation')) return BulkErrorType.VALIDATION_ERROR
    if (message.includes('integrity')) return BulkErrorType.INTEGRITY_VIOLATION
    
    return BulkErrorType.UNKNOWN_ERROR
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverableError(error: any): boolean {
    const type = this.classifyError(error)
    return [
      BulkErrorType.DEADLOCK,
      BulkErrorType.TIMEOUT,
      BulkErrorType.CONNECTION_ERROR,
      BulkErrorType.MEMORY_ERROR
    ].includes(type)
  }

  /**
   * Get error severity
   */
  private getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const type = this.classifyError(error)
    
    switch (type) {
      case BulkErrorType.INTEGRITY_VIOLATION:
      case BulkErrorType.CONSTRAINT_VIOLATION:
        return 'critical'
      case BulkErrorType.DEADLOCK:
      case BulkErrorType.MEMORY_ERROR:
        return 'high'
      case BulkErrorType.TIMEOUT:
      case BulkErrorType.CONNECTION_ERROR:
        return 'medium'
      default:
        return 'low'
    }
  }

  /**
   * Check if error is a deadlock
   */
  private isDeadlockError(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    return message.includes('deadlock') || message.includes('serialization failure')
  }

  /**
   * Check if error is a timeout
   */
  private isTimeoutError(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    return message.includes('timeout') || message.includes('timed out')
  }

  /**
   * Create final bulk result
   */
  private createBulkResult(
    progress: TransactionalBulkProgress,
    transactionResult: TransactionResult,
    startTime: number
  ): TransactionalBulkResult {
    const duration = Date.now() - startTime
    
    return {
      success: transactionResult.success && progress.failed === 0,
      transactionId: progress.transactionId,
      processed: progress.processed,
      succeeded: progress.succeeded,
      failed: progress.failed,
      skipped: progress.skipped,
      duration,
      rollbackPerformed: transactionResult.rollbackPerformed,
      rollbackReason: transactionResult.rollbackReason,
      errors: progress.errors,
      savepointsUsed: progress.savepointsCreated,
      integrityViolations: [],
      performanceMetrics: {
        totalDuration: duration,
        preparationTime: 0,
        executionTime: transactionResult.duration,
        validationTime: 0,
        rollbackTime: 0,
        operationsPerSecond: progress.processed / (duration / 1000),
        rowsPerSecond: progress.processed / (duration / 1000),
        batchesPerSecond: progress.totalBatches / (duration / 1000),
        memoryPeakUsage: progress.memoryUsage,
        connectionsUsed: transactionResult.performanceMetrics.connectionsUsed,
        deadlockCount: progress.deadlockRetries,
        savepointCount: progress.savepointsCreated,
        lockWaitTime: 0,
        indexUsage: [],
        constraintChecks: 0
      },
      recoveryData: this.generateRecoveryData(progress)
    }
  }

  /**
   * Generate recovery data for failed operations
   */
  private generateRecoveryData(progress: TransactionalBulkProgress): BulkRecoveryData | undefined {
    if (progress.errors.length === 0) {
      return undefined
    }

    return {
      failedItems: progress.errors.map(e => e.item).filter(Boolean),
      successfulItems: [], // Would need to track this separately
      rollbackData: [], // Would need to track this separately
      recoverableErrors: progress.errors.filter(e => e.recoverable),
      suggestedActions: this.generateRecoveryActions(progress.errors)
    }
  }

  /**
   * Generate recovery actions based on errors
   */
  private generateRecoveryActions(errors: BulkOperationError[]): RecoveryAction[] {
    const actions: RecoveryAction[] = []
    const errorsByType = new Map<BulkErrorType, number>()
    
    // Count errors by type
    errors.forEach(error => {
      errorsByType.set(error.type, (errorsByType.get(error.type) || 0) + 1)
    })

    // Generate actions based on error patterns
    if (errorsByType.get(BulkErrorType.DEADLOCK)) {
      actions.push({
        type: 'retry',
        description: 'Retry operation with exponential backoff to resolve deadlocks',
        automated: true,
        riskLevel: 'low',
        estimatedTime: 30000
      })
    }

    if (errorsByType.get(BulkErrorType.CONSTRAINT_VIOLATION)) {
      actions.push({
        type: 'manual_intervention',
        description: 'Review and fix constraint violations manually',
        automated: false,
        riskLevel: 'medium'
      })
    }

    if (errorsByType.get(BulkErrorType.TIMEOUT)) {
      actions.push({
        type: 'retry',
        description: 'Retry with smaller batch sizes and longer timeouts',
        automated: true,
        riskLevel: 'low',
        estimatedTime: 60000
      })
    }

    return actions
  }

  /**
   * Create error result for critical failures
   */
  private createErrorResult(
    progress: TransactionalBulkProgress,
    error: any,
    startTime: number
  ): TransactionalBulkResult {
    return {
      success: false,
      transactionId: progress.transactionId,
      processed: progress.processed,
      succeeded: progress.succeeded,
      failed: progress.failed,
      skipped: progress.skipped,
      duration: Date.now() - startTime,
      rollbackPerformed: true,
      rollbackReason: error instanceof Error ? error.message : String(error),
      errors: progress.errors,
      savepointsUsed: progress.savepointsCreated,
      integrityViolations: [],
      performanceMetrics: this.createEmptyMetrics(),
      recoveryData: this.generateRecoveryData(progress)
    }
  }

  /**
   * Utility methods
   */
  private validateConfig(config: TransactionalBulkConfig): void {
    if (!config.tableName) {
      throw new Error('Table name is required')
    }
    
    if (!['insert', 'update', 'delete', 'upsert'].includes(config.operation)) {
      throw new Error('Invalid operation type')
    }
    
    if (config.operation !== 'delete' && (!config.data || config.data.length === 0)) {
      throw new Error('Data is required for insert, update, and upsert operations')
    }
  }

  private prepareOperation(config: TransactionalBulkConfig, progress: TransactionalBulkProgress): Promise<void> {
    // Preparation logic would go here
    return Promise.resolve()
  }

  private finalizeOperation(config: TransactionalBulkConfig, progress: TransactionalBulkProgress, result: any): Promise<any> {
    return Promise.resolve(result)
  }

  private calculateOptimalBatchSize(requestedSize?: number): number {
    const defaultSize = requestedSize || this.defaultBatchSize
    return memoryManager.getRecommendedBatchSize(defaultSize)
  }

  private createBatches<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize))
    }
    return batches
  }

  private updateProgress(progress: TransactionalBulkProgress): void {
    progress.percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0
    progress.errorRate = progress.processed > 0 ? (progress.failed / progress.processed) * 100 : 0
  }

  private createEmptyMetrics(): BulkPerformanceMetrics {
    return {
      totalDuration: 0,
      preparationTime: 0,
      executionTime: 0,
      validationTime: 0,
      rollbackTime: 0,
      operationsPerSecond: 0,
      rowsPerSecond: 0,
      batchesPerSecond: 0,
      memoryPeakUsage: 0,
      connectionsUsed: 0,
      deadlockCount: 0,
      savepointCount: 0,
      lockWaitTime: 0,
      indexUsage: [],
      constraintChecks: 0
    }
  }

  private setupEventListeners(): void {
    this.transactionManager.on('transaction:failed', (event) => {
      this.emit('transaction:failed', event)
    })
    
    this.transactionManager.on('transaction:timeout', (event) => {
      this.emit('transaction:timeout', event)
    })
  }

  private generateOperationId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get active operation statistics
   */
  getActiveOperationStats(): {
    total: number
    byStatus: Record<BulkOperationStatus, number>
    byPhase: Record<BulkOperationPhase, number>
    totalProcessed: number
    totalErrors: number
    averageErrorRate: number
  } {
    const operations = Array.from(this.activeOperations.values())
    
    const stats = {
      total: operations.length,
      byStatus: {} as Record<BulkOperationStatus, number>,
      byPhase: {} as Record<BulkOperationPhase, number>,
      totalProcessed: 0,
      totalErrors: 0,
      averageErrorRate: 0
    }

    // Initialize counters
    Object.values(BulkOperationStatus).forEach(status => {
      stats.byStatus[status] = 0
    })
    Object.values(BulkOperationPhase).forEach(phase => {
      stats.byPhase[phase] = 0
    })

    // Calculate statistics
    operations.forEach(op => {
      stats.byStatus[op.status]++
      stats.byPhase[op.phase]++
      stats.totalProcessed += op.processed
      stats.totalErrors += op.failed
    })

    stats.averageErrorRate = operations.length > 0 ? 
      operations.reduce((sum, op) => sum + op.errorRate, 0) / operations.length : 0

    return stats
  }
}

export default TransactionalBulkOperationsManager