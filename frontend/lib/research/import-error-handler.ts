/**
 * Comprehensive Error Handling and Validation Utilities for Publications Import System
 * Healthcare-Compliant Error Management with HIPAA Considerations
 * 
 * Features:
 * - Import queue management with retry logic
 * - Partial success handling for bulk imports
 * - Manual override capability for duplicates
 * - Error classification with user-friendly messages
 * - Exponential backoff retry mechanism
 * - Redis persistence for failed imports
 * - Healthcare-compliant audit logging
 * - TypeScript interfaces for type safety
 */

import { getRedis, CachePrefix, CacheTTL } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { PubMedArticle } from './pubmed-client'
import { z } from 'zod'

// =============================================================================
// Type Definitions and Validation Schemas
// =============================================================================

/**
 * Classification of import errors by severity and type
 */
export enum ImportErrorType {
  // Network and API Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_TIMEOUT = 'API_TIMEOUT',
  API_AUTHENTICATION = 'API_AUTHENTICATION',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',

  // Data Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INCOMPLETE_DATA = 'INCOMPLETE_DATA',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TRANSACTION_FAILURE = 'TRANSACTION_FAILURE',

  // Healthcare Compliance Errors
  HIPAA_VIOLATION = 'HIPAA_VIOLATION',
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  AUDIT_LOG_FAILURE = 'AUDIT_LOG_FAILURE',

  // System Errors
  MEMORY_EXHAUSTED = 'MEMORY_EXHAUSTED',
  DISK_SPACE_ERROR = 'DISK_SPACE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Error severity levels for healthcare compliance
 */
export enum ImportErrorSeverity {
  LOW = 'LOW',           // Minor validation issues
  MEDIUM = 'MEDIUM',     // Data quality issues
  HIGH = 'HIGH',         // System integration failures
  CRITICAL = 'CRITICAL'  // Security or compliance violations
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  exponentialBase: number
  jitterMaxMs: number
}

/**
 * Import error details with healthcare compliance metadata
 */
export interface ImportError {
  id: string
  type: ImportErrorType
  severity: ImportErrorSeverity
  message: string
  userFriendlyMessage: string
  originalData: any
  timestamp: Date
  retryCount: number
  canRetry: boolean
  requiresManualOverride: boolean
  complianceFlags: string[]
  stackTrace?: string
  contextData: Record<string, any>
}

/**
 * Failed import entry for queue management
 */
export interface FailedImport {
  id: string
  queueName: string
  error: ImportError
  nextRetryAt: Date
  createdAt: Date
  updatedAt: Date
  userId?: string
  sessionId?: string
  auditTrail: AuditLogEntry[]
}

/**
 * Bulk import results with partial success handling
 */
export interface BulkImportResult {
  totalItems: number
  successCount: number
  errorCount: number
  warningCount: number
  successfulImports: PubMedArticle[]
  failedImports: FailedImport[]
  warnings: ImportWarning[]
  summary: ImportSummary
}

/**
 * Import warning for non-critical issues
 */
export interface ImportWarning {
  id: string
  type: string
  message: string
  data: any
  timestamp: Date
}

/**
 * Import summary for reporting
 */
export interface ImportSummary {
  operationId: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED'
  metrics: {
    throughputPerSecond: number
    errorRate: number
    retryRate: number
  }
}

/**
 * Audit log entry for healthcare compliance
 */
export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId?: string
  sessionId?: string
  action: string
  resourceType: string
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Manual override request for duplicate handling
 */
export interface ManualOverrideRequest {
  failedImportId: string
  overrideReason: string
  userId: string
  approvedAt: Date
  overrideData?: any
}

// Validation Schemas
export const ImportErrorSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ImportErrorType),
  severity: z.nativeEnum(ImportErrorSeverity),
  message: z.string().min(1),
  userFriendlyMessage: z.string().min(1),
  originalData: z.any(),
  timestamp: z.date(),
  retryCount: z.number().min(0),
  canRetry: z.boolean(),
  requiresManualOverride: z.boolean(),
  complianceFlags: z.array(z.string()),
  stackTrace: z.string().optional(),
  contextData: z.record(z.any())
})

