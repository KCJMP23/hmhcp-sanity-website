/**
 * Admin Data Access Layer Utilities
 * Database utility functions, query builders, and healthcare-specific validation helpers
 * Healthcare platform admin system utilities
 */

import { z } from 'zod'
import { logger } from '../../logger'
import { 
  QueryOptions, 
  DataClassification, 
  HIPAAContext, 
  AdminRole,
  ContentStatus,
  AuditAction,
  isHealthcareData
} from './types'
import { SupabaseClient } from '@supabase/supabase-js'

// ================================
// Query Builder Helpers
// ================================

// Import memory management utilities
import { memoryManager } from '@/lib/memory/memory-manager'
import { CursorUtils } from '@/lib/memory/cursor-utils'
import { StreamingPaginator } from '@/lib/memory/streaming-paginator'

// Export cursor utilities for use in DAL
// CursorUtils is exported below

/**
 * Builds pagination parameters for Supabase queries with cursor support and memory safety
 */
export function buildPaginationParams(options: QueryOptions) {
  const page = options.page || 1
  
  // Get memory-safe limit based on current memory pressure
  const requestedLimit = options.limit || 20
  const memoryAdjustedLimit = memoryManager.getRecommendedBatchSize(requestedLimit)
  const limit = Math.min(memoryAdjustedLimit, 1000)
  
  // Log if limit was reduced due to memory pressure
  if (limit < requestedLimit) {
    logger.info('Pagination limit reduced due to memory pressure', {
      requested: requestedLimit,
      adjusted: limit,
      memoryStatus: memoryManager.getMemoryStatus().percentage
    })
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1

  return { 
    from, 
    to, 
    page, 
    limit,
    cursor: options.cursor,
    cursorDirection: options.cursorDirection,
    selectFields: options.selectFields,
    includeCount: options.includeCount !== false, // Default to true
    useBatching: options.useBatching || false,
    batchSize: Math.min(options.batchSize || 100, limit),
    memoryOptimized: limit < requestedLimit // Flag to indicate memory optimization
  }
}

/**
 * Builds cursor-based pagination for very large datasets with memory safety
 */
export function buildCursorPagination(options: QueryOptions) {
  // Get memory-safe limit
  const requestedLimit = options.limit || 50
  const memoryAdjustedLimit = memoryManager.getRecommendedBatchSize(requestedLimit)
  const limit = Math.min(memoryAdjustedLimit, 1000)
  
  const sortBy = options.sortBy || 'created_at'
  const sortOrder = options.sortOrder || 'desc'
  
  return {
    cursor: options.cursor,
    direction: options.cursorDirection || 'after',
    limit,
    sortBy,
    sortOrder,
    ascending: sortOrder === 'asc',
    memoryOptimized: limit < requestedLimit
  }
}

/**
 * Build optimized query with memory-aware field selection
 */
export async function buildOptimizedQuery(
  supabase: SupabaseClient,
  tableName: string,
  options: QueryOptions,
  defaultRelations: string[] = []
): Promise<{ query: any; selectClause: string }> {
  // Check memory status before building query
  const memStatus = memoryManager.getMemoryStatus()
  const isHighMemoryPressure = memStatus.percentage > 70
  
  // Build select clause based on memory pressure
  let selectClause = '*'
  
  if (options.selectFields && options.selectFields.length > 0) {
    selectClause = options.selectFields.join(',')
  } else if (isHighMemoryPressure) {
    // In high memory situations, select only essential fields
    selectClause = 'id,created_at,updated_at'
    logger.info('Using reduced field selection due to memory pressure')
  }
  
  // Add relations if memory allows
  if (!isHighMemoryPressure && defaultRelations.length > 0) {
    const relations = defaultRelations.join(',')
    selectClause = `${selectClause},${relations}`
  }
  
  // Build the query
  const query = supabase
    .from(tableName)
    .select(selectClause, { 
      count: options.includeCount !== false ? 'exact' : undefined
    })
  
  return { query, selectClause }
}

/**
 * Builds sorting parameters for Supabase queries
 */
export function buildSortingParams(options: QueryOptions) {
  const sortBy = options.sortBy || 'created_at'
  const sortOrder = options.sortOrder || 'desc'
  const ascending = sortOrder === 'asc'

  return { sortBy, ascending }
}

/**
 * Builds filter conditions for Supabase queries
 */
export function buildFilterConditions(filters: Record<string, any>) {
  const conditions: Array<{ column: string; operator: string; value: any }> = []

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue

    if (Array.isArray(value)) {
      conditions.push({ column: key, operator: 'in', value })
    } else if (typeof value === 'string' && value.includes('*')) {
      // Wildcard search
      const likeValue = value.replace(/\*/g, '%')
      conditions.push({ column: key, operator: 'ilike', value: likeValue })
    } else {
      conditions.push({ column: key, operator: 'eq', value })
    }
  }

  return conditions
}

/**
 * Applies query conditions to a Supabase query builder
 */
export function applyQueryConditions(
  query: any, 
  options: QueryOptions,
  searchableColumns: string[] = []
) {
  // Apply filters
  if (options.filters) {
    const conditions = buildFilterConditions(options.filters)
    conditions.forEach(({ column, operator, value }) => {
      switch (operator) {
        case 'eq':
          query = query.eq(column, value)
          break
        case 'in':
          query = query.in(column, value)
          break
        case 'ilike':
          query = query.ilike(column, value)
          break
        case 'gte':
          query = query.gte(column, value)
          break
        case 'lte':
          query = query.lte(column, value)
          break
        default:
          logger.warn('Unknown query operator', { operator, column, value })
      }
    })
  }

  // Apply search across searchable columns
  if (options.search && searchableColumns.length > 0) {
    const searchTerm = `%${options.search}%`
    const searchConditions = searchableColumns
      .map(col => `${col}.ilike.${searchTerm}`)
      .join(',')
    query = query.or(searchConditions)
  }

  // Apply sorting
  const { sortBy, ascending } = buildSortingParams(options)
  query = query.order(sortBy, { ascending })

  return query
}

// ================================
// Data Transformation Utilities
// ================================

