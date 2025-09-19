/**
 * Injectable BaseDAL - Refactored for testability
 * This version accepts dependencies via constructor injection
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { 
  QueryResult, 
  PaginatedResult,
  QueryOptions,
  DataAccessContext,
  AuditAction
} from './types'

// Define the utils interface for dependency injection
export interface DALUtils {
  buildPaginationParams: (options?: QueryOptions) => any
  applyQueryConditions: (query: any, options?: QueryOptions) => any
  sanitizeInput: <T>(data: T) => T
  sanitizeHealthcareDataForLogging: (data: any) => any
  validateWithHealthcareContext: (schema: z.ZodSchema, data: any, context?: any) => any
  determineHIPAAContext: (data: any) => any
  validateHealthcareAccess: (role: string, accessLevel: string, context: any) => boolean
  shouldAuditOperation: (action?: string, context?: any) => boolean
  createAuditLogEntry: (userId: string, action: string, resourceType: string, resourceId?: string, details?: any) => any
  safeDatabaseOperation: <T>(operation: () => Promise<{ data: T | null; error: any }>, context: string) => Promise<{ data: T | null; error: Error | null }>
  retryDatabaseOperation: <T>(operation: () => Promise<{ data: T | null; error: any }>, retries?: number) => Promise<{ data: T | null; error: any }>
  handleDatabaseError: (error: any, context?: string) => any
  testDatabaseConnection: (client: any) => Promise<{ healthy: boolean; responseTime: number; error?: string }>
  TABLE_NAMES: Record<string, string>
  QUERY_LIMITS: Record<string, number>
}

// Default implementation that imports the real utils
async function getDefaultUtils(): Promise<DALUtils> {
  const utils = await import('./utils')
  return utils
}

/**
 * Base Data Access Layer with dependency injection
 */
export abstract class InjectableBaseDAL<TEntity, TCreate, TUpdate> {
  protected supabase: SupabaseClient
  protected client: SupabaseClient // Expose client for backward compatibility
  protected tableName: string
  protected searchableFields: string[]
  protected requiresAudit: boolean
  protected context?: DataAccessContext
  private utils: DALUtils | Promise<DALUtils>

  constructor(
    supabase: SupabaseClient,
    tableName: string,
    searchableFields: string[] = [],
    requiresAudit: boolean = false,
    utils?: DALUtils
  ) {
    this.supabase = supabase
    this.client = supabase // Expose client for backward compatibility
    this.tableName = tableName
    this.searchableFields = searchableFields
    this.requiresAudit = requiresAudit
    this.utils = utils || getDefaultUtils()
  }

  /**
   * Get utils (handles async loading if needed)
   */
  private async getUtils(): Promise<DALUtils> {
    if (this.utils instanceof Promise) {
      this.utils = await this.utils
    }
    return this.utils
  }

  /**
   * Set the data access context
   */
  setContext(context: DataAccessContext): this {
    this.context = context
    return this
  }