export const FailedImportSchema = z.object({
  id: z.string().uuid(),
  queueName: z.string().min(1),
  error: ImportErrorSchema,
  nextRetryAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  auditTrail: z.array(z.any())
})

// =============================================================================
// Error Classification and User-Friendly Messaging
// =============================================================================

export class ErrorClassifier {
  /**
   * Classify error and determine severity
   */
  static classifyError(error: any, context?: Record<string, any>): {
    type: ImportErrorType
    severity: ImportErrorSeverity
    canRetry: boolean
    requiresManualOverride: boolean
    complianceFlags: string[]
  } {
    const errorMessage = error?.message || String(error)
    const errorStack = error?.stack || ''

    // Network and API Errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        type: ImportErrorType.NETWORK_ERROR,
        severity: ImportErrorSeverity.MEDIUM,
        canRetry: true,
        requiresManualOverride: false,
        complianceFlags: []
      }
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return {
        type: ImportErrorType.API_RATE_LIMIT,
        severity: ImportErrorSeverity.MEDIUM,
        canRetry: true,
        requiresManualOverride: false,
        complianceFlags: []
      }
    }

    if (errorMessage.includes('timeout')) {
      return {
        type: ImportErrorType.API_TIMEOUT,
        severity: ImportErrorSeverity.MEDIUM,
        canRetry: true,
        requiresManualOverride: false,
        complianceFlags: []
      }
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
      return {
        type: ImportErrorType.API_AUTHENTICATION,
        severity: ImportErrorSeverity.HIGH,
        canRetry: false,
        requiresManualOverride: true,
        complianceFlags: ['AUTHENTICATION_FAILURE']
      }
    }

    if (errorMessage.includes('quota') || errorMessage.includes('403')) {
      return {
        type: ImportErrorType.API_QUOTA_EXCEEDED,
        severity: ImportErrorSeverity.HIGH,
        canRetry: false,
        requiresManualOverride: true,
        complianceFlags: ['QUOTA_MANAGEMENT']
      }
    }

    // Data Validation Errors
    if (errorMessage.includes('duplicate') || errorMessage.includes('UNIQUE constraint')) {
      return {
        type: ImportErrorType.DUPLICATE_ENTRY,
        severity: ImportErrorSeverity.LOW,
        canRetry: false,
        requiresManualOverride: true,
        complianceFlags: ['DATA_INTEGRITY']
      }
    }

    if (errorMessage.includes('validation')) {
      return {
        type: ImportErrorType.VALIDATION_ERROR,
        severity: ImportErrorSeverity.LOW,
        canRetry: false,
        requiresManualOverride: true,
        complianceFlags: ['DATA_QUALITY']
      }
    }

    // Database Errors
    if (errorMessage.includes('database') || errorMessage.includes('SQL')) {
      return {
        type: ImportErrorType.DATABASE_ERROR,
        severity: ImportErrorSeverity.HIGH,
        canRetry: true,
        requiresManualOverride: false,
        complianceFlags: ['DATABASE_INTEGRITY']
      }
    }

    // Healthcare Compliance Errors
    if (errorMessage.includes('HIPAA') || errorMessage.includes('PHI')) {
      return {
        type: ImportErrorType.HIPAA_VIOLATION,
        severity: ImportErrorSeverity.CRITICAL,
        canRetry: false,
        requiresManualOverride: true,
        complianceFlags: ['HIPAA_CRITICAL', 'IMMEDIATE_REVIEW_REQUIRED']
      }
    }

    // Default classification
    return {
      type: ImportErrorType.UNKNOWN_ERROR,
      severity: ImportErrorSeverity.MEDIUM,
      canRetry: true,
      requiresManualOverride: false,
      complianceFlags: ['UNKNOWN_CLASSIFICATION']
    }
  }

  /**
   * Generate user-friendly error messages
   */
  static getUserFriendlyMessage(errorType: ImportErrorType, originalMessage: string): string {
    const messages: Record<ImportErrorType, string> = {
      [ImportErrorType.NETWORK_ERROR]: 'Unable to connect to the research database. Please check your internet connection and try again.',
      [ImportErrorType.API_RATE_LIMIT]: 'Too many requests to the research database. Please wait a moment and try again.',
      [ImportErrorType.API_TIMEOUT]: 'The research database is taking too long to respond. Please try again later.',
      [ImportErrorType.API_AUTHENTICATION]: 'Authentication failed with the research database. Please contact your administrator.',
      [ImportErrorType.API_QUOTA_EXCEEDED]: 'Daily research database quota exceeded. Please try again tomorrow or contact support.',
      [ImportErrorType.VALIDATION_ERROR]: 'The research data contains invalid information that needs to be corrected.',
      [ImportErrorType.DUPLICATE_ENTRY]: 'This research publication already exists in the database. You can choose to update the existing entry.',
      [ImportErrorType.INCOMPLETE_DATA]: 'The research publication is missing required information and cannot be imported.',
      [ImportErrorType.INVALID_FORMAT]: 'The research data format is not supported. Please check the data format.',
      [ImportErrorType.MISSING_REQUIRED_FIELD]: 'Required publication information is missing. Please provide all mandatory fields.',
      [ImportErrorType.DATABASE_ERROR]: 'A database error occurred while importing the research data. Please try again.',
      [ImportErrorType.CONNECTION_ERROR]: 'Unable to connect to the database. Please try again later.',
      [ImportErrorType.CONSTRAINT_VIOLATION]: 'The research data violates database constraints. Please review the data.',
      [ImportErrorType.TRANSACTION_FAILURE]: 'The import operation was interrupted. Please retry the import.',
      [ImportErrorType.HIPAA_VIOLATION]: 'CRITICAL: Potential HIPAA compliance violation detected. Import blocked for review.',
      [ImportErrorType.SECURITY_POLICY_VIOLATION]: 'Security policy violation detected. Import requires administrator approval.',
      [ImportErrorType.AUDIT_LOG_FAILURE]: 'Unable to create audit log. Import cannot proceed for compliance reasons.',
      [ImportErrorType.MEMORY_EXHAUSTED]: 'System resources exhausted. Please reduce batch size and try again.',
      [ImportErrorType.DISK_SPACE_ERROR]: 'Insufficient disk space for import operation. Please contact administrator.',
      [ImportErrorType.CONFIGURATION_ERROR]: 'System configuration error. Please contact technical support.',
      [ImportErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred during import. Please contact support if this persists.'
    }

    return messages[errorType] || 'An error occurred during the import process.'
  }
}