/**
 * Sanitizes user input for database operations
 */
export function sanitizeInput(input: any): any {
  if (input === null || input === undefined) {
    return null
  }

  if (typeof input === 'string') {
    return input.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}

// ================================
// Performance Optimization Utilities
// ================================

/**
 * Enhanced Batch Loader to prevent N+1 queries with advanced optimization
 */
export class BatchLoader<K, V> {
  private batches = new Map<string, K[]>()
  private callbacks = new Map<string, ((keys: K[]) => Promise<V[]>)>()
  private cache = new Map<string, V>()
  private pendingPromises = new Map<string, Promise<V | null>>()
  private pendingTimeouts = new Map<string, NodeJS.Timeout>()
  private queryDeduplication = new Map<string, Set<string>>()
  private performanceMetrics = new Map<string, { totalQueries: number, totalTime: number, batchSize: number[] }>()
  private maxBatchSize: number
  private batchTimeout: number
  private cacheExpiry: number
  private cacheTimestamps = new Map<string, number>()

  constructor(maxBatchSize = 100, batchTimeout = 10, cacheExpiry = 300000) {
    this.maxBatchSize = maxBatchSize
    this.batchTimeout = batchTimeout
    this.cacheExpiry = cacheExpiry
  }

  /**
   * Enhanced load method with deduplication and performance tracking
   */
  async load<T extends V>(
    key: K, 
    loader: (keys: K[]) => Promise<T[]>, 
    options: {
      cacheKey?: string
      ttl?: number
      priority?: 'low' | 'normal' | 'high'
      relationshipType?: string
    } = {}
  ): Promise<T | null> {
    const keyStr = options.cacheKey || JSON.stringify(key)
    const loaderKey = `${loader.name || 'anonymous'}_${options.relationshipType || 'default'}`
    const now = Date.now()
    
    // Check cache with expiry
    if (this.cache.has(keyStr)) {
      const timestamp = this.cacheTimestamps.get(keyStr) || 0
      const ttl = options.ttl || this.cacheExpiry
      if (now - timestamp < ttl) {
        return this.cache.get(keyStr) as T
      } else {
        // Remove expired cache
        this.cache.delete(keyStr)
        this.cacheTimestamps.delete(keyStr)
      }
    }

    // Check if already pending to avoid duplicate requests
    if (this.pendingPromises.has(keyStr)) {
      return this.pendingPromises.get(keyStr) as Promise<T | null>
    }

    // Initialize deduplication tracking
    if (!this.queryDeduplication.has(loaderKey)) {
      this.queryDeduplication.set(loaderKey, new Set())
    }

    const deduplicationSet = this.queryDeduplication.get(loaderKey)!
    if (deduplicationSet.has(keyStr)) {
      // Already processing this key, wait for result
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(keyStr)) {
            clearInterval(checkInterval)
            resolve(this.cache.get(keyStr) as T)
          }
        }, 5)
        
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve(null)
        }, this.batchTimeout * 2)
      })
    }

    deduplicationSet.add(keyStr)

    // Add to batch with priority handling
    if (!this.batches.has(loaderKey)) {
      this.batches.set(loaderKey, [])
      this.callbacks.set(loaderKey, loader as (keys: K[]) => Promise<V[]>)
    }

    const batch = this.batches.get(loaderKey)!
    
    // Priority insertion
    if (options.priority === 'high') {
      batch.unshift(key)
    } else {
      batch.push(key)
    }

    // Create promise for this specific key
    const promise = this.createLoadPromise<T>(keyStr, loaderKey, options)
    this.pendingPromises.set(keyStr, promise)

    // Set timeout to execute batch
    if (this.pendingTimeouts.has(loaderKey)) {
      clearTimeout(this.pendingTimeouts.get(loaderKey)!)
    }

    const timeout = setTimeout(async () => {
      try {
        await this.executeBatch(loaderKey)
      } catch (error) {
        logger.error('Batch execution timeout failed', { error, loaderKey })
      }
    }, this.batchTimeout)

    this.pendingTimeouts.set(loaderKey, timeout)

    // Execute immediately if batch is full or high priority
    if (batch.length >= this.maxBatchSize || options.priority === 'high') {
      clearTimeout(timeout)
      setImmediate(async () => {
        try {
          await this.executeBatch(loaderKey)
        } catch (error) {
          logger.error('Immediate batch execution failed', { error, loaderKey })
        }
      })
    }

    return promise
  }

  /**
   * Preload multiple keys efficiently
   */
  async preload<T extends V>(
    keys: K[],
    loader: (keys: K[]) => Promise<T[]>,
    options: {
      batchSize?: number
      relationshipType?: string
      priority?: 'low' | 'normal' | 'high'
    } = {}
  ): Promise<Map<string, T | null>> {
    const batchSize = options.batchSize || this.maxBatchSize
    const results = new Map<string, T | null>()
    
    // Split keys into batches
    const batches: K[][] = []
    for (let i = 0; i < keys.length; i += batchSize) {
      batches.push(keys.slice(i, i + batchSize))
    }

    // Process batches in parallel
    const batchPromises = batches.map(async (batch) => {
      const loadPromises = batch.map(key => 
        this.load(key, loader, { 
          priority: options.priority || 'high', 
          relationshipType: options.relationshipType 
        })
      )
      
      const batchResults = await Promise.all(loadPromises)
      batch.forEach((key, index) => {
        results.set(JSON.stringify(key), batchResults[index])
      })
    })

    await Promise.all(batchPromises)
    return results
  }

  /**
   * Bulk loader for complex relationships
   */
  async loadMany<T extends V>(
    keys: K[],
    loader: (keys: K[]) => Promise<T[]>,
    keyExtractor: (item: T) => K,
    options: {
      relationshipType?: string
      allowPartial?: boolean
    } = {}
  ): Promise<T[]> {
    const startTime = performance.now()
    const loaderKey = `${loader.name || 'anonymous'}_bulk_${options.relationshipType || 'default'}`

    try {
      // Remove duplicates
      const uniqueKeys = Array.from(new Set(keys.map(k => JSON.stringify(k))))
        .map(k => JSON.parse(k))

      // Check cache first
      const cachedResults: T[] = []
      const uncachedKeys: K[] = []
      const now = Date.now()

      uniqueKeys.forEach(key => {
        const keyStr = JSON.stringify(key)
        if (this.cache.has(keyStr)) {
          const timestamp = this.cacheTimestamps.get(keyStr) || 0
          if (now - timestamp < this.cacheExpiry) {
            cachedResults.push(this.cache.get(keyStr) as T)
            return
          }
        }
        uncachedKeys.push(key)
      })

      // Fetch uncached data
      let fetchedResults: T[] = []
      if (uncachedKeys.length > 0) {
        fetchedResults = await loader(uncachedKeys)
        
        // Cache new results
        fetchedResults.forEach(result => {
          const key = keyExtractor(result)
          const keyStr = JSON.stringify(key)
          this.cache.set(keyStr, result)
          this.cacheTimestamps.set(keyStr, now)
        })
      }

      const allResults = [...cachedResults, ...fetchedResults]
      
      // Track performance
      this.trackPerformance(loaderKey, performance.now() - startTime, uniqueKeys.length)

      return allResults

    } catch (error) {
      logger.error('Bulk load operation failed', { 
        error, 
        loaderKey, 
        keyCount: keys.length,
        queryTime: performance.now() - startTime
      })
      
      if (options.allowPartial) {
        return []
      }
      throw error
    }
  }

  /**
   * Create promise for specific key load
   */
  private createLoadPromise<T extends V>(
    keyStr: string, 
    loaderKey: string, 
    options: any
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const checkResult = () => {
        if (this.cache.has(keyStr)) {
          const result = this.cache.get(keyStr) as T
          this.pendingPromises.delete(keyStr)
          this.queryDeduplication.get(loaderKey)?.delete(keyStr)
          resolve(result)
        } else {
          // Result not found after batch execution
          this.pendingPromises.delete(keyStr)
          this.queryDeduplication.get(loaderKey)?.delete(keyStr)
          resolve(null)
        }
      }

      // Set a maximum wait time
      setTimeout(() => {
        if (this.pendingPromises.has(keyStr)) {
          this.pendingPromises.delete(keyStr)
          this.queryDeduplication.get(loaderKey)?.delete(keyStr)
          resolve(null)
        }
      }, this.batchTimeout * 3)

      // Store the resolver function
      ;(this as any)[`resolver_${keyStr}`] = checkResult
    })
  }

  /**
   * Enhanced batch execution with error handling and metrics
   */
  private async executeBatch(loaderKey: string) {
    const batch = this.batches.get(loaderKey)
    const loader = this.callbacks.get(loaderKey)

    if (!batch || !loader || batch.length === 0) return

    const startTime = performance.now()
    const batchSize = batch.length

    try {
      // Execute the batch loader
      const results = await loader([...batch]) // Clone to avoid mutation

      const now = Date.now()
      
      // Cache results and notify pending promises
      batch.forEach((key, index) => {
        const keyStr = JSON.stringify(key)
        if (results[index]) {
          this.cache.set(keyStr, results[index])
          this.cacheTimestamps.set(keyStr, now)
        }
        
        // Trigger promise resolution
        const resolver = (this as any)[`resolver_${keyStr}`]
        if (resolver) {
          resolver()
          delete (this as any)[`resolver_${keyStr}`]
        }
      })

      // Track performance metrics
      this.trackPerformance(loaderKey, performance.now() - startTime, batchSize)

      logger.debug('Batch executed successfully', { 
        loaderKey, 
        batchSize, 
        executionTime: performance.now() - startTime,
        cacheHitRatio: this.getCacheHitRatio(loaderKey)
      })

    } catch (error) {
      logger.error('Batch execution failed', { 
        error, 
        loaderKey, 
        batchSize,
        executionTime: performance.now() - startTime
      })

      // Notify all pending promises of failure
      batch.forEach((key) => {
        const keyStr = JSON.stringify(key)
        const resolver = (this as any)[`resolver_${keyStr}`]
        if (resolver) {
          resolver() // Will resolve to null
          delete (this as any)[`resolver_${keyStr}`]
        }
      })

      throw error
    } finally {
      // Clear batch and timeout
      this.batches.set(loaderKey, [])
      this.pendingTimeouts.delete(loaderKey)
      this.queryDeduplication.get(loaderKey)?.clear()
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(loaderKey: string, executionTime: number, batchSize: number) {
    if (!this.performanceMetrics.has(loaderKey)) {
      this.performanceMetrics.set(loaderKey, {
        totalQueries: 0,
        totalTime: 0,
        batchSize: []
      })
    }

    const metrics = this.performanceMetrics.get(loaderKey)!
    metrics.totalQueries++
    metrics.totalTime += executionTime
    metrics.batchSize.push(batchSize)

    // Keep only last 100 batch sizes for rolling average
    if (metrics.batchSize.length > 100) {
      metrics.batchSize = metrics.batchSize.slice(-100)
    }
  }

  /**
   * Get cache hit ratio for a loader
   */
  private getCacheHitRatio(loaderKey: string): number {
    // Simple implementation - in production you'd track cache hits/misses
    const metrics = this.performanceMetrics.get(loaderKey)
    if (!metrics || metrics.totalQueries === 0) return 0
    
    // Estimate based on cache size vs total queries
    return Math.min(1, this.cache.size / (metrics.totalQueries * 10))
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): Record<string, {
    totalQueries: number
    avgExecutionTime: number
    avgBatchSize: number
    cacheHitRatio: number
    cacheSize: number
  }> {
    const result: Record<string, any> = {}

    this.performanceMetrics.forEach((metrics, loaderKey) => {
      const avgBatchSize = metrics.batchSize.length > 0 
        ? metrics.batchSize.reduce((a, b) => a + b, 0) / metrics.batchSize.length 
        : 0

      result[loaderKey] = {
        totalQueries: metrics.totalQueries,
        avgExecutionTime: metrics.totalQueries > 0 ? metrics.totalTime / metrics.totalQueries : 0,
        avgBatchSize,
        cacheHitRatio: this.getCacheHitRatio(loaderKey),
        cacheSize: this.cache.size
      }
    })

    return result
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const now = Date.now()
    let clearedCount = 0

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.cacheExpiry) {
        this.cache.delete(key)
        this.cacheTimestamps.delete(key)
        clearedCount++
      }
    }

    return clearedCount
  }

  /**
   * Clear all cache and reset
   */
  clearCache() {
    this.cache.clear()
    this.cacheTimestamps.clear()
    this.pendingPromises.clear()
    this.queryDeduplication.clear()
    
    // Clear any pending timeouts
    this.pendingTimeouts.forEach(timeout => clearTimeout(timeout))
    this.pendingTimeouts.clear()
  }

  /**
   * Warm cache with common queries
   */
  async warmCache<T extends V>(
    commonKeys: K[],
    loader: (keys: K[]) => Promise<T[]>,
    options: { relationshipType?: string } = {}
  ): Promise<void> {
    if (commonKeys.length === 0) return

    logger.info('Warming batch loader cache', {
      keyCount: commonKeys.length,
      relationshipType: options.relationshipType
    })

    try {
      await this.preload(commonKeys, loader, {
        priority: 'low',
        relationshipType: options.relationshipType
      })
    } catch (error) {
      logger.error('Cache warming failed', { error, keyCount: commonKeys.length })
    }
  }
}

