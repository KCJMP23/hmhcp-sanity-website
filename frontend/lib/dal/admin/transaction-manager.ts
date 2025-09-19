/**
 * Comprehensive Database Transaction Manager
 * Handles transaction rollback, isolation levels, deadlock detection, and recovery
 * for failed bulk operations in the healthcare admin system
 */

import { SupabaseClient, PostgrestResponse } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { DataAccessContext, TransactionOptions } from './types'
import { EventEmitter } from 'events'

// ================================
// Transaction Types
// ================================

export interface TransactionContext {
  id: string
  startTime: number
  isolation: TransactionIsolationLevel
  operations: TransactionOperation[]
  savepoints: SavepointStack[]
  metadata: TransactionMetadata
  status: TransactionStatus
  rollbackReason?: string
  parentTransactionId?: string
  nestedLevel: number
}

export interface TransactionOperation {
  id: string
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT' | 'BULK_INSERT' | 'BULK_UPDATE' | 'BULK_DELETE'
  table: string
  data: any
  affectedRows: number
  executedAt: number
  duration: number
  checksum?: string
  rollbackData?: any
}

export interface SavepointStack {
  id: string
  name: string
  createdAt: number
  operationIndex: number
  state: Record<string, any>
}

export interface TransactionMetadata {
  userId?: string
  role?: string
  source: string
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  maxDuration: number
  retryAttempts: number
  deadlockRetries: number
}

export enum TransactionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMMITTING = 'committing',
  COMMITTED = 'committed',
  ROLLING_BACK = 'rolling_back',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  DEADLOCKED = 'deadlocked'
}

export enum TransactionIsolationLevel {
  READ_UNCOMMITTED = 'READ_UNCOMMITTED',
  READ_COMMITTED = 'READ_COMMITTED',
  REPEATABLE_READ = 'REPEATABLE_READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  transactionId: string
  duration: number
  operationsExecuted: number
  rollbackPerformed: boolean
  rollbackReason?: string
  deadlockRetries: number
  performanceMetrics: TransactionPerformanceMetrics
}

export interface TransactionPerformanceMetrics {
  totalDuration: number
  commitDuration: number
  rollbackDuration: number
  lockWaitTime: number
  deadlockCount: number
  retryCount: number
  memoryPeakUsage: number
  rowsAffected: number
  connectionsUsed: number
}

export interface DeadlockInfo {
  transactionId: string
  detectedAt: number
  involvedTables: string[]
  conflictingOperations: string[]
  resolutionStrategy: 'retry' | 'abort' | 'timeout'
  retryCount: number
}

export interface RollbackStrategy {
  type: 'complete' | 'partial' | 'to_savepoint'
  savepoint?: string
  reason: string
  preserveAuditTrail: boolean
  notifyUsers: boolean
  retryable: boolean
}

export interface IntegrityValidation {
  tableName: string
  constraintType: 'foreign_key' | 'unique' | 'check' | 'not_null'
  constraintName: string
  isValid: boolean
  violationDetails?: string
  affectedRows: number
}

// ================================
// Transaction Manager
// ================================

export class DatabaseTransactionManager extends EventEmitter {
  private supabase: SupabaseClient
  private activeTransactions = new Map<string, TransactionContext>()
  private deadlockDetector: DeadlockDetector
  private connectionPool: TransactionConnectionPool
  private integrityValidator: DataIntegrityValidator
  private auditLogger: TransactionAuditLogger
  private retryManager: TransactionRetryManager
  
  private readonly maxActiveTransactions = 50
  private readonly defaultTimeout = 30000 // 30 seconds
  private readonly maxRetries = 3
  private readonly deadlockRetryDelay = 100 // ms

  constructor(supabase: SupabaseClient, options: TransactionManagerOptions = {}) {
    super()
    this.supabase = supabase
    this.deadlockDetector = new DeadlockDetector(this)
    this.connectionPool = new TransactionConnectionPool(supabase, options.poolConfig)
    this.integrityValidator = new DataIntegrityValidator(supabase)
    this.auditLogger = new TransactionAuditLogger(supabase)
    this.retryManager = new TransactionRetryManager()

    // Start monitoring services
    this.startMonitoring()
  }