// =============================================================================
// Retry Logic with Exponential Backoff
// =============================================================================

export class RetryManager {
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    exponentialBase: 2,
    jitterMaxMs: 1000
  }

  constructor(private config: Partial<RetryConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  /**
   * Calculate next retry delay with exponential backoff and jitter
   */
  calculateRetryDelay(attemptNumber: number): number {
    const baseDelay = this.config.baseDelayMs || this.defaultConfig.baseDelayMs
    const exponentialBase = this.config.exponentialBase || this.defaultConfig.exponentialBase
    const maxDelay = this.config.maxDelayMs || this.defaultConfig.maxDelayMs
    const jitterMax = this.config.jitterMaxMs || this.defaultConfig.jitterMaxMs

    // Exponential backoff: baseDelay * (exponentialBase ^ attemptNumber)
    const exponentialDelay = baseDelay * Math.pow(exponentialBase, attemptNumber)
    
    // Cap at maximum delay
    const cappedDelay = Math.min(exponentialDelay, maxDelay)
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * jitterMax
    
    return cappedDelay + jitter
  }

  /**
   * Determine if error should be retried
   */
  shouldRetry(error: ImportError, attemptNumber: number): boolean {
    const maxAttempts = this.config.maxAttempts || this.defaultConfig.maxAttempts

    // Check retry limits
    if (attemptNumber >= maxAttempts) {
      return false
    }

    // Check if error type is retryable
    if (!error.canRetry) {
      return false
    }

    // Don't retry critical compliance violations
    if (error.severity === ImportErrorSeverity.CRITICAL) {
      return false
    }

    // Don't retry errors requiring manual override
    if (error.requiresManualOverride) {
      return false
    }

    return true
  }

  /**
   * Get next retry timestamp
   */
  getNextRetryAt(attemptNumber: number): Date {
    const delay = this.calculateRetryDelay(attemptNumber)
    return new Date(Date.now() + delay)
  }
}