// Global batch loader instance
export const globalBatchLoader = new BatchLoader()

/**
 * Optimized query builder that prevents N+1 queries with advanced relationship loading
 */
export async function buildAdvancedOptimizedQuery<T>(
  client: SupabaseClient,
  tableName: string,
  options: QueryOptions,
  relations: string[] = []
): Promise<{ query: any; selectClause: string }> {
  const startTime = performance.now()
  
  // Build select clause with relations to avoid N+1
  let selectClause = '*'
  if (options.selectFields) {
    selectClause = options.selectFields.join(',')
  } else if (relations.length > 0) {
    // Include related data to prevent N+1 queries with optimized selectors
    const relationSelects = relations.map(rel => {
      switch (rel) {
        case 'author':
          return 'author:author_id(id,name,email,avatar_url)'
        case 'categories':
          return 'categories:category_ids(id,name,slug,color,type)'
        case 'tags':
          return 'tags:tag_ids(id,name,slug)'
        case 'platforms':
          return 'platforms:platform_ids(id,name,slug,description,status)'
        case 'team_members':
          return 'team_members:member_ids(id,name,title,avatar_url,is_featured)'
        case 'services':
          return 'services:service_ids(id,name,slug,category,pricing_model)'
        case 'testimonials':
          return 'testimonials:testimonial_ids(id,client_name,rating,content,is_featured)'
        case 'parent_category':
          return 'parent_category:parent_id(id,name,slug,type)'
        case 'child_categories':
          return 'child_categories(id,name,slug,type,display_order)'
        default:
          return rel
      }
    })
    selectClause = ['*', ...relationSelects].join(',')
  }

  const query = client.from(tableName).select(selectClause, {
    count: options.includeCount !== false ? 'exact' : undefined
  })

  const queryTime = performance.now() - startTime
  
  if (queryTime > 100) {
    logger.warn('Slow query detected', { tableName, queryTime, options })
  }

  return { query, selectClause }
}