  /**
   * Get the current context
   */
  protected getContext(): DataAccessContext {
    if (!this.context) {
      throw new Error('Data access context not set')
    }
    return this.context
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract getCreateSchema(): z.ZodSchema
  protected abstract getUpdateSchema(): z.ZodSchema
  protected abstract transformForSave(data: TCreate | TUpdate): Record<string, any>
  protected abstract transformFromDatabase(data: Record<string, any>): TEntity

  /**
   * Create a new entity
   */
  async create(data: TCreate): Promise<QueryResult<TEntity>> {
    try {
      const context = this.getContext()
      const utils = await this.getUtils()

      // Validate input data
      const createSchema = this.getCreateSchema()
      const hipaaContext = utils.determineHIPAAContext(data)
      const validation = utils.validateWithHealthcareContext(createSchema, data, hipaaContext)

      if (!validation.success) {
        logger.warn('Create validation failed', {
          tableName: this.tableName,
          errors: validation.errors
        })
        return {
          data: null,
          error: validation.errors.join(', ')
        }
      }

      // Sanitize and transform data
      const sanitizedData = utils.sanitizeInput(validation.data)
      const dataForSave = this.transformForSave(sanitizedData as TCreate)

      // Add metadata
      const now = new Date().toISOString()
      const enrichedData = {
        ...dataForSave,
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId
      }

      // Execute database operation
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .insert(enrichedData)
          .select()
          .single()
      }, 'create')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      // Log audit action if required
      if (this.requiresAudit && utils.shouldAuditOperation('create', hipaaContext)) {
        await this.logAuditAction('create', result.data?.id, {
          data: utils.sanitizeHealthcareDataForLogging(sanitizedData),
          hipaaContext
        })
      }

      const transformed = this.transformFromDatabase(result.data)
      return { data: transformed, error: null }

    } catch (error) {
      const utils = await this.getUtils()
      logger.error('Create operation failed', {
        tableName: this.tableName,
        error: utils.handleDatabaseError(error, 'create')
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Create operation failed'
      }
    }
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<QueryResult<TEntity>> {
    try {
      const context = this.getContext()
      const utils = await this.getUtils()

      // Validate access
      this.validateAccess('read')

      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single()
      }, 'read')

      if (result.error || !result.data) {
        return { data: null, error: result.error?.message || 'Entity not found' }
      }

      // Log audit action if required
      if (this.requiresAudit && utils.shouldAuditOperation('read')) {
        await this.logAuditAction('view', id)
      }

      const transformed = this.transformFromDatabase(result.data)
      return { data: transformed, error: null }

    } catch (error) {
      const utils = await this.getUtils()
      logger.error('Get by ID failed', {
        tableName: this.tableName,
        id,
        error: utils.handleDatabaseError(error, 'read')
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get operation failed'
      }
    }
  }

  /**
   * Update an entity
   */
  async update(id: string, data: TUpdate): Promise<QueryResult<TEntity>> {
    try {
      const context = this.getContext()
      const utils = await this.getUtils()

      // Validate access
      this.validateAccess('write')

      // Get existing entity for audit
      const existing = await this.getById(id)
      if (!existing.data) {
        return { data: null, error: 'Entity not found' }
      }

      // Validate update data
      const updateSchema = this.getUpdateSchema()
      const hipaaContext = utils.determineHIPAAContext(data)
      const validation = utils.validateWithHealthcareContext(updateSchema, data, hipaaContext)

      if (!validation.success) {
        return {
          data: null,
          error: validation.errors.join(', ')
        }
      }

      // Sanitize and transform data
      const sanitizedData = utils.sanitizeInput(validation.data)
      const dataForSave = this.transformForSave(sanitizedData as TUpdate)

      // Add metadata
      const enrichedData = {
        ...dataForSave,
        updated_at: new Date().toISOString(),
        updated_by: context.userId
      }

      // Execute update
      const result = await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .update(enrichedData)
          .eq('id', id)
          .select()
          .single()
      }, 'update')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      // Log audit action
      if (this.requiresAudit && utils.shouldAuditOperation('update', hipaaContext)) {
        await this.logAuditAction('update', id, {
          before: utils.sanitizeHealthcareDataForLogging(existing.data),
          after: utils.sanitizeHealthcareDataForLogging(result.data),
          changes: sanitizedData
        })
      }