// =============================================================================
// Redis-Persisted Import Queue Management
// =============================================================================

export class ImportQueueManager {
  private redis = getRedis()
  private retryManager = new RetryManager()
  private readonly QUEUE_PREFIX = CachePrefix.QUEUE + 'import:'
  private readonly FAILED_IMPORTS_KEY = this.QUEUE_PREFIX + 'failed'
  private readonly RETRY_QUEUE_KEY = this.QUEUE_PREFIX + 'retry'
  private readonly AUDIT_LOG_KEY = CachePrefix.TEMP + 'audit:import'

  /**
   * Add failed import to queue with retry scheduling
   */
  async addFailedImport(
    queueName: string,
    error: any,
    originalData: any,
    contextData: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): Promise<string> {
    try {
      // Classify the error
      const classification = ErrorClassifier.classifyError(error, contextData)
      
      // Create import error object
      const importError: ImportError = {
        id: this.generateId(),
        type: classification.type,
        severity: classification.severity,
        message: error?.message || String(error),
        userFriendlyMessage: ErrorClassifier.getUserFriendlyMessage(classification.type, error?.message || ''),
        originalData,
        timestamp: new Date(),
        retryCount: 0,
        canRetry: classification.canRetry,
        requiresManualOverride: classification.requiresManualOverride,
        complianceFlags: classification.complianceFlags,
        stackTrace: error?.stack,
        contextData
      }

      // Create audit log entry
      const auditEntry: AuditLogEntry = {
        id: this.generateId(),
        timestamp: new Date(),
        userId,
        sessionId,
        action: 'IMPORT_FAILED',
        resourceType: 'publication_import',
        details: {
          errorType: importError.type,
          severity: importError.severity,
          canRetry: importError.canRetry,
          complianceFlags: importError.complianceFlags
        }
      }

      // Create failed import record
      const failedImport: FailedImport = {
        id: this.generateId(),
        queueName,
        error: importError,
        nextRetryAt: classification.canRetry 
          ? this.retryManager.getNextRetryAt(0) 
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Far future for non-retryable
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        sessionId,
        auditTrail: [auditEntry]
      }

      // Store in Redis with appropriate TTL
      const ttl = classification.severity === ImportErrorSeverity.CRITICAL 
        ? CacheTTL.MONTH 
        : CacheTTL.PERSISTENT

      await this.redis.set(
        `${this.FAILED_IMPORTS_KEY}:${failedImport.id}`,
        JSON.stringify(failedImport),
        { ttl, prefix: '' }
      )

      // Add to retry queue if retryable
      if (classification.canRetry) {
        await this.addToRetryQueue(failedImport.id, failedImport.nextRetryAt)
      }

      // Log for monitoring
      logger.warn('Import failed and queued for retry', {
        importId: failedImport.id,
        errorType: importError.type,
        severity: importError.severity,
        canRetry: importError.canRetry,
        queueName,
        complianceFlags: importError.complianceFlags
      })

      // Store audit log
      await this.storeAuditLog(auditEntry)

      return failedImport.id
    } catch (queueError) {
      logger.error('Failed to add import to error queue', {
        error: queueError,
        originalError: error,
        queueName
      })
      throw new Error('Failed to queue import for retry')
    }
  }