/**
 * Advanced preloader for complex relationships
 */
export class RelationshipPreloader {
  private batchLoader: BatchLoader<string, any>
  private client: SupabaseClient

  constructor(client: SupabaseClient, batchLoader?: BatchLoader<string, any>) {
    this.client = client
    this.batchLoader = batchLoader || globalBatchLoader
  }

  /**
   * Preload authors for blog posts
   */
  async preloadAuthors(authorIds: string[]): Promise<Map<string, any>> {
    const uniqueIds = Array.from(new Set(authorIds.filter(Boolean)))
    if (uniqueIds.length === 0) return new Map()

    return this.batchLoader.preload(
      uniqueIds,
      async (ids) => {
        const { data, error } = await this.client
          .from(TABLE_NAMES.TEAM_MEMBERS)
          .select('id,name,email,avatar_url,title')
          .in('id', ids)

        if (error) throw new Error(`Failed to load authors: ${error.message}`)
        return data || []
      },
      { relationshipType: 'blog_authors' }
    )
  }

  /**
   * Preload categories for content
   */
  async preloadCategories(categoryIds: string[]): Promise<Map<string, any>> {
    const flatIds = categoryIds.flat().filter(Boolean)
    const uniqueIds = Array.from(new Set(flatIds))
    if (uniqueIds.length === 0) return new Map()

    return this.batchLoader.preload(
      uniqueIds,
      async (ids) => {
        const { data, error } = await this.client
          .from(TABLE_NAMES.CATEGORIES)
          .select('id,name,slug,color,type,parent_id')
          .in('id', ids)

        if (error) throw new Error(`Failed to load categories: ${error.message}`)
        return data || []
      },
      { relationshipType: 'content_categories' }
    )
  }

  /**
   * Preload platforms for services or team members
   */
  async preloadPlatforms(platformIds: string[]): Promise<Map<string, any>> {
    const flatIds = platformIds.flat().filter(Boolean)
    const uniqueIds = Array.from(new Set(flatIds))
    if (uniqueIds.length === 0) return new Map()

    return this.batchLoader.preload(
      uniqueIds,
      async (ids) => {
        const { data, error } = await this.client
          .from(TABLE_NAMES.PLATFORMS)
          .select('id,name,slug,description,status,technical_details,pricing_model')
          .in('id', ids)

        if (error) throw new Error(`Failed to load platforms: ${error.message}`)
        return data || []
      },
      { relationshipType: 'platform_associations' }
    )
  }

  /**
   * Preload team members for services or projects
   */
  async preloadTeamMembers(memberIds: string[]): Promise<Map<string, any>> {
    const flatIds = memberIds.flat().filter(Boolean)
    const uniqueIds = Array.from(new Set(flatIds))
    if (uniqueIds.length === 0) return new Map()

    return this.batchLoader.preload(
      uniqueIds,
      async (ids) => {
        const { data, error } = await this.client
          .from(TABLE_NAMES.TEAM_MEMBERS)
          .select('id,name,title,avatar_url,bio,expertise,is_featured,display_order')
          .in('id', ids)

        if (error) throw new Error(`Failed to load team members: ${error.message}`)
        return data || []
      },
      { relationshipType: 'team_associations' }
    )
  }

