/**
 * Base Data Access Layer (DAL) for Admin Operations
 * Healthcare platform admin system with type-safe database operations
 * Provides common database operations, transaction helpers, and healthcare compliance
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { 
  QueryResult, 
  PaginatedResult, 
  QueryOptions,
  TransactionOptions,
  DataAccessContext,
  AdminRole,
  AuditAction,
  DataClassification,
  HIPAAContext
} from './types'
import DatabaseTransactionManager, {
  TransactionResult,
  TransactionExecutionContext
} from './transaction-manager'
import TransactionalBulkOperationsManager, {
  TransactionalBulkConfig,
  TransactionalBulkResult
} from './bulk-operations-transactional'
import {
  buildPaginationParams,
  applyQueryConditions,
  sanitizeInput,
  sanitizeHealthcareDataForLogging,
  validateWithHealthcareContext,
  determineHIPAAContext,
  validateHealthcareAccess,
  shouldAuditOperation,
  createAuditLogEntry,
  safeDatabaseOperation,
  retryDatabaseOperation,
  handleDatabaseError,
  testDatabaseConnection,
  TABLE_NAMES,
  QUERY_LIMITS
} from './utils'
import { getVersionHooksService } from '@/lib/services/version-hooks'

/**
 * Base Data Access Layer class providing common database operations
 * with healthcare compliance, audit logging, and transaction support
 */
export abstract class BaseDAL<TEntity, TCreate, TUpdate> {
  protected client: SupabaseClient
  protected tableName: string
  protected searchableColumns: string[]
  protected requiresAudit: boolean
  protected dataClassification: DataClassification
  protected context?: DataAccessContext
  protected enableVersioning: boolean
  protected versionHooks = getVersionHooksService()
  
  // Transaction and bulk operation managers
  protected transactionManager: DatabaseTransactionManager
  protected bulkOperationsManager: TransactionalBulkOperationsManager

  constructor(
    client: SupabaseClient,
    tableName: string,
    searchableColumns: string[] = [],
    requiresAudit: boolean = false,
    dataClassification: DataClassification = DataClassification.INTERNAL,
    enableVersioning: boolean = false
  ) {
    this.client = client
    this.tableName = tableName
    this.searchableColumns = searchableColumns
    this.requiresAudit = requiresAudit
    this.dataClassification = dataClassification
    this.enableVersioning = enableVersioning
    
    // Initialize transaction and bulk operation managers
    this.transactionManager = new DatabaseTransactionManager(client)
    this.bulkOperationsManager = new TransactionalBulkOperationsManager(client)
  }

  // ================================
  // Abstract Methods
  // ================================

  /**
   * Get the Zod schema for creating entities
   */
  protected abstract getCreateSchema(): z.ZodSchema<TCreate>

  /**
   * Get the Zod schema for updating entities
   */
  protected abstract getUpdateSchema(): z.ZodSchema<TUpdate>

  /**
   * Transform entity before saving to database
   */
  protected abstract transformForSave(data: TCreate | TUpdate, context?: DataAccessContext): Record<string, any>

  /**
   * Transform entity after loading from database
   */
  protected abstract transformFromDatabase(data: Record<string, any>): TEntity

  /**
   * Get the content type for versioning (override if versioning is enabled)
   */
  protected getContentType(): string {
    return this.tableName.replace(/s$/, '') // Remove trailing 's' from table name
  }

  // ================================
  // Context Management
  // ================================

  /**
   * Set the current data access context for operations
   */
  public setContext(context: DataAccessContext): this {
    this.context = context
    
    // Initialize version hooks with context if versioning is enabled
    if (this.enableVersioning && context.userId && context.role) {
      this.versionHooks.setContext(context.userId, context.role, context.permissions)
    }
    
    return this
  }

  /**
   * Validate access permissions for the current operation
   */
  protected validateAccess(action: 'read' | 'write' | 'delete', data?: any): void {
    if (!this.context) {
      throw new Error('Data access context is required for admin operations')
    }

    const hipaaContext = data ? determineHIPAAContext(data) : { 
      isHealthcareData: false, 
      complianceLevel: 'basic' as const,
      auditRequired: false,
      encryptionRequired: false
    }

    const hasAccess = validateHealthcareAccess(
      this.context.role,
      this.dataClassification,
      hipaaContext
    )

    if (!hasAccess) {
      logger.warn('Access denied for healthcare data operation', {
        userId: this.context.userId,
        role: this.context.role,
        action,
        tableName: this.tableName,
        dataClassification: this.dataClassification
      })
      throw new Error('Insufficient permissions for this operation')
    }
  }