  /**
   * Get failed imports by queue name with pagination
   */
  async getFailedImports(
    queueName?: string,
    limit: number = 50,
    offset: number = 0,
    severity?: ImportErrorSeverity
  ): Promise<FailedImport[]> {
    try {
      // Get all failed import keys
      const pattern = queueName 
        ? `${this.FAILED_IMPORTS_KEY}:*`
        : `${this.FAILED_IMPORTS_KEY}:*`
      
      // In a production environment, use Redis SCAN for better performance
      const keys = await this.getKeysWithPattern(pattern)
      
      const imports: FailedImport[] = []
      
      for (const key of keys.slice(offset, offset + limit)) {
        const data = await this.redis.get<string>(key, { prefix: '' })
        if (data) {
          try {
            const failedImport: FailedImport = JSON.parse(data)
            
            // Filter by queue name if specified
            if (queueName && failedImport.queueName !== queueName) {
              continue
            }
            
            // Filter by severity if specified
            if (severity && failedImport.error.severity !== severity) {
              continue
            }
            
            imports.push(failedImport)
          } catch (parseError) {
            logger.warn('Failed to parse failed import data', { key, error: parseError })
          }
        }
      }
      
      // Sort by creation date (newest first)
      imports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      return imports
    } catch (error) {
      logger.error('Failed to get failed imports', { error, queueName })
      return []
    }
  }

  /**
   * Retry failed import with exponential backoff
   */
  async retryFailedImport(importId: string, forceRetry: boolean = false): Promise<boolean> {
    try {
      const key = `${this.FAILED_IMPORTS_KEY}:${importId}`
      const data = await this.redis.get<string>(key, { prefix: '' })
      
      if (!data) {
        logger.warn('Failed import not found for retry', { importId })
        return false
      }

      const failedImport: FailedImport = JSON.parse(data)
      
      // Check if retry is allowed
      if (!forceRetry && !this.retryManager.shouldRetry(failedImport.error, failedImport.error.retryCount)) {
        logger.info('Retry not allowed for import', { 
          importId, 
          retryCount: failedImport.error.retryCount,
          errorType: failedImport.error.type
        })
        return false
      }

      // Update retry count and schedule next retry
      failedImport.error.retryCount++
      failedImport.nextRetryAt = this.retryManager.getNextRetryAt(failedImport.error.retryCount)
      failedImport.updatedAt = new Date()

      // Add audit entry
      const auditEntry: AuditLogEntry = {
        id: this.generateId(),
        timestamp: new Date(),
        userId: failedImport.userId,
        sessionId: failedImport.sessionId,
        action: 'IMPORT_RETRY_ATTEMPTED',
        resourceType: 'publication_import',
        details: {
          retryCount: failedImport.error.retryCount,
          nextRetryAt: failedImport.nextRetryAt,
          forceRetry
        }
      }

      failedImport.auditTrail.push(auditEntry)

      // Update in Redis
      await this.redis.set(
        key,
        JSON.stringify(failedImport),
        { ttl: CacheTTL.PERSISTENT, prefix: '' }
      )

      // Add back to retry queue
      await this.addToRetryQueue(importId, failedImport.nextRetryAt)

      logger.info('Failed import scheduled for retry', {
        importId,
        retryCount: failedImport.error.retryCount,
        nextRetryAt: failedImport.nextRetryAt
      })

      return true
    } catch (error) {
      logger.error('Failed to retry import', { error, importId })
      return false
    }
  }