  /**
   * Preload all relationships for a blog post at once
   */
  async preloadBlogPostRelationships(posts: any[]): Promise<{
    authors: Map<string, any>
    categories: Map<string, any>
    tags: Map<string, any>
  }> {
    const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
    const categoryIds = Array.from(new Set(posts.flatMap(p => p.category_ids || []).filter(Boolean)))
    const tagIds = Array.from(new Set(posts.flatMap(p => p.tag_ids || []).filter(Boolean)))

    // Load all relationships in parallel
    const [authors, categories, tags] = await Promise.all([
      this.preloadAuthors(authorIds),
      this.preloadCategories(categoryIds),
      // Assuming tags have similar structure
      tagIds.length > 0 ? this.batchLoader.preload(
        tagIds,
        async (ids) => {
          const { data, error } = await this.client
            .from('tags')
            .select('id,name,slug')
            .in('id', ids)
          if (error) throw new Error(`Failed to load tags: ${error.message}`)
          return data || []
        },
        { relationshipType: 'blog_tags' }
      ) : new Map()
    ])

    return { authors, categories, tags }
  }

  /**
   * Preload hierarchical category relationships
   */
  async preloadCategoryHierarchy(categoryIds: string[]): Promise<Map<string, any[]>> {
    const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)))
    if (uniqueIds.length === 0) return new Map()

    return this.batchLoader.preload(
      uniqueIds,
      async (parentIds) => {
        // Get all child categories for these parents
        const { data, error } = await this.client
          .from(TABLE_NAMES.CATEGORIES)
          .select('*')
          .in('parent_id', parentIds)
          .order('display_order', { ascending: true })

        if (error) throw new Error(`Failed to load category hierarchy: ${error.message}`)
        
        // Group by parent_id
        const hierarchy: Record<string, any[]> = {}
        parentIds.forEach(id => { hierarchy[id] = [] })
        
        ;(data || []).forEach(category => {
          if (category.parent_id && hierarchy[category.parent_id]) {
            hierarchy[category.parent_id].push(category)
          }
        })

        return Object.entries(hierarchy).map(([parentId, children]) => ({ parentId, children }))
      },
      { relationshipType: 'category_hierarchy' }
    )
  }
}

/**
 * Query Performance Monitor
 */