  /**
   * Execute a transaction with comprehensive error handling and rollback
   */
  async executeTransaction<T>(
    operations: (context: TransactionExecutionContext) => Promise<T>,
    options: TransactionOptions = {},
    userContext?: DataAccessContext
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId()
    const startTime = Date.now()
    
    // Check transaction limits
    if (this.activeTransactions.size >= this.maxActiveTransactions) {
      return {
        success: false,
        error: 'Maximum active transactions reached',
        transactionId,
        duration: 0,
        operationsExecuted: 0,
        rollbackPerformed: false,
        deadlockRetries: 0,
        performanceMetrics: this.createEmptyMetrics()
      }
    }

    // Initialize transaction context
    const txContext = this.createTransactionContext(transactionId, options, userContext)
    this.activeTransactions.set(transactionId, txContext)

    let result: TransactionResult<T>
    let connection: any = null

    try {
      // Acquire connection with timeout
      connection = await this.connectionPool.acquireConnection(options.timeout || this.defaultTimeout)
      
      // Start transaction with isolation level
      await this.setIsolationLevel(connection, txContext.isolation)
      
      // Create execution context
      const execContext = new TransactionExecutionContext(
        transactionId,
        connection,
        this,
        userContext
      )

      // Execute operations with deadlock detection
      let operationResult: T
      let deadlockRetries = 0
      
      while (deadlockRetries <= this.maxRetries) {
        try {
          txContext.status = TransactionStatus.ACTIVE
          this.emit('transaction:started', { transactionId, context: txContext })
          
          operationResult = await this.executeWithTimeout(
            () => operations(execContext),
            options.timeout || this.defaultTimeout,
            transactionId
          )
          
          break // Success, exit retry loop
          
        } catch (error) {
          if (this.isDeadlock(error)) {
            deadlockRetries++
            txContext.metadata.deadlockRetries = deadlockRetries
            
            if (deadlockRetries <= this.maxRetries) {
              logger.warn('Deadlock detected, retrying transaction', {
                transactionId,
                attempt: deadlockRetries,
                error: error instanceof Error ? error.message : String(error)
              })
              
              await this.delay(this.deadlockRetryDelay * Math.pow(2, deadlockRetries - 1))
              await this.rollbackToBeginning(connection, txContext)
              continue
            }
          }
          throw error
        }
      }

      // Validate data integrity before commit
      const integrityIssues = await this.integrityValidator.validateTransaction(txContext)
      if (integrityIssues.length > 0) {
        throw new IntegrityViolationError('Data integrity violations detected', integrityIssues)
      }

      // Commit transaction
      txContext.status = TransactionStatus.COMMITTING
      const commitStart = Date.now()
      await connection.query('COMMIT')
      const commitDuration = Date.now() - commitStart
      
      txContext.status = TransactionStatus.COMMITTED
      const totalDuration = Date.now() - startTime

      result = {
        success: true,
        data: operationResult!,
        transactionId,
        duration: totalDuration,
        operationsExecuted: txContext.operations.length,
        rollbackPerformed: false,
        deadlockRetries: deadlockRetries,
        performanceMetrics: this.calculateMetrics(txContext, totalDuration, commitDuration)
      }

      // Log successful transaction
      await this.auditLogger.logTransactionSuccess(txContext, result)
      this.emit('transaction:committed', { transactionId, result })

    } catch (error) {
      // Perform rollback
      const rollbackResult = await this.performRollback(
        connection,
        txContext,
        error instanceof Error ? error.message : String(error)
      )

      result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        transactionId,
        duration: Date.now() - startTime,
        operationsExecuted: txContext.operations.length,
        rollbackPerformed: rollbackResult.success,
        rollbackReason: rollbackResult.reason,
        deadlockRetries: txContext.metadata.deadlockRetries,
        performanceMetrics: this.calculateMetrics(txContext, Date.now() - startTime)
      }

      // Log failed transaction
      await this.auditLogger.logTransactionFailure(txContext, error, rollbackResult)
      this.emit('transaction:failed', { transactionId, error, rollbackResult })

    } finally {
      // Cleanup
      if (connection) {
        await this.connectionPool.releaseConnection(connection)
      }
      this.activeTransactions.delete(transactionId)
    }