  /**
   * Apply manual override for duplicate or blocked imports
   */
  async applyManualOverride(
    importId: string,
    overrideRequest: ManualOverrideRequest
  ): Promise<boolean> {
    try {
      const key = `${this.FAILED_IMPORTS_KEY}:${importId}`
      const data = await this.redis.get<string>(key, { prefix: '' })
      
      if (!data) {
        logger.warn('Failed import not found for manual override', { importId })
        return false
      }

      const failedImport: FailedImport = JSON.parse(data)

      // Validate override is applicable
      if (!failedImport.error.requiresManualOverride) {
        logger.warn('Manual override not required for import', { 
          importId, 
          errorType: failedImport.error.type 
        })
        return false
      }

      // Create audit entry for override
      const auditEntry: AuditLogEntry = {
        id: this.generateId(),
        timestamp: new Date(),
        userId: overrideRequest.userId,
        sessionId: failedImport.sessionId,
        action: 'MANUAL_OVERRIDE_APPLIED',
        resourceType: 'publication_import',
        details: {
          originalError: failedImport.error.type,
          overrideReason: overrideRequest.overrideReason,
          overrideData: overrideRequest.overrideData
        }
      }

      failedImport.auditTrail.push(auditEntry)

      // Mark as ready for retry with override
      failedImport.error.canRetry = true
      failedImport.error.requiresManualOverride = false
      failedImport.nextRetryAt = new Date() // Retry immediately
      failedImport.updatedAt = new Date()

      // Store override request
      const overrideKey = `${this.QUEUE_PREFIX}override:${importId}`
      await this.redis.set(
        overrideKey,
        JSON.stringify(overrideRequest),
        { ttl: CacheTTL.MONTH, prefix: '' }
      )

      // Update failed import
      await this.redis.set(
        key,
        JSON.stringify(failedImport),
        { ttl: CacheTTL.PERSISTENT, prefix: '' }
      )

      // Add to retry queue
      await this.addToRetryQueue(importId, failedImport.nextRetryAt)

      logger.info('Manual override applied to failed import', {
        importId,
        userId: overrideRequest.userId,
        reason: overrideRequest.overrideReason
      })

      return true
    } catch (error) {
      logger.error('Failed to apply manual override', { error, importId })
      return false
    }
  }

  /**
   * Get imports ready for retry
   */
  async getRetryableImports(limit: number = 10): Promise<FailedImport[]> {
    try {
      const now = new Date()
      const retryItems = await this.getRetryQueueItems(limit)
      const readyImports: FailedImport[] = []

      for (const item of retryItems) {
        if (new Date(item.nextRetryAt) <= now) {
          const key = `${this.FAILED_IMPORTS_KEY}:${item.importId}`
          const data = await this.redis.get<string>(key, { prefix: '' })
          
          if (data) {
            try {
              const failedImport: FailedImport = JSON.parse(data)
              readyImports.push(failedImport)
            } catch (parseError) {
              logger.warn('Failed to parse retry import data', { importId: item.importId })
            }
          }
        }
      }

      return readyImports
    } catch (error) {
      logger.error('Failed to get retryable imports', { error })
      return []
    }
  }