  // ================================
  // CRUD Operations
  // ================================

  /**
   * Create a new entity
   */
  public async create(data: TCreate): Promise<QueryResult<TEntity>> {
    try {
      this.validateAccess('write', data)

      // Validate input data
      const createSchema = this.getCreateSchema()
      const hipaaContext = determineHIPAAContext(data)
      const validation = validateWithHealthcareContext(createSchema, data, hipaaContext)

      if (!validation.success) {
        logger.warn('Create validation failed', {
          tableName: this.tableName,
          errors: validation.errors
        })
        return {
          data: null,
          error: `Validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Sanitize and transform data
      const sanitizedData = sanitizeInput(validation.data)
      const transformedData = this.transformForSave(sanitizedData, this.context)

      // Add metadata
      const entityData = {
        ...transformedData,
        created_by: this.context?.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Execute create operation with retry
      const result = await retryDatabaseOperation(async () => {
        return await this.client
          .from(this.tableName)
          .insert(entityData)
          .select()
          .single()
      })

      if (result.error) {
        const error = handleDatabaseError(result.error, `Creating ${this.tableName}`)
        logger.error('Entity creation failed', {
          tableName: this.tableName,
          error: error.message,
          sanitizedData: sanitizeHealthcareDataForLogging(sanitizedData)
        })
        return { data: null, error: error.message }
      }

      const createdEntity = this.transformFromDatabase(result.data)

      // Log audit trail if required
      if (this.requiresAudit && this.context) {
        await this.logAuditAction(
          AuditAction.CREATE,
          result.data.id,
          { created: sanitizeHealthcareDataForLogging(createdEntity) }
        )
      }

      logger.info('Entity created successfully', {
        tableName: this.tableName,
        id: result.data.id,
        userId: this.context?.userId
      })

      return { data: createdEntity, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Create operation failed', {
        tableName: this.tableName,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get entity by ID
   */
  public async getById(id: string): Promise<QueryResult<TEntity>> {
    try {
      this.validateAccess('read')

      const result = await safeDatabaseOperation(
        () => this.client
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
        `Getting ${this.tableName} by ID`
      )

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      if (!result.data) {
        return { data: null, error: 'Entity not found' }
      }

      const entity = this.transformFromDatabase(result.data)

      // Log access if required
      if (this.requiresAudit && this.context) {
        await this.logAuditAction(AuditAction.VIEW, id)
      }

      return { data: entity, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get by ID operation failed', {
        tableName: this.tableName,
        id,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get multiple entities with pagination and filtering
   */
  public async getMany(options: QueryOptions = {}): Promise<PaginatedResult<TEntity>> {
    try {
      this.validateAccess('read')

      const { from, to, page, limit } = buildPaginationParams(options)

      // Build base query
      let query = this.client.from(this.tableName).select('*', { count: 'exact' })

      // Apply conditions (filtering, sorting, search)
      query = applyQueryConditions(query, options, this.searchableColumns)

      // Apply pagination
      query = query.range(from, to)

      const result = await safeDatabaseOperation(
        () => query,
        `Getting multiple ${this.tableName}`
      )

      if (result.error) {
        logger.error('Get many operation failed', {
          tableName: this.tableName,
          error: result.error.message,
          options
        })
        return {
          data: [],
          total: 0,
          page,
          limit,
          hasNext: false,
          hasPrev: false
        }
      }

      const entities = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.data?.length || 0

      return {
        data: entities,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get many operation failed', {
        tableName: this.tableName,
        error: errorMessage,
        options
      })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || QUERY_LIMITS.DEFAULT_PAGE_SIZE,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Update entity by ID with automatic versioning support
   */
  public async update(id: string, data: TUpdate): Promise<QueryResult<TEntity>> {
    try {
      this.validateAccess('write', data)

      // Validate input data
      const updateSchema = this.getUpdateSchema()
      const hipaaContext = determineHIPAAContext(data)
      const validation = validateWithHealthcareContext(updateSchema, data, hipaaContext)

      if (!validation.success) {
        logger.warn('Update validation failed', {
          tableName: this.tableName,
          id,
          errors: validation.errors
        })
        return {
          data: null,
          error: `Validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Get existing entity for audit comparison and versioning
      let existingEntity: TEntity | null = null
      const existing = await this.getById(id)
      existingEntity = existing.data

      if (!existingEntity) {
        return { data: null, error: 'Entity not found' }
      }

      // Versioning: Before update hook
      let versionMetadata = null
      if (this.enableVersioning) {
        try {
          const versionCheck = await this.versionHooks.beforeContentUpdate(
            this.getContentType(),
            id,
            validation.data as any,
            existingEntity as any
          )
          versionMetadata = versionCheck.versionMetadata
        } catch (error) {
          logger.warn('Version hook beforeContentUpdate failed', {
            tableName: this.tableName,
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Sanitize and transform data
      const sanitizedData = sanitizeInput(validation.data)
      const transformedData = this.transformForSave(sanitizedData, this.context)

      // Add update metadata
      const entityData = {
        ...transformedData,
        updated_by: this.context?.userId,
        updated_at: new Date().toISOString()
      }

      // Execute update operation with retry
      const result = await retryDatabaseOperation(async () => {
        return await this.client
          .from(this.tableName)
          .update(entityData)
          .eq('id', id)
          .select()
          .single()
      })

      if (result.error) {
        const error = handleDatabaseError(result.error, `Updating ${this.tableName}`)
        logger.error('Entity update failed', {
          tableName: this.tableName,
          id,
          error: error.message,
          sanitizedData: sanitizeHealthcareDataForLogging(sanitizedData)
        })
        return { data: null, error: error.message }
      }

      const updatedEntity = this.transformFromDatabase(result.data)

      // Versioning: After update hook
      if (this.enableVersioning && versionMetadata) {
        try {
          await this.versionHooks.afterContentUpdate(
            this.getContentType(),
            id,
            updatedEntity as any,
            versionMetadata,
            existingEntity as any
          )
        } catch (error) {
          logger.warn('Version hook afterContentUpdate failed', {
            tableName: this.tableName,
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Log audit trail if required
      if (this.requiresAudit && this.context) {
        await this.logAuditAction(
          AuditAction.UPDATE,
          id,
          {
            before: sanitizeHealthcareDataForLogging(existingEntity),
            after: sanitizeHealthcareDataForLogging(updatedEntity),
            changes: Object.keys(entityData)
          }
        )
      }

      logger.info('Entity updated successfully', {
        tableName: this.tableName,
        id,
        userId: this.context?.userId
      })

      return { data: updatedEntity, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Update operation failed', {
        tableName: this.tableName,
        id,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Delete entity by ID
   */
  public async delete(id: string): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('delete')

      // Get existing entity for audit trail
      let existingEntity: TEntity | null = null
      if (this.requiresAudit) {
        const existing = await this.getById(id)
        existingEntity = existing.data
      }

      // Execute delete operation with retry
      const result = await retryDatabaseOperation(async () => {
        return await this.client
          .from(this.tableName)
          .delete()
          .eq('id', id)
      })

      if (result.error) {
        const error = handleDatabaseError(result.error, `Deleting ${this.tableName}`)
        logger.error('Entity deletion failed', {
          tableName: this.tableName,
          id,
          error: error.message
        })
        return { data: null, error: error.message }
      }

      // Log audit trail if required
      if (this.requiresAudit && this.context) {
        await this.logAuditAction(
          AuditAction.DELETE,
          id,
          { deleted: sanitizeHealthcareDataForLogging(existingEntity) }
        )
      }

      logger.info('Entity deleted successfully', {
        tableName: this.tableName,
        id,
        userId: this.context?.userId
      })

      return { data: true, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Delete operation failed', {
        tableName: this.tableName,
        id,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Enhanced Transaction Support
  // ================================

  /**
   * Execute operations within a comprehensive transaction with rollback support
   * Provides automatic rollback on failure, deadlock detection, and integrity validation
   */
  public async executeInTransaction<TResult>(
    operations: (context: TransactionExecutionContext) => Promise<TResult>,
    options: TransactionOptions = {}
  ): Promise<QueryResult<TResult>> {
    try {
      this.validateAccess('write')

      const transactionResult = await this.transactionManager.executeTransaction(
        operations,
        options,
        this.context
      )

      if (transactionResult.success) {
        logger.info('Transaction completed successfully', {
          tableName: this.tableName,
          transactionId: transactionResult.transactionId,
          duration: transactionResult.duration,
          operationsExecuted: transactionResult.operationsExecuted,
          userId: this.context?.userId
        })

        return { data: transactionResult.data, error: null }
      } else {
        logger.error('Transaction failed', {
          tableName: this.tableName,
          transactionId: transactionResult.transactionId,
          error: transactionResult.error,
          rollbackPerformed: transactionResult.rollbackPerformed,
          rollbackReason: transactionResult.rollbackReason,
          userId: this.context?.userId
        })

        return { data: null, error: transactionResult.error }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Transaction setup failed', {
        tableName: this.tableName,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Execute operations with savepoints for nested transactions
   */
  public async executeWithSavepoints<TResult>(
    operations: (context: TransactionExecutionContext) => Promise<TResult>,
    savepointNames: string[],
    options: TransactionOptions = {}
  ): Promise<QueryResult<TResult>> {
    return this.executeInTransaction(async (txContext) => {
      // Create savepoints
      for (const savepointName of savepointNames) {
        const result = await txContext.createSavepoint(savepointName)
        if (!result.success) {
          throw new Error(`Failed to create savepoint ${savepointName}: ${result.error}`)
        }
      }

      return await operations(txContext)
    }, options)
  }

  // ================================
  // Enhanced Transactional Batch Operations
  // ================================

  /**
   * Create multiple entities in a transactional batch with comprehensive rollback support
   * Automatically rolls back all operations if any fail, with detailed error reporting
   */
  public async createBatch(
    items: TCreate[],
    options: Partial<TransactionalBulkConfig> = {}
  ): Promise<QueryResult<TEntity[]>> {
    try {
      this.validateAccess('write')

      if (items.length === 0) {
        return { data: [], error: null }
      }

      // Validate all items before processing
      const createSchema = this.getCreateSchema()
      const validatedItems: TCreate[] = []

      for (const item of items) {
        const hipaaContext = determineHIPAAContext(item)
        const validation = validateWithHealthcareContext(createSchema, item, hipaaContext)
        
        if (!validation.success) {
          return {
            data: null,
            error: `Validation failed for batch item: ${validation.errors.join(', ')}`
          }
        }
        
        validatedItems.push(validation.data)
      }

      // Prepare batch data with metadata
      const batchData = validatedItems.map(item => {
        const sanitized = sanitizeInput(item)
        const transformed = this.transformForSave(sanitized, this.context)
        
        return {
          ...transformed,
          created_by: this.context?.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      // Configure transactional bulk operation
      const bulkConfig: TransactionalBulkConfig = {
        tableName: this.tableName,
        operation: 'insert',
        data: batchData,
        batchSize: options.batchSize || 50,
        enableSavepoints: options.enableSavepoints !== false,
        savepointFrequency: options.savepointFrequency || 5,
        rollbackStrategy: options.rollbackStrategy || 'COMPLETE' as any,
        continueOnError: options.continueOnError || false,
        maxErrors: options.maxErrors || 0,
        errorThreshold: options.errorThreshold || 0,
        isolationLevel: options.isolationLevel || 'READ_COMMITTED' as any,
        timeout: options.timeout || 120000,
        integrityChecks: [
          {
            type: 'foreign_key',
            onViolation: 'abort'
          },
          {
            type: 'unique',
            onViolation: 'abort'
          }
        ] as any,
        ...options
      }

      // Execute transactional bulk operation
      const bulkResult = await this.bulkOperationsManager.executeBulkTransactional(
        bulkConfig,
        this.context
      )

      if (bulkResult.success) {
        // Transform results back to entity format
        const createdEntities = (bulkResult as any).data?.map((item: any) => 
          this.transformFromDatabase(item)
        ) || []

        // Log audit trail for batch operation
        if (this.requiresAudit && this.context) {
          await this.logAuditAction(
            AuditAction.CREATE,
            undefined,
            { 
              batchCreate: true, 
              transactionId: bulkResult.transactionId,
              count: createdEntities.length,
              performance: bulkResult.performanceMetrics,
              savepointsUsed: bulkResult.savepointsUsed,
              items: sanitizeHealthcareDataForLogging(createdEntities.slice(0, 10)) // Log first 10 for audit
            }
          )
        }

        logger.info('Transactional batch create completed successfully', {
          tableName: this.tableName,
          transactionId: bulkResult.transactionId,
          processed: bulkResult.processed,
          succeeded: bulkResult.succeeded,
          failed: bulkResult.failed,
          duration: bulkResult.duration,
          throughput: bulkResult.performanceMetrics.operationsPerSecond,
          userId: this.context?.userId
        })

        return { data: createdEntities, error: null }

      } else {
        logger.error('Transactional batch create failed', {
          tableName: this.tableName,
          transactionId: bulkResult.transactionId,
          processed: bulkResult.processed,
          succeeded: bulkResult.succeeded,
          failed: bulkResult.failed,
          rollbackPerformed: bulkResult.rollbackPerformed,
          rollbackReason: bulkResult.rollbackReason,
          errorCount: bulkResult.errors.length,
          errors: bulkResult.errors.slice(0, 5).map(e => ({ // Log first 5 errors
            type: e.type,
            message: e.message,
            severity: e.severity
          })),
          userId: this.context?.userId
        })

        return { 
          data: null, 
          error: `Batch operation failed: ${bulkResult.rollbackReason || 'Unknown error'}. ${bulkResult.errors.length} errors occurred.`
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Batch create operation setup failed', {
        tableName: this.tableName,
        count: items.length,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update multiple entities in a transactional batch
   */
  public async updateBatch(
    updates: Array<{ id: string } & Partial<TUpdate>>,
    options: Partial<TransactionalBulkConfig> = {}
  ): Promise<QueryResult<TEntity[]>> {
    try {
      this.validateAccess('write')

      if (updates.length === 0) {
        return { data: [], error: null }
      }

      // Validate all update items
      const updateSchema = this.getUpdateSchema()
      const validatedUpdates: Array<{ id: string } & Partial<TUpdate>> = []

      for (const update of updates) {
        if (!update.id) {
          return { data: null, error: 'All update items must have an id field' }
        }

        const { id, ...updateData } = update
        const hipaaContext = determineHIPAAContext(updateData)
        const validation = validateWithHealthcareContext(updateSchema, updateData, hipaaContext)
        
        if (!validation.success) {
          return {
            data: null,
            error: `Validation failed for update item ${id}: ${validation.errors.join(', ')}`
          }
        }
        
        validatedUpdates.push({ id, ...validation.data })
      }

      // Prepare update data
      const updateData = validatedUpdates.map(item => {
        const { id, ...data } = item
        const sanitized = sanitizeInput(data)
        const transformed = this.transformForSave(sanitized, this.context)
        
        return {
          id,
          ...transformed,
          updated_by: this.context?.userId,
          updated_at: new Date().toISOString()
        }
      })

      // Configure transactional bulk operation
      const bulkConfig: TransactionalBulkConfig = {
        tableName: this.tableName,
        operation: 'update',
        data: updateData,
        batchSize: options.batchSize || 50,
        enableSavepoints: options.enableSavepoints !== false,
        savepointFrequency: options.savepointFrequency || 5,
        rollbackStrategy: options.rollbackStrategy || 'COMPLETE' as any,
        isolationLevel: options.isolationLevel || 'READ_COMMITTED' as any,
        timeout: options.timeout || 120000,
        integrityChecks: [
          {
            type: 'foreign_key',
            onViolation: 'abort'
          }
        ] as any,
        ...options
      }

      // Execute transactional bulk operation
      const bulkResult = await this.bulkOperationsManager.executeBulkTransactional(
        bulkConfig,
        this.context
      )

      if (bulkResult.success) {
        // Get updated entities by their IDs
        const updatedIds = validatedUpdates.map(item => item.id)
        const entitiesResult = await this.getMany({
          filters: { id: { in: updatedIds } },
          limit: updatedIds.length
        })

        const updatedEntities = entitiesResult.data || []

        // Log audit trail
        if (this.requiresAudit && this.context) {
          await this.logAuditAction(
            AuditAction.UPDATE,
            undefined,
            { 
              batchUpdate: true, 
              transactionId: bulkResult.transactionId,
              count: updatedEntities.length,
              performance: bulkResult.performanceMetrics,
              updatedIds: updatedIds.slice(0, 10) // Log first 10 IDs for audit
            }
          )
        }

        logger.info('Transactional batch update completed successfully', {
          tableName: this.tableName,
          transactionId: bulkResult.transactionId,
          processed: bulkResult.processed,
          succeeded: bulkResult.succeeded,
          duration: bulkResult.duration,
          userId: this.context?.userId
        })

        return { data: updatedEntities, error: null }

      } else {
        logger.error('Transactional batch update failed', {
          tableName: this.tableName,
          transactionId: bulkResult.transactionId,
          rollbackPerformed: bulkResult.rollbackPerformed,
          rollbackReason: bulkResult.rollbackReason,
          errorCount: bulkResult.errors.length,
          userId: this.context?.userId
        })

        return { 
          data: null, 
          error: `Batch update failed: ${bulkResult.rollbackReason || 'Unknown error'}`
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Batch update operation failed', {
        tableName: this.tableName,
        count: updates.length,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Delete multiple entities in a transactional batch
   */
  public async deleteBatch(
    ids: string[],
    options: Partial<TransactionalBulkConfig> = {}
  ): Promise<QueryResult<number>> {
    try {
      this.validateAccess('delete')

      if (ids.length === 0) {
        return { data: 0, error: null }
      }

      // Configure transactional bulk operation
      const bulkConfig: TransactionalBulkConfig = {
        tableName: this.tableName,
        operation: 'delete',
        data: ids,
        batchSize: options.batchSize || 100,
        enableSavepoints: options.enableSavepoints !== false,
        rollbackStrategy: options.rollbackStrategy || 'COMPLETE' as any,
        isolationLevel: options.isolationLevel || 'READ_COMMITTED' as any,
        timeout: options.timeout || 120000,
        ...options
      }

      // Execute transactional bulk operation
      const bulkResult = await this.bulkOperationsManager.executeBulkTransactional(
        bulkConfig,
        this.context
      )

      if (bulkResult.success) {
        // Log audit trail
        if (this.requiresAudit && this.context) {
          await this.logAuditAction(
            AuditAction.DELETE,
            undefined,
            { 
              batchDelete: true, 
              transactionId: bulkResult.transactionId,
              count: bulkResult.succeeded,
              deletedIds: ids.slice(0, 10) // Log first 10 IDs for audit
            }
          )
        }

        logger.info('Transactional batch delete completed successfully', {
          tableName: this.tableName,
          transactionId: bulkResult.transactionId,
          processed: bulkResult.processed,
          succeeded: bulkResult.succeeded,
          userId: this.context?.userId
        })

        return { data: bulkResult.succeeded, error: null }

      } else {
        logger.error('Transactional batch delete failed', {
          tableName: this.tableName,
          transactionId: bulkResult.transactionId,
          rollbackPerformed: bulkResult.rollbackPerformed,
          rollbackReason: bulkResult.rollbackReason,
          userId: this.context?.userId
        })

        return { 
          data: null, 
          error: `Batch delete failed: ${bulkResult.rollbackReason || 'Unknown error'}`
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Batch delete operation failed', {
        tableName: this.tableName,
        count: ids.length,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Health and Monitoring
  // ================================

  /**
   * Test database connection health
   */
  public async healthCheck(): Promise<{
    healthy: boolean
    responseTime: number
    error?: string
  }> {
    return await testDatabaseConnection(this.client)
  }

  /**
   * Get table statistics
   */
  public async getStats(): Promise<{
    totalRecords: number
    recentActivity: number
    error?: string
  }> {
    try {
      // Get total count
      const { count: totalRecords, error: countError } = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })

      if (countError) {
        return {
          totalRecords: 0,
          recentActivity: 0,
          error: countError.message
        }
      }

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count: recentActivity, error: activityError } = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .gte('updated_at', yesterday)

      return {
        totalRecords: totalRecords || 0,
        recentActivity: recentActivity || 0,
        error: activityError?.message
      }

    } catch (error) {
      return {
        totalRecords: 0,
        recentActivity: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ================================
  // Audit Logging
  // ================================

  /**
   * Log audit action
   */
  protected async logAuditAction(
    action: AuditAction,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.context || !shouldAuditOperation(action, this.tableName, details)) {
      return
    }

    try {
      const auditEntry = createAuditLogEntry(
        this.context.userId,
        action,
        this.tableName,
        resourceId,
        details
      )

      await this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .insert(auditEntry)

    } catch (error) {
      logger.error('Failed to log audit action', {
        userId: this.context.userId,
        action,
        resourceType: this.tableName,
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Factory function to create DAL instances with proper configuration
 */
export function createDALInstance<TEntity, TCreate, TUpdate>(
  DALClass: new (
    client: SupabaseClient,
    tableName: string,
    searchableColumns?: string[],
    requiresAudit?: boolean,
    dataClassification?: DataClassification,
    enableVersioning?: boolean
  ) => BaseDAL<TEntity, TCreate, TUpdate>,
  client: SupabaseClient,
  tableName: string,
  searchableColumns: string[] = [],
  requiresAudit: boolean = false,
  dataClassification: DataClassification = DataClassification.INTERNAL,
  enableVersioning: boolean = false
): BaseDAL<TEntity, TCreate, TUpdate> {
  return new DALClass(
    client,
    tableName,
    searchableColumns,
    requiresAudit,
    dataClassification,
    enableVersioning
  )
}

export default BaseDAL