export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor
  private metrics = new Map<string, {
    totalQueries: number
    totalTime: number
    slowQueries: number
    averageTime: number
    lastExecutionTime: number
    maxTime: number
    minTime: number
    errorCount: number
  }>()
  private slowQueryThreshold = 1000 // 1 second
  private enableDetailedLogging = false

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor()
    }
    return QueryPerformanceMonitor.instance
  }

  /**
   * Track query performance
   */
  trackQuery(
    queryType: string, 
    executionTime: number, 
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    if (!this.metrics.has(queryType)) {
      this.metrics.set(queryType, {
        totalQueries: 0,
        totalTime: 0,
        slowQueries: 0,
        averageTime: 0,
        lastExecutionTime: 0,
        maxTime: 0,
        minTime: Infinity,
        errorCount: 0
      })
    }

    const metric = this.metrics.get(queryType)!
    metric.totalQueries++
    metric.lastExecutionTime = executionTime

    if (success) {
      metric.totalTime += executionTime
      metric.averageTime = metric.totalTime / metric.totalQueries
      metric.maxTime = Math.max(metric.maxTime, executionTime)
      metric.minTime = Math.min(metric.minTime, executionTime)

      if (executionTime > this.slowQueryThreshold) {
        metric.slowQueries++
        
        logger.warn('Slow query detected', {
          queryType,
          executionTime,
          threshold: this.slowQueryThreshold,
          metadata,
          percentage: `${((metric.slowQueries / metric.totalQueries) * 100).toFixed(2)}%`
        })
      }
    } else {
      metric.errorCount++
    }

    // Detailed logging for development
    if (this.enableDetailedLogging && executionTime > 100) {
      logger.debug('Query performance', {
        queryType,
        executionTime,
        success,
        avgTime: metric.averageTime,
        totalQueries: metric.totalQueries,
        metadata
      })
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}

    this.metrics.forEach((metric, queryType) => {
      result[queryType] = {
        ...metric,
        slowQueryPercentage: metric.totalQueries > 0 
          ? ((metric.slowQueries / metric.totalQueries) * 100).toFixed(2) + '%'
          : '0%',
        errorRate: metric.totalQueries > 0
          ? ((metric.errorCount / metric.totalQueries) * 100).toFixed(2) + '%'
          : '0%',
        minTime: metric.minTime === Infinity ? 0 : metric.minTime
      }
    })

    return result
  }

  /**
   * Get top slow queries
   */
  getTopSlowQueries(limit: number = 10): Array<{ queryType: string; avgTime: number; slowCount: number }> {
    return Array.from(this.metrics.entries())
      .map(([queryType, metric]) => ({
        queryType,
        avgTime: metric.averageTime,
        slowCount: metric.slowQueries
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit)
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.clear()
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold
  }

  /**
   * Enable/disable detailed logging
   */
  setDetailedLogging(enabled: boolean): void {
    this.enableDetailedLogging = enabled
  }

  /**
   * Get summary report
   */
  getSummaryReport(): {
    totalQueries: number
    totalSlowQueries: number
    avgExecutionTime: number
    totalErrors: number
    topSlowQueries: Array<{ queryType: string; avgTime: number }>
  } {
    let totalQueries = 0
    let totalSlowQueries = 0
    let totalTime = 0
    let totalErrors = 0

    this.metrics.forEach((metric) => {
      totalQueries += metric.totalQueries
      totalSlowQueries += metric.slowQueries
      totalTime += metric.totalTime
      totalErrors += metric.errorCount
    })

    return {
      totalQueries,
      totalSlowQueries,
      avgExecutionTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      totalErrors,
      topSlowQueries: this.getTopSlowQueries(5)
    }
  }
}

// Global instances
export const globalRelationshipPreloader = new RelationshipPreloader(
  {} as SupabaseClient // Will be injected in actual usage
)
export const queryPerformanceMonitor = QueryPerformanceMonitor.getInstance()

/**
 * Enhanced query execution wrapper with performance monitoring
 */
export async function executeOptimizedQuery<T>(
  queryType: string,
  queryFn: () => Promise<{ data: T | null; error: any; count?: number }>,
  options: {
    enableMonitoring?: boolean
    metadata?: Record<string, any>
    allowCache?: boolean
    cacheKey?: string
    cacheTTL?: number
  } = {}
): Promise<{ data: T | null; error: any; count?: number; queryTime?: number }> {
  const startTime = performance.now()
  const enableMonitoring = options.enableMonitoring !== false

  try {
    const result = await queryFn()
    const queryTime = performance.now() - startTime

    // Track performance if monitoring is enabled
    if (enableMonitoring) {
      queryPerformanceMonitor.trackQuery(
        queryType,
        queryTime,
        !result.error,
        options.metadata
      )
    }

    return {
      ...result,
      queryTime
    }

  } catch (error) {
    const queryTime = performance.now() - startTime
    
    if (enableMonitoring) {
      queryPerformanceMonitor.trackQuery(
        queryType,
        queryTime,
        false,
        { ...options.metadata, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }

    logger.error('Query execution failed', {
      queryType,
      queryTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: options.metadata
    })

    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown query error'),
      queryTime
    }
  }
}

/**
 * Memory-efficient cursor encoder/decoder
 */
export const CursorUtils = {
  encode(data: Record<string, any>, sortBy: string): string {
    const value = data[sortBy]
    const id = data.id
    return Buffer.from(JSON.stringify({ [sortBy]: value, id })).toString('base64')
  },

  decode(cursor: string): Record<string, any> {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
      return JSON.parse(decoded)
    } catch (error) {
      logger.error('Failed to decode cursor', { cursor, error })
      throw new Error('Invalid cursor format')
    }
  },

  buildCursorCondition(
    cursor: string, 
    direction: 'before' | 'after', 
    sortBy: string,
    ascending: boolean
  ) {
    const decodedCursor = this.decode(cursor)
    const cursorValue = decodedCursor[sortBy]
    const cursorId = decodedCursor.id

    if (direction === 'after') {
      return ascending 
        ? { field: sortBy, op: 'gt', value: cursorValue, fallback: { field: 'id', op: 'gt', value: cursorId }}
        : { field: sortBy, op: 'lt', value: cursorValue, fallback: { field: 'id', op: 'lt', value: cursorId }}
    } else {
      return ascending 
        ? { field: sortBy, op: 'lt', value: cursorValue, fallback: { field: 'id', op: 'lt', value: cursorId }}
        : { field: sortBy, op: 'gt', value: cursorValue, fallback: { field: 'id', op: 'gt', value: cursorId }}
    }
  }
}

/**
 * Generates a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 100) // Limit length
}

/**
 * Validates and ensures unique slug
 */
export async function ensureUniqueSlug(
  client: SupabaseClient,
  table: string,
  slug: string,
  excludeId?: string
): Promise<string> {
  let uniqueSlug = slug
  let counter = 1

  while (true) {
    let query = client.from(table).select('id').eq('slug', uniqueSlug)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error checking slug uniqueness', { error: error.message, table, slug: uniqueSlug })
      throw new Error('Failed to validate slug uniqueness')
    }

    if (!data || data.length === 0) {
      return uniqueSlug
    }

    uniqueSlug = `${slug}-${counter}`
    counter++

    // Prevent infinite loops
    if (counter > 1000) {
      throw new Error('Unable to generate unique slug after 1000 attempts')
    }
  }
}

/**
 * Calculates estimated reading time for content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.replace(/\s+/g, ' ').trim().split(' ').length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

/**
 * Extracts and sanitizes content excerpt
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Remove HTML tags and extra whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanContent.length <= maxLength) {
    return cleanContent
  }

  // Find the last complete word within the limit
  const truncated = cleanContent.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...'
  }

  return truncated + '...'
}

// ================================
// Healthcare-Specific Validation
// ================================

/**
 * Determines HIPAA compliance context for data
 */
export function determineHIPAAContext(data: any): HIPAAContext {
  const isHealthcare = isHealthcareData(data)
  
  return {
    isHealthcareData: isHealthcare,
    complianceLevel: isHealthcare ? 'strict' : 'basic',
    auditRequired: isHealthcare,
    encryptionRequired: isHealthcare
  }
}

/**
 * Validates healthcare data access permissions
 */
export function validateHealthcareAccess(
  userRole: AdminRole,
  dataClassification: DataClassification,
  hipaaContext: HIPAAContext
): boolean {
  // Super admins can access everything
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true
  }

  // PHI data requires admin or super admin
  if (dataClassification === DataClassification.PHI) {
    return [AdminRole.SUPER_ADMIN, AdminRole.ADMIN].includes(userRole)
  }

  // Confidential healthcare data requires at least editor role
  if (hipaaContext.isHealthcareData && dataClassification === DataClassification.CONFIDENTIAL) {
    return [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR].includes(userRole)
  }

  return true
}

/**
 * Sanitizes healthcare data for logging
 */
export function sanitizeHealthcareDataForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = [
    'password', 'password_hash', 'ssn', 'social_security_number',
    'medical_record_number', 'patient_id', 'phi_data', 'personal_health_info'
  ]

  const sanitized = { ...data }

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeHealthcareDataForLogging(sanitized[key])
    }
  })

  return sanitized
}

// ================================
// Database Connection Helpers
// ================================

/**
 * Tests database connection health
 */