  /**
   * Remove successfully processed import from queue
   */
  async removeProcessedImport(importId: string): Promise<boolean> {
    try {
      const key = `${this.FAILED_IMPORTS_KEY}:${importId}`
      const deleted = await this.redis.del(key, '')
      
      // Remove from retry queue
      await this.removeFromRetryQueue(importId)
      
      logger.info('Processed import removed from queue', { importId })
      
      return deleted
    } catch (error) {
      logger.error('Failed to remove processed import', { error, importId })
      return false
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<{
    totalFailed: number
    byErrorType: Record<ImportErrorType, number>
    bySeverity: Record<ImportErrorSeverity, number>
    retryableCount: number
    manualOverrideCount: number
  }> {
    try {
      const pattern = `${this.FAILED_IMPORTS_KEY}:*`
      const keys = await this.getKeysWithPattern(pattern)
      
      let totalFailed = 0
      let retryableCount = 0
      let manualOverrideCount = 0
      const byErrorType: Record<ImportErrorType, number> = {} as any
      const bySeverity: Record<ImportErrorSeverity, number> = {} as any

      // Initialize counters
      Object.values(ImportErrorType).forEach(type => byErrorType[type] = 0)
      Object.values(ImportErrorSeverity).forEach(severity => bySeverity[severity] = 0)

      for (const key of keys) {
        const data = await this.redis.get<string>(key, { prefix: '' })
        if (data) {
          try {
            const failedImport: FailedImport = JSON.parse(data)
            totalFailed++
            
            byErrorType[failedImport.error.type]++
            bySeverity[failedImport.error.severity]++
            
            if (failedImport.error.canRetry) {
              retryableCount++
            }
            
            if (failedImport.error.requiresManualOverride) {
              manualOverrideCount++
            }
          } catch (parseError) {
            // Skip malformed entries
          }
        }
      }

      return {
        totalFailed,
        byErrorType,
        bySeverity,
        retryableCount,
        manualOverrideCount
      }
    } catch (error) {
      logger.error('Failed to get queue stats', { error })
      return {
        totalFailed: 0,
        byErrorType: {} as any,
        bySeverity: {} as any,
        retryableCount: 0,
        manualOverrideCount: 0
      }
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async addToRetryQueue(importId: string, nextRetryAt: Date): Promise<void> {
    const retryItem = {
      importId,
      nextRetryAt: nextRetryAt.toISOString(),
      score: nextRetryAt.getTime()
    }
    
    // In production, use Redis sorted sets for better performance
    const queueData = await this.redis.get<string>(this.RETRY_QUEUE_KEY, { prefix: '' }) || '[]'
    const queue = JSON.parse(queueData)
    
    // Remove existing entry if present
    const existingIndex = queue.findIndex((item: any) => item.importId === importId)
    if (existingIndex >= 0) {
      queue.splice(existingIndex, 1)
    }
    
    queue.push(retryItem)
    queue.sort((a: any, b: any) => a.score - b.score)
    
    await this.redis.set(
      this.RETRY_QUEUE_KEY,
      JSON.stringify(queue),
      { ttl: CacheTTL.PERSISTENT, prefix: '' }
    )
  }

  private async removeFromRetryQueue(importId: string): Promise<void> {
    const queueData = await this.redis.get<string>(this.RETRY_QUEUE_KEY, { prefix: '' }) || '[]'
    const queue = JSON.parse(queueData)
    
    const filteredQueue = queue.filter((item: any) => item.importId !== importId)
    
    await this.redis.set(
      this.RETRY_QUEUE_KEY,
      JSON.stringify(filteredQueue),
      { ttl: CacheTTL.PERSISTENT, prefix: '' }
    )
  }

  private async getRetryQueueItems(limit: number): Promise<any[]> {
    const queueData = await this.redis.get<string>(this.RETRY_QUEUE_KEY, { prefix: '' }) || '[]'
    const queue = JSON.parse(queueData)
    
    return queue.slice(0, limit)
  }

  private async getKeysWithPattern(pattern: string): Promise<string[]> {
    // Simplified implementation - in production, use Redis SCAN
    // This is a placeholder for the actual Redis pattern matching
    return []
  }

  private async storeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const key = `${this.AUDIT_LOG_KEY}:${entry.id}`
      await this.redis.set(
        key,
        JSON.stringify(entry),
        { ttl: CacheTTL.MONTH, prefix: '' }
      )
    } catch (error) {
      logger.error('Failed to store audit log', { error, entryId: entry.id })
    }
  }
}

// =============================================================================
// Bulk Import Handler with Partial Success Support
// =============================================================================

export class BulkImportHandler {
  private queueManager = new ImportQueueManager()

  /**
   * Process bulk import with comprehensive error handling
   */
  async processBulkImport<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<any>,
    options: {
      queueName: string
      continueOnError?: boolean
      maxConcurrent?: number
      userId?: string
      sessionId?: string
    }
  ): Promise<BulkImportResult> {
    const startTime = new Date()
    const operationId = this.generateOperationId()
    
    logger.info('Starting bulk import operation', {
      operationId,
      totalItems: items.length,
      queueName: options.queueName
    })

    const result: BulkImportResult = {
      totalItems: items.length,
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
      successfulImports: [],
      failedImports: [],
      warnings: [],
      summary: {
        operationId,
        startTime,
        status: 'RUNNING',
        metrics: {
          throughputPerSecond: 0,
          errorRate: 0,
          retryRate: 0
        }
      }
    }

    const maxConcurrent = options.maxConcurrent || 5
    const continueOnError = options.continueOnError ?? true

    // Process items in batches to control concurrency
    for (let i = 0; i < items.length; i += maxConcurrent) {
      const batch = items.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(async (item, batchIndex) => {
        const absoluteIndex = i + batchIndex
        
        try {
          const processedItem = await processor(item, absoluteIndex)
          result.successfulImports.push(processedItem)
          result.successCount++
          
          logger.debug('Item processed successfully', {
            operationId,
            index: absoluteIndex,
            queueName: options.queueName
          })
          
          return { success: true, item: processedItem, index: absoluteIndex }
        } catch (error) {
          logger.warn('Item processing failed', {
            operationId,
            index: absoluteIndex,
            error: error instanceof Error ? error.message : String(error)
          })

          // Add to failed imports queue
          try {
            const failedImportId = await this.queueManager.addFailedImport(
              options.queueName,
              error,
              item,
              { operationId, index: absoluteIndex },
              options.userId,
              options.sessionId
            )

            result.failedImports.push({
              id: failedImportId,
              queueName: options.queueName,
              error: {
                id: failedImportId,
                type: ImportErrorType.UNKNOWN_ERROR,
                severity: ImportErrorSeverity.MEDIUM,
                message: error instanceof Error ? error.message : String(error),
                userFriendlyMessage: 'Failed to process this item',
                originalData: item,
                timestamp: new Date(),
                retryCount: 0,
                canRetry: true,
                requiresManualOverride: false,
                complianceFlags: [],
                contextData: { operationId, index: absoluteIndex }
              },
              nextRetryAt: new Date(Date.now() + 60000), // 1 minute
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: options.userId,
              sessionId: options.sessionId,
              auditTrail: []
            } as FailedImport)

            result.errorCount++
            
            return { success: false, error, index: absoluteIndex }
          } catch (queueError) {
            logger.error('Failed to queue failed import', {
              operationId,
              index: absoluteIndex,
              originalError: error,
              queueError
            })
            
            result.errorCount++
            return { success: false, error: queueError, index: absoluteIndex }
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Handle any critical errors in the batch
      const criticalErrors = batchResults.filter(r => 
        r.status === 'rejected' || 
        (r.status === 'fulfilled' && !r.value.success)
      )

      if (!continueOnError && criticalErrors.length > 0) {
        logger.error('Stopping bulk import due to critical errors', {
          operationId,
          criticalErrorCount: criticalErrors.length
        })
        
        result.summary.status = 'FAILED'
        break
      }
    }

    // Calculate final metrics
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    
    result.summary.endTime = endTime
    result.summary.duration = duration
    result.summary.status = result.errorCount === 0 ? 'COMPLETED' : 
                            result.successCount > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED'
    
    result.summary.metrics = {
      throughputPerSecond: result.successCount / (duration / 1000),
      errorRate: (result.errorCount / result.totalItems) * 100,
      retryRate: (result.failedImports.filter(f => f.error.canRetry).length / result.totalItems) * 100
    }

    logger.info('Bulk import operation completed', {
      operationId,
      totalItems: result.totalItems,
      successCount: result.successCount,
      errorCount: result.errorCount,
      status: result.summary.status,
      duration: result.summary.duration
    })

    return result
  }

  private generateOperationId(): string {
    return `bulk-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// =============================================================================
// Main Export Interface
// =============================================================================

export class PublicationImportErrorHandler {
  public readonly queueManager = new ImportQueueManager()
  public readonly bulkHandler = new BulkImportHandler()
  public readonly retryManager = new RetryManager()

  /**
   * Initialize the error handling system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Publication Import Error Handler')
    
    // Ensure Redis connection
    const redis = getRedis()
    if (!redis.isConnected()) {
      await redis.connect()
    }
    
    logger.info('Publication Import Error Handler initialized successfully')
  }

  /**
   * Handle single import error
   */
  async handleImportError(
    queueName: string,
    error: any,
    originalData: any,
    contextData: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): Promise<string> {
    return this.queueManager.addFailedImport(
      queueName,
      error,
      originalData,
      contextData,
      userId,
      sessionId
    )
  }

  /**
   * Get comprehensive error handler instance
   */
  static getInstance(): PublicationImportErrorHandler {
    return new PublicationImportErrorHandler()
  }
}

// Default export
export default PublicationImportErrorHandler

// Export all types and utilities
export {
  ErrorClassifier,
  RetryManager,
  ImportQueueManager,
  BulkImportHandler
}