      const transformed = this.transformFromDatabase(result.data)
      return { data: transformed, error: null }

    } catch (error) {
      const utils = await this.getUtils()
      logger.error('Update operation failed', {
        tableName: this.tableName,
        id,
        error: utils.handleDatabaseError(error, 'update')
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Update operation failed'
      }
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<QueryResult<boolean>> {
    try {
      const context = this.getContext()
      const utils = await this.getUtils()

      // Validate access
      this.validateAccess('delete')

      // Get existing entity for audit
      const existing = await this.getById(id)
      if (!existing.data) {
        return { data: null, error: 'Entity not found' }
      }

      // Execute delete
      await utils.safeDatabaseOperation(async () => {
        return await this.supabase
          .from(this.tableName)
          .delete()
          .eq('id', id)
      }, 'delete')

      // Log audit action
      if (this.requiresAudit) {
        await this.logAuditAction('delete', id, {
          deleted: utils.sanitizeHealthcareDataForLogging(existing.data)
        })
      }

      return { data: true, error: null }

    } catch (error) {
      const utils = await this.getUtils()
      logger.error('Delete operation failed', {
        tableName: this.tableName,
        id,
        error: utils.handleDatabaseError(error, 'delete')
      })
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Delete operation failed'
      }
    }
  }

  /**
   * Get multiple entities with enhanced pagination and performance optimization
   */
  async getMany(options: QueryOptions = {}): Promise<PaginatedResult<TEntity>> {
    const startTime = performance.now()
    
    try {
      const context = this.getContext()
      const utils = await this.getUtils()

      // Validate access
      this.validateAccess('read')

      // Use cursor-based pagination for large datasets
      if (options.cursor || (options.limit && options.limit > 100)) {
        return await this.getManyWithCursor(options)
      }

      const paginationParams = utils.buildPaginationParams(options)
      const { from, to, page, limit, selectFields, includeCount } = paginationParams

      // Build optimized query
      const { query: baseQuery, selectClause } = await utils.buildOptimizedQuery(
        this.supabase,
        this.tableName,
        options,
        this.getDefaultRelations()
      )

      let query = baseQuery
      if (!includeCount) {
        query = this.supabase.from(this.tableName).select(selectClause)
      }

      // Apply conditions (filtering, sorting, search)
      query = utils.applyQueryConditions(query, options, this.searchableFields)

      // Apply pagination
      query = query.range(from, to)

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getMany')

      if (result.error) {
        logger.error('Get many operation failed', {
          tableName: this.tableName,
          error: result.error.message,
          options,
          queryTime: performance.now() - startTime
        })
        return this.getEmptyPaginatedResult(options)
      }

      const entities = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.count || entities.length
      const queryTime = performance.now() - startTime

      // Generate cursors for next/prev navigation
      const cursors = entities.length > 0 ? {
        before: entities.length > 0 ? utils.CursorUtils.encode(entities[0], options.sortBy || 'created_at') : undefined,
        after: entities.length > 0 ? utils.CursorUtils.encode(entities[entities.length - 1], options.sortBy || 'created_at') : undefined,
        current: options.cursor
      } : undefined

      return {
        data: entities,
        total,
        page,
        limit,
        hasNext: from + entities.length < total,
        hasPrev: page > 1,
        cursors,
        queryTime,
        cacheHit: false // TODO: Implement cache hit detection
      }

    } catch (error) {
      const utils = await this.getUtils()
      const queryTime = performance.now() - startTime
      
      logger.error('Get many operation failed', {
        tableName: this.tableName,
        error: utils.handleDatabaseError(error, 'getMany'),
        options,
        queryTime
      })
      return this.getEmptyPaginatedResult(options)
    }
  }

  /**
   * Get multiple entities using cursor-based pagination for large datasets
   */
  async getManyWithCursor(options: QueryOptions): Promise<PaginatedResult<TEntity>> {
    const startTime = performance.now()
    
    try {
      const utils = await this.getUtils()
      const cursorParams = utils.buildCursorPagination(options)
      const { cursor, direction, limit, sortBy, ascending } = cursorParams

      // Build optimized query with cursor support
      const { query: baseQuery } = await utils.buildOptimizedQuery(
        this.supabase,
        this.tableName,
        options,
        this.getDefaultRelations()
      )

      let query = baseQuery

      // Apply cursor condition if provided
      if (cursor) {
        const cursorCondition = utils.CursorUtils.buildCursorCondition(cursor, direction, sortBy, ascending)
        
        if (ascending) {
          if (direction === 'after') {
            query = query.or(`${cursorCondition.field}.gt.${cursorCondition.value},and(${cursorCondition.field}.eq.${cursorCondition.value},${cursorCondition.fallback.field}.${cursorCondition.fallback.op}.${cursorCondition.fallback.value})`)
          } else {
            query = query.or(`${cursorCondition.field}.lt.${cursorCondition.value},and(${cursorCondition.field}.eq.${cursorCondition.value},${cursorCondition.fallback.field}.${cursorCondition.fallback.op}.${cursorCondition.fallback.value})`)
          }
        } else {
          if (direction === 'after') {
            query = query.or(`${cursorCondition.field}.lt.${cursorCondition.value},and(${cursorCondition.field}.eq.${cursorCondition.value},${cursorCondition.fallback.field}.${cursorCondition.fallback.op}.${cursorCondition.fallback.value})`)
          } else {
            query = query.or(`${cursorCondition.field}.gt.${cursorCondition.value},and(${cursorCondition.field}.eq.${cursorCondition.value},${cursorCondition.fallback.field}.${cursorCondition.fallback.op}.${cursorCondition.fallback.value})`)
          }
        }
      }

      // Apply other conditions
      query = utils.applyQueryConditions(query, options, this.searchableFields)

      // Apply ordering
      query = query.order(sortBy, { ascending })
      query = query.order('id', { ascending }) // Secondary sort for consistency

      // Limit results (fetch one extra to check if there are more)
      query = query.limit(limit + 1)

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getManyWithCursor')

      if (result.error) {
        logger.error('Cursor-based query failed', {
          tableName: this.tableName,
          error: result.error.message,
          options,
          queryTime: performance.now() - startTime
        })
        return this.getEmptyPaginatedResult(options)
      }

      const data = result.data || []
      const hasMore = data.length > limit
      const entities = data.slice(0, limit).map(item => this.transformFromDatabase(item))
      const queryTime = performance.now() - startTime

      // Generate cursors for navigation
      const cursors = entities.length > 0 ? {
        before: entities.length > 0 ? utils.CursorUtils.encode(entities[0], sortBy) : undefined,
        after: entities.length > 0 ? utils.CursorUtils.encode(entities[entities.length - 1], sortBy) : undefined,
        current: cursor
      } : undefined

      return {
        data: entities,
        total: -1, // Unknown total with cursor pagination
        page: -1,  // Not applicable with cursor pagination
        limit,
        hasNext: hasMore,
        hasPrev: !!cursor,
        cursors,
        queryTime,
        cacheHit: false
      }

    } catch (error) {
      const utils = await this.getUtils()
      const queryTime = performance.now() - startTime
      
      logger.error('Cursor-based pagination failed', {
        tableName: this.tableName,
        error: utils.handleDatabaseError(error, 'getManyWithCursor'),
        options,
        queryTime
      })
      return this.getEmptyPaginatedResult(options)
    }
  }

  /**
   * Get total count efficiently for large datasets
   */
  async getCount(options: QueryOptions = {}): Promise<number> {
    try {
      const utils = await this.getUtils()
      
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      // Apply only filters, no sorting or pagination for count
      if (options.filters) {
        query = utils.applyQueryConditions(query, { 
          ...options, 
          sortBy: undefined, 
          sortOrder: undefined 
        }, this.searchableFields)
      }

      const result = await utils.safeDatabaseOperation(async () => {
        return await query
      }, 'getCount')

      return result.count || 0
    } catch (error) {
      logger.error('Count operation failed', { 
        tableName: this.tableName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return 0
    }
  }

  /**
   * Get default relations for optimized queries (override in subclasses)
   */
  protected getDefaultRelations(): string[] {
    return []
  }

  /**
   * Get empty paginated result for error handling
   */
  private getEmptyPaginatedResult(options: QueryOptions): PaginatedResult<TEntity> {
    return {
      data: [],
      total: 0,
      page: options.page || 1,
      limit: options.limit || 20,
      hasNext: false,
      hasPrev: false,
      queryTime: 0,
      cacheHit: false
    }
  }

  /**
   * Validate access permissions
   */
  protected validateAccess(action: 'read' | 'write' | 'delete', data?: any): void {
    if (!this.context) {
      throw new Error('Data access context is required for admin operations')
    }

    // For now, basic validation - the utils would need to be synchronous
    // This is a simplification for the migration
    if (!this.context.userId) {
      throw new Error(`Authentication required for ${action} operation`)
    }

    if (!this.context.role) {
      throw new Error(`Role required for ${action} operation`)
    }
  }

  /**
   * Log audit action
   */
  protected async logAuditAction(
    action: AuditAction | string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const context = this.getContext()
      const utils = await this.getUtils()

      const auditEntry = utils.createAuditLogEntry(
        context.userId,
        action,
        this.tableName,
        resourceId,
        {
          ...details,
          role: context.role,
          permissions: context.permissions,
          classification: context.classification
        }
      )

      await this.supabase
        .from(utils.TABLE_NAMES.AUDIT_LOGS || 'audit_logs')
        .insert(auditEntry)

    } catch (error) {
      // Log error but don't fail the main operation
      logger.error('Failed to log audit action', { error })
    }
  }
}