export async function testDatabaseConnection(client: SupabaseClient): Promise<{
  healthy: boolean
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const { error } = await client
      .from('admin_users')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    // Consider healthy even if table doesn't exist (might be during initial setup)
    const healthy = !error || 
      error.message?.includes('relation') || 
      error.message?.includes('does not exist')

    return {
      healthy,
      responseTime,
      error: healthy ? undefined : error?.message
    }
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Retries database operations with exponential backoff
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5)
      
      logger.warn(`Database operation failed, retrying in ${delay}ms`, {
        attempt,
        maxRetries,
        error: lastError.message
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ================================
// Audit and Logging Helpers
// ================================

/**
 * Creates audit log entry data
 */
export function createAuditLogEntry(
  userId: string,
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  return {
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details: sanitizeHealthcareDataForLogging(details || {}),
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: new Date().toISOString()
  }
}

/**
 * Validates audit log requirements
 */
export function shouldAuditOperation(
  action: AuditAction,
  resourceType: string,
  data?: any
): boolean {
  // Always audit destructive operations
  if ([AuditAction.DELETE, AuditAction.PERMISSION_CHANGE].includes(action)) {
    return true
  }

  // Always audit healthcare data operations
  if (data && isHealthcareData(data)) {
    return true
  }

  // Audit sensitive resource types
  const sensitiveResources = ['admin_users', 'admin_sessions', 'audit_logs']
  if (sensitiveResources.includes(resourceType)) {
    return true
  }

  return false
}

// ================================
// Error Handling Utilities
// ================================

/**
 * Standardizes database error handling
 */
export function handleDatabaseError(error: any, context: string): Error {
  if (!error) {
    return new Error(`Unknown database error in ${context}`)
  }

  let message = error.message || 'Database operation failed'
  const code = error.code || 'UNKNOWN'

  // Map common Postgres error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    '23505': 'A record with this value already exists',
    '23503': 'Referenced record does not exist',
    '23514': 'Data validation failed',
    '42P01': 'Table does not exist',
    'PGRST116': 'Record not found'
  }

  if (errorMap[code]) {
    message = errorMap[code]
  }

  const enhancedError = new Error(`${context}: ${message}`)
  
  // Preserve original error properties
  Object.defineProperty(enhancedError, 'originalError', {
    value: error,
    enumerable: false
  })

  Object.defineProperty(enhancedError, 'code', {
    value: code,
    enumerable: false
  })

  return enhancedError
}

/**
 * Safely executes database operations with error handling
 */
export async function safeDatabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await operation()
    
    if (result.error) {
      return {
        data: null,
        error: handleDatabaseError(result.error, context)
      }
    }

    return {
      data: result.data,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: handleDatabaseError(error, context)
    }
  }
}

// ================================
// Validation Helpers
// ================================

/**
 * Validates data against Zod schema with healthcare context
 */
export function validateWithHealthcareContext<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  hipaaContext?: HIPAAContext
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data)

    // Additional healthcare validation if required
    if (hipaaContext?.isHealthcareData && hipaaContext.complianceLevel === 'strict') {
      // Perform additional HIPAA compliance checks
      const healthcareErrors = validateHIPAACompliance(validated)
      if (healthcareErrors.length > 0) {
        return { success: false, errors: healthcareErrors }
      }
    }

    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      return { success: false, errors }
    }

    return { success: false, errors: ['Validation failed'] }
  }
}

/**
 * Validates HIPAA compliance for healthcare data
 */
export function validateHIPAACompliance(data: any): string[] {
  const errors: string[] = []

  // Check for potentially sensitive data without proper encryption markers
  if (isHealthcareData(data)) {
    const stringData = JSON.stringify(data)
    
    // Check for common PII patterns (simplified validation)
    const ssnPattern = /\d{3}-?\d{2}-?\d{4}/g
    const phonePattern = /\d{3}-?\d{3}-?\d{4}/g
    
    if (ssnPattern.test(stringData)) {
      errors.push('Potential SSN detected - ensure proper encryption')
    }
    
    if (phonePattern.test(stringData)) {
      errors.push('Phone numbers detected - verify compliance requirements')
    }
  }

  return errors
}

// ================================
// Utility Exports
// ================================

/**
 * Common database table names
 */
export const TABLE_NAMES = {
  ADMIN_USERS: 'admin_users',
  ADMIN_SESSIONS: 'admin_sessions',
  PAGES: 'pages',
  BLOG_POSTS: 'blog_posts',
  TEAM_MEMBERS: 'team_members',
  PLATFORMS: 'platforms',
  SERVICES: 'services',
  CATEGORIES: 'categories',
  TESTIMONIALS: 'testimonials',
  AUDIT_LOGS: 'audit_logs'
} as const

/**
 * Default query limits
 */
export const QUERY_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_SEARCH_RESULTS: 50
} as const

/**
 * Healthcare compliance levels
 */
export const COMPLIANCE_LEVELS = {
  NONE: 'none',
  BASIC: 'basic',
  STRICT: 'strict'
} as const

// ================================
// Healthcare-Specific Validation Functions
// ================================

/**
 * Validates healthcare content for medical accuracy
 */