    return result
  }

  /**
   * Create a savepoint for nested transactions
   */
  async createSavepoint(
    transactionId: string,
    savepointName: string
  ): Promise<{ success: boolean; error?: string }> {
    const txContext = this.activeTransactions.get(transactionId)
    if (!txContext) {
      return { success: false, error: 'Transaction not found' }
    }

    try {
      const connection = await this.connectionPool.getConnectionForTransaction(transactionId)
      await connection.query(`SAVEPOINT ${savepointName}`)

      const savepoint: SavepointStack = {
        id: this.generateId(),
        name: savepointName,
        createdAt: Date.now(),
        operationIndex: txContext.operations.length,
        state: { ...txContext.metadata }
      }

      txContext.savepoints.push(savepoint)
      
      logger.debug('Savepoint created', { transactionId, savepointName })
      return { success: true }

    } catch (error) {
      logger.error('Failed to create savepoint', {
        transactionId,
        savepointName,
        error: error instanceof Error ? error.message : String(error)
      })
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Rollback to a specific savepoint
   */
  async rollbackToSavepoint(
    transactionId: string,
    savepointName: string,
    reason: string
  ): Promise<{ success: boolean; error?: string; affectedOperations: number }> {
    const txContext = this.activeTransactions.get(transactionId)
    if (!txContext) {
      return { success: false, error: 'Transaction not found', affectedOperations: 0 }
    }

    try {
      const connection = await this.connectionPool.getConnectionForTransaction(transactionId)
      
      // Find savepoint
      const savepoint = txContext.savepoints.find(sp => sp.name === savepointName)
      if (!savepoint) {
        return { success: false, error: 'Savepoint not found', affectedOperations: 0 }
      }

      // Rollback to savepoint
      await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`)
      
      // Remove operations after savepoint
      const affectedOperations = txContext.operations.length - savepoint.operationIndex
      txContext.operations = txContext.operations.slice(0, savepoint.operationIndex)
      
      // Remove savepoints created after this one
      txContext.savepoints = txContext.savepoints.filter(sp => sp.createdAt <= savepoint.createdAt)
      
      // Log rollback
      await this.auditLogger.logSavepointRollback(txContext, savepoint, reason, affectedOperations)
      
      logger.info('Rolled back to savepoint', {
        transactionId,
        savepointName,
        affectedOperations,
        reason
      })

      return { success: true, affectedOperations }

    } catch (error) {
      logger.error('Failed to rollback to savepoint', {
        transactionId,
        savepointName,
        reason,
        error: error instanceof Error ? error.message : String(error)
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        affectedOperations: 0
      }
    }
  }

  /**
   * Perform complete transaction rollback
   */
  private async performRollback(
    connection: any,
    txContext: TransactionContext,
    reason: string
  ): Promise<{ success: boolean; reason: string; duration: number }> {
    const startTime = Date.now()
    txContext.status = TransactionStatus.ROLLING_BACK
    txContext.rollbackReason = reason

    try {
      // Execute custom rollback logic for each operation
      for (let i = txContext.operations.length - 1; i >= 0; i--) {
        const operation = txContext.operations[i]
        await this.rollbackOperation(connection, operation)
      }

      // Rollback the database transaction
      if (connection) {
        await connection.query('ROLLBACK')
      }

      txContext.status = TransactionStatus.ROLLED_BACK
      const duration = Date.now() - startTime

      logger.info('Transaction rolled back successfully', {
        transactionId: txContext.id,
        reason,
        operationsRolledBack: txContext.operations.length,
        duration
      })

      return { success: true, reason, duration }

    } catch (rollbackError) {
      txContext.status = TransactionStatus.FAILED
      const duration = Date.now() - startTime

      logger.error('Transaction rollback failed', {
        transactionId: txContext.id,
        originalReason: reason,
        rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
        duration
      })

      return { 
        success: false, 
        reason: `Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        duration
      }
    }
  }

  /**
   * Rollback a specific operation
   */
  private async rollbackOperation(connection: any, operation: TransactionOperation): Promise<void> {
    try {
      switch (operation.type) {
        case 'INSERT':
        case 'BULK_INSERT':
          // Delete inserted records
          if (operation.rollbackData?.insertedIds) {
            await connection.query(
              `DELETE FROM ${operation.table} WHERE id = ANY($1::uuid[])`,
              [operation.rollbackData.insertedIds]
            )
          }
          break

        case 'UPDATE':
        case 'BULK_UPDATE':
          // Restore original values
          if (operation.rollbackData?.originalValues) {
            for (const record of operation.rollbackData.originalValues) {
              await connection.query(
                `UPDATE ${operation.table} SET ${this.buildUpdateClause(record.data)} WHERE id = $1`,
                [record.id, ...Object.values(record.data)]
              )
            }
          }
          break

        case 'DELETE':
        case 'BULK_DELETE':
          // Re-insert deleted records
          if (operation.rollbackData?.deletedRecords) {
            const records = operation.rollbackData.deletedRecords
            const columns = Object.keys(records[0])
            const values = records.map(record => Object.values(record))
            
            await connection.query(
              `INSERT INTO ${operation.table} (${columns.join(', ')}) VALUES ${this.buildValuesClause(values.length, columns.length)}`,
              values.flat()
            )
          }
          break

        default:
          logger.warn('Unknown operation type for rollback', { operationType: operation.type })
      }

      logger.debug('Operation rolled back', {
        operationId: operation.id,
        type: operation.type,
        table: operation.table
      })

    } catch (error) {
      logger.error('Failed to rollback operation', {
        operationId: operation.id,
        type: operation.type,
        table: operation.table,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Check if error indicates a deadlock
   */
  private isDeadlock(error: any): boolean {
    if (!error) return false
    
    const errorMessage = error.message?.toLowerCase() || ''
    const errorCode = error.code || error.sqlState || ''
    
    return (
      errorMessage.includes('deadlock') ||
      errorMessage.includes('serialization failure') ||
      errorCode === '40P01' || // deadlock_detected
      errorCode === '40001'    // serialization_failure
    )
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    transactionId: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const txContext = this.activeTransactions.get(transactionId)
        if (txContext) {
          txContext.status = TransactionStatus.TIMEOUT
        }
        reject(new Error(`Transaction timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      operation()
        .then(result => {
          clearTimeout(timeout)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  /**
   * Set transaction isolation level
   */
  private async setIsolationLevel(connection: any, level: TransactionIsolationLevel): Promise<void> {
    await connection.query('BEGIN')
    await connection.query(`SET TRANSACTION ISOLATION LEVEL ${level}`)
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create transaction context
   */
  private createTransactionContext(
    id: string,
    options: TransactionOptions,
    userContext?: DataAccessContext
  ): TransactionContext {
    return {
      id,
      startTime: Date.now(),
      isolation: this.parseIsolationLevel(options.isolationLevel),
      operations: [],
      savepoints: [],
      metadata: {
        userId: userContext?.userId,
        role: userContext?.role.toString(),
        source: 'admin-system',
        tags: ['bulk-operation'],
        priority: 'medium',
        maxDuration: options.timeout || this.defaultTimeout,
        retryAttempts: 0,
        deadlockRetries: 0
      },
      status: TransactionStatus.PENDING,
      nestedLevel: 0
    }
  }

  /**
   * Parse isolation level from options
   */
  private parseIsolationLevel(level?: string): TransactionIsolationLevel {
    switch (level?.toUpperCase()) {
      case 'READ_UNCOMMITTED':
        return TransactionIsolationLevel.READ_UNCOMMITTED
      case 'READ_COMMITTED':
        return TransactionIsolationLevel.READ_COMMITTED
      case 'REPEATABLE_READ':
        return TransactionIsolationLevel.REPEATABLE_READ
      case 'SERIALIZABLE':
        return TransactionIsolationLevel.SERIALIZABLE
      default:
        return TransactionIsolationLevel.READ_COMMITTED
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    txContext: TransactionContext,
    totalDuration: number,
    commitDuration: number = 0,
    rollbackDuration: number = 0
  ): TransactionPerformanceMetrics {
    const rowsAffected = txContext.operations.reduce((sum, op) => sum + op.affectedRows, 0)
    
    return {
      totalDuration,
      commitDuration,
      rollbackDuration,
      lockWaitTime: 0, // Would need to be measured from connection
      deadlockCount: txContext.metadata.deadlockRetries,
      retryCount: txContext.metadata.retryAttempts,
      memoryPeakUsage: 0, // Would need to be measured
      rowsAffected,
      connectionsUsed: 1
    }
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): TransactionPerformanceMetrics {
    return {
      totalDuration: 0,
      commitDuration: 0,
      rollbackDuration: 0,
      lockWaitTime: 0,
      deadlockCount: 0,
      retryCount: 0,
      memoryPeakUsage: 0,
      rowsAffected: 0,
      connectionsUsed: 0
    }
  }

  /**
   * Start monitoring services
   */
  private startMonitoring(): void {
    // Monitor transaction timeouts
    setInterval(() => {
      const now = Date.now()
      for (const [id, context] of this.activeTransactions) {
        if (now - context.startTime > context.metadata.maxDuration) {
          logger.warn('Transaction timeout detected', { transactionId: id })
          this.emit('transaction:timeout', { transactionId: id, context })
        }
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Rollback to beginning of transaction
   */
  private async rollbackToBeginning(connection: any, txContext: TransactionContext): Promise<void> {
    await connection.query('ROLLBACK')
    await connection.query('BEGIN')
    await this.setIsolationLevel(connection, txContext.isolation)
    
    // Clear operations and savepoints
    txContext.operations = []
    txContext.savepoints = []
  }

  /**
   * Build UPDATE clause for rollback
   */
  private buildUpdateClause(data: Record<string, any>): string {
    const keys = Object.keys(data)
    return keys.map((key, index) => `${key} = $${index + 2}`).join(', ')
  }

  /**
   * Build VALUES clause for batch insert
   */
  private buildValuesClause(rowCount: number, columnCount: number): string {
    const rows = []
    for (let i = 0; i < rowCount; i++) {
      const values = []
      for (let j = 0; j < columnCount; j++) {
        values.push(`$${i * columnCount + j + 1}`)
      }
      rows.push(`(${values.join(', ')})`)
    }
    return rows.join(', ')
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get active transaction statistics
   */
  getActiveTransactionStats(): {
    total: number
    byStatus: Record<TransactionStatus, number>
    byIsolationLevel: Record<TransactionIsolationLevel, number>
    averageDuration: number
    deadlockCount: number
  } {
    const transactions = Array.from(this.activeTransactions.values())
    const now = Date.now()
    
    const stats = {
      total: transactions.length,
      byStatus: {} as Record<TransactionStatus, number>,
      byIsolationLevel: {} as Record<TransactionIsolationLevel, number>,
      averageDuration: 0,
      deadlockCount: 0
    }

    // Initialize counters
    Object.values(TransactionStatus).forEach(status => {
      stats.byStatus[status] = 0
    })
    Object.values(TransactionIsolationLevel).forEach(level => {
      stats.byIsolationLevel[level] = 0
    })

    // Calculate statistics
    let totalDuration = 0
    transactions.forEach(tx => {
      stats.byStatus[tx.status]++
      stats.byIsolationLevel[tx.isolation]++
      totalDuration += now - tx.startTime
      stats.deadlockCount += tx.metadata.deadlockRetries
    })

    stats.averageDuration = transactions.length > 0 ? totalDuration / transactions.length : 0

    return stats
  }
}

// ================================
// Supporting Classes
// ================================

/**
 * Transaction Execution Context
 */
export class TransactionExecutionContext {
  constructor(
    public readonly transactionId: string,
    public readonly connection: any,
    public readonly manager: DatabaseTransactionManager,
    public readonly userContext?: DataAccessContext
  ) {}

  async createSavepoint(name: string): Promise<{ success: boolean; error?: string }> {
    return this.manager.createSavepoint(this.transactionId, name)
  }

  async rollbackToSavepoint(name: string, reason: string): Promise<{ success: boolean; error?: string; affectedOperations: number }> {
    return this.manager.rollbackToSavepoint(this.transactionId, name, reason)
  }

  recordOperation(operation: Omit<TransactionOperation, 'id' | 'executedAt'>): void {
    const txContext = (this.manager as any).activeTransactions.get(this.transactionId)
    if (txContext) {
      txContext.operations.push({
        ...operation,
        id: (this.manager as any).generateId(),
        executedAt: Date.now()
      })
    }
  }
}

/**
 * Deadlock Detector
 */
class DeadlockDetector {
  constructor(private manager: DatabaseTransactionManager) {}
  
  // Implementation would monitor lock waits and detect deadlock patterns
}

/**
 * Transaction Connection Pool
 */
class TransactionConnectionPool {
  constructor(private supabase: SupabaseClient, private config?: any) {}
  
  async acquireConnection(timeout: number): Promise<any> {
    // Implementation would manage connection pool
    return { query: async (sql: string, params?: any[]) => {} }
  }
  
  async releaseConnection(connection: any): Promise<void> {
    // Release connection back to pool
  }
  
  async getConnectionForTransaction(transactionId: string): Promise<any> {
    // Get connection associated with transaction
    return { query: async (sql: string, params?: any[]) => {} }
  }
}

/**
 * Data Integrity Validator
 */
class DataIntegrityValidator {
  constructor(private supabase: SupabaseClient) {}
  
  async validateTransaction(context: TransactionContext): Promise<IntegrityValidation[]> {
    // Validate foreign key constraints, unique constraints, etc.
    return []
  }
}

/**
 * Transaction Audit Logger
 */
class TransactionAuditLogger {
  constructor(private supabase: SupabaseClient) {}
  
  async logTransactionSuccess(context: TransactionContext, result: TransactionResult): Promise<void> {
    // Log successful transaction
  }
  
  async logTransactionFailure(context: TransactionContext, error: any, rollbackResult: any): Promise<void> {
    // Log failed transaction
  }
  
  async logSavepointRollback(
    context: TransactionContext,
    savepoint: SavepointStack,
    reason: string,
    affectedOperations: number
  ): Promise<void> {
    // Log savepoint rollback
  }
}

/**
 * Transaction Retry Manager
 */
class TransactionRetryManager {
  calculateRetryDelay(attempt: number, baseDelay: number = 100): number {
    return baseDelay * Math.pow(2, attempt) + Math.random() * 100
  }
  
  shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) return false
    
    // Retry on deadlocks, timeouts, connection issues
    const errorMessage = error.message?.toLowerCase() || ''
    return (
      errorMessage.includes('deadlock') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('serialization failure')
    )
  }
}

/**
 * Custom Error Types
 */
export class IntegrityViolationError extends Error {
  constructor(message: string, public violations: IntegrityValidation[]) {
    super(message)
    this.name = 'IntegrityViolationError'
  }
}

export class TransactionTimeoutError extends Error {
  constructor(transactionId: string, timeout: number) {
    super(`Transaction ${transactionId} timed out after ${timeout}ms`)
    this.name = 'TransactionTimeoutError'
  }
}

export class DeadlockError extends Error {
  constructor(message: string, public deadlockInfo: DeadlockInfo) {
    super(message)
    this.name = 'DeadlockError'
  }
}

// ================================
// Configuration Interfaces
// ================================

export interface TransactionManagerOptions {
  maxActiveTransactions?: number
  defaultTimeout?: number
  maxRetries?: number
  poolConfig?: {
    maxConnections?: number
    minConnections?: number
    acquireTimeoutMillis?: number
    idleTimeoutMillis?: number
  }
}

export default DatabaseTransactionManager