export function validateHealthcareContent(content: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!content || typeof content !== 'object') {
    return { isValid: true, issues: [] }
  }

  const contentString = JSON.stringify(content).toLowerCase()
  
  // Check for medical disclaimers when medical advice is mentioned
  if (contentString.includes('medical advice') && !contentString.includes('disclaimer')) {
    issues.push('Medical advice mentioned without proper disclaimers')
  }

  // Check for drug mentions without proper warnings
  if (contentString.includes('medication') || contentString.includes('drug')) {
    if (!contentString.includes('consult') && !contentString.includes('doctor')) {
      issues.push('Medication mentioned without consulting physician recommendation')
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Extracts medical terminology from content
 */
export function extractMedicalTerminology(data: any): string[] {
  if (!data) return []
  
  const content = JSON.stringify(data).toLowerCase()
  const medicalTerms: string[] = []
  
  // Common medical terms to validate
  const medicalKeywords = [
    'diagnosis', 'treatment', 'medication', 'prescription', 'therapy',
    'surgical', 'procedure', 'clinical', 'medical', 'healthcare',
    'patient', 'symptom', 'disease', 'condition', 'disorder'
  ]

  medicalKeywords.forEach(term => {
    if (content.includes(term)) {
      medicalTerms.push(term)
    }
  })

  return medicalTerms
}

/**
 * Validates medical accuracy of terms
 */
export function validateMedicalAccuracy(terms: string[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // This is a simplified implementation - in production, you'd want
  // to validate against medical dictionaries or APIs
  const problematicTerms = ['cure', 'guaranteed', 'miracle', 'instant']
  
  terms.forEach(term => {
    if (problematicTerms.some(problematic => term.includes(problematic))) {
      issues.push(`Potentially problematic medical claim: ${term}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Validates professional credentials
 */
export function validateProfessionalCredentials(credentials: string[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Common valid medical credentials
  const validCredentials = [
    'md', 'do', 'rn', 'lpn', 'pa', 'np', 'pharmd', 'dpt', 'otr',
    'lcsw', 'phd', 'psyd', 'msn', 'bsn', 'cna', 'emt'
  ]

  credentials.forEach(cred => {
    if (!validCredentials.includes(cred.toLowerCase())) {
      issues.push(`Unrecognized credential: ${cred}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Validates URL safety
 */
export function validateUrlSafety(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // Block suspicious protocols
    const allowedProtocols = ['http:', 'https:']
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false
    }

    // Block suspicious hostnames
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0']
    if (blockedHosts.includes(parsedUrl.hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validates hex color format
 */
export function validateHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexColorRegex.test(color)
}

/**
 * Sanitizes contact information
 */
export function sanitizeContactInformation(contact: any): any {
  if (!contact || typeof contact !== 'object') {
    return contact
  }

  const sanitized = { ...contact }

  // Remove potential sensitive patterns
  if (sanitized.email && typeof sanitized.email === 'string') {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitized.email)) {
      sanitized.email = undefined
    }
  }

  if (sanitized.phone && typeof sanitized.phone === 'string') {
    // Remove non-digits except common separators
    sanitized.phone = sanitized.phone.replace(/[^\d\-\s\(\)\+\.]/g, '')
  }

  return sanitized
}

/**
 * Sanitizes technical description
 */
export function sanitizeTechnicalDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return ''
  }

  let sanitized = description.trim()

  // Remove potential security-sensitive information
  sanitized = sanitized.replace(/\b(password|key|secret|token)\s*[=:]\s*\S+/gi, '$1=[REDACTED]')
  sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_ADDRESS]')
  
  return sanitized
}

/**
 * Validates technical content
 */
export function validateTechnicalContent(data: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!data || typeof data !== 'object') {
    return { isValid: true, issues: [] }
  }

  // Check for exposed sensitive technical details
  const content = JSON.stringify(data).toLowerCase()
  const sensitivePatterns = [
    'password', 'secret', 'private_key', 'api_key', 'database_url'
  ]

  sensitivePatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      issues.push(`Potential sensitive information exposed: ${pattern}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Validates pricing model
 */
export function validatePricingModel(pricingModel: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!pricingModel || typeof pricingModel !== 'string') {
    return { isValid: true, issues: [] }
  }

  // Check for valid pricing model patterns
  const validPatterns = [
    'subscription', 'per-user', 'per-patient', 'tiered', 'usage-based',
    'enterprise', 'custom', 'free-trial', 'one-time', 'consultation'
  ]

  const isValidPattern = validPatterns.some(pattern => 
    pricingModel.toLowerCase().includes(pattern)
  )

  if (!isValidPattern) {
    issues.push(`Unrecognized pricing model pattern: ${pricingModel}`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Validates service compliance
 */
export function validateServiceCompliance(service: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!service) {
    return { isValid: true, issues: [] }
  }

  // Check for medical claims that require disclaimers
  const content = `${service.description || ''} ${service.detailed_description || ''}`.toLowerCase()
  
  if (content.includes('hipaa') && !content.includes('compliant')) {
    issues.push('HIPAA mentioned without compliance statement')
  }

  if (content.includes('fda') && !content.includes('approved')) {
    issues.push('FDA mentioned without approval clarification')
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Sanitizes service description
 */
export function sanitizeServiceDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return ''
  }

  let sanitized = description.trim()

  // Remove specific pricing that might become outdated
  sanitized = sanitized.replace(/\$[\d,]+(\.\d{2})?/g, '[PRICING]')
  
  // Remove specific contract terms
  sanitized = sanitized.replace(/\b(contract|agreement)\s+[^.!?]+[.!?]/gi, '$1 details available.')

  return sanitized
}

/**
 * Sanitizes category description
 */
export function sanitizeCategoryDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return ''
  }

  let sanitized = description.trim()

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + '...'
  }

  return sanitized
}

/**
 * Validates client information
 */
export function validateClientInformation(clientInfo: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!clientInfo) {
    return { isValid: true, issues: [] }
  }

  // Check for potential PII in client information
  const content = JSON.stringify(clientInfo).toLowerCase()
  
  if (content.includes('ssn') || content.includes('social security')) {
    issues.push('Potential SSN in client information')
  }

  if (content.includes('patient') || content.includes('medical record')) {
    issues.push('Potential PHI in client information')
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Sanitizes client data
 */
export function sanitizeClientData(clientData: any): any {
  if (!clientData || typeof clientData !== 'object') {
    return clientData
  }

  const sanitized = { ...clientData }

  // Remove potential PII
  if (sanitized.ssn) {
    sanitized.ssn = '[REDACTED]'
  }

  if (sanitized.medical_record_number) {
    sanitized.medical_record_number = '[REDACTED]'
  }

  return sanitized
}

/**
 * Validates testimonial content
 */
export function validateTestimonialContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!content || typeof content !== 'string') {
    return { isValid: true, issues: [] }
  }

  const lowerContent = content.toLowerCase()

  // Check for potential PHI
  if (lowerContent.includes('patient id') || lowerContent.includes('medical record')) {
    issues.push('Potential PHI in testimonial content')
  }

  // Check for medical claims without disclaimers
  if ((lowerContent.includes('cure') || lowerContent.includes('treat')) && 
      !lowerContent.includes('individual results may vary')) {
    issues.push('Medical claims without proper disclaimers')
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}