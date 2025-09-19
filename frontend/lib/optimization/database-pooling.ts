/**
 * Database Connection Pooling Optimization
 * 
 * Optimized connection pooling for Supabase and PostgreSQL
 * Includes query caching and prepared statements
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Pool, PoolConfig, QueryResult } from 'pg'
import { cacheManager, CacheNamespace } from '../cache/redis-cache-manager'
import { logger } from '../logger'
import crypto from 'crypto'

/**
 * Connection pool configuration
 */
export interface PoolingConfig {
  max: number                // Maximum number of connections
  min: number                // Minimum number of connections
  idleTimeoutMillis: number  // How long a connection can be idle
  connectionTimeoutMillis: number // How long to wait for a connection
  maxUses: number            // Max times a connection can be reused
  statementTimeout: number   // Query timeout
  query_timeout: number      // Alternative query timeout
}

/**
 * Default pooling configuration for marketing website
 */
export const DEFAULT_POOL_CONFIG: PoolingConfig = {
  max: 20,                   // 20 connections max
  min: 2,                    // Keep 2 connections minimum
  idleTimeoutMillis: 30000,  // 30 seconds idle timeout
  connectionTimeoutMillis: 5000, // 5 seconds connection timeout
  maxUses: 7500,             // Reuse connection 7500 times
  statementTimeout: 10000,   // 10 seconds statement timeout
  query_timeout: 10000       // 10 seconds query timeout
}

/**
 * Production pooling configuration
 */
export const PRODUCTION_POOL_CONFIG: PoolingConfig = {
  max: 50,                   // Higher for production
  min: 5,                    // Keep more connections ready
  idleTimeoutMillis: 60000,  // 1 minute idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
  maxUses: 10000,            // More reuses in production
  statementTimeout: 30000,   // 30 seconds for complex queries
  query_timeout: 30000       // 30 seconds query timeout
}

/**
 * Optimized database connection pool
 */
export class OptimizedDatabasePool {
  private static instance: OptimizedDatabasePool
  private supabase: SupabaseClient | null = null
  private pgPool: Pool | null = null
  private preparedStatements: Map<string, string> = new Map()
  private queryMetrics: {
    total: number
    cached: number
    avgResponseTime: number
    slowQueries: number
  } = {
    total: 0,
    cached: 0,
    avgResponseTime: 0,
    slowQueries: 0
  }

  private constructor() {
    this.initializeConnections()
  }

  public static getInstance(): OptimizedDatabasePool {
    if (!OptimizedDatabasePool.instance) {
      OptimizedDatabasePool.instance = new OptimizedDatabasePool()
    }
    return OptimizedDatabasePool.instance
  }

  /**
   * Initialize database connections
   */
  private async initializeConnections(): Promise<void> {
    try {
      // Initialize Supabase client with connection pooling
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-connection-pool': 'optimized'
            }
          }
        })
      }

      // Initialize PostgreSQL connection pool for direct queries
      const databaseUrl = process.env.DATABASE_URL
      if (databaseUrl) {
        const config: PoolConfig = {
          connectionString: databaseUrl,
          ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
          } : false,
          ...this.getPoolConfig()
        }

        this.pgPool = new Pool(config)

        // Setup event handlers
        this.pgPool.on('error', (err) => {
          logger.error('PostgreSQL pool error', { error: err })
        })

        this.pgPool.on('connect', () => {
          logger.info('PostgreSQL client connected')
        })

        this.pgPool.on('remove', () => {
          logger.info('PostgreSQL client removed')
        })
      }

      logger.info('Database connections initialized')
    } catch (error) {
      logger.error('Failed to initialize database connections', { error })
      throw error
    }
  }

  /**
   * Get pool configuration based on environment
   */
  private getPoolConfig(): PoolingConfig {
    return process.env.NODE_ENV === 'production' 
      ? PRODUCTION_POOL_CONFIG 
      : DEFAULT_POOL_CONFIG
  }

  /**
   * Execute query with caching
   */
  public async query<T extends Record<string, any> = any>(
    query: string,
    params?: any[],
    options?: {
      cache?: boolean
      ttl?: number
      tag?: string
    }
  ): Promise<QueryResult<T>> {
    const startTime = Date.now()
    const { cache = true, ttl = 300, tag } = options || {}

    // Generate cache key
    const cacheKey = this.generateQueryCacheKey(query, params)

    // Try cache first
    if (cache) {
      const cached = await cacheManager.get<QueryResult<T>>(cacheKey, {
        namespace: CacheNamespace.QUERY
      })

      if (cached) {
        this.queryMetrics.cached++
        this.updateMetrics(startTime, true)
        return cached
      }
    }

    // Execute query
    try {
      if (!this.pgPool) {
        throw new Error('PostgreSQL pool not initialized')
      }

      const result = await this.pgPool.query<T>(query, params)

      // Cache result
      if (cache) {
        await cacheManager.set(cacheKey, result, {
          namespace: CacheNamespace.QUERY,
          ttl,
          tags: tag ? [tag as any] : undefined
        })
      }

      this.updateMetrics(startTime, false)
      return result
    } catch (error) {
      logger.error('Query execution error', { query, params, error })
      throw error
    }
  }

  /**
   * Execute Supabase query with caching
   */
  public async supabaseQuery<T extends Record<string, any> = any>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    options?: {
      filter?: Record<string, any>
      select?: string
      order?: { column: string; ascending?: boolean }
      limit?: number
      cache?: boolean
      ttl?: number
    }
  ): Promise<T[]> {
    const startTime = Date.now()
    const { cache = true, ttl = 300 } = options || {}

    // Generate cache key
    const cacheKey = `supabase:${table}:${operation}:${JSON.stringify(options)}`

    // Try cache first for select operations
    if (operation === 'select' && cache) {
      const cached = await cacheManager.get<T[]>(cacheKey, {
        namespace: CacheNamespace.QUERY
      })

      if (cached) {
        this.queryMetrics.cached++
        this.updateMetrics(startTime, true)
        return cached
      }
    }

    // Execute Supabase query
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = this.supabase.from(table)

      // Build query based on operation
      switch (operation) {
        case 'select':
          query = query.select(options?.select || '*')
          break
        case 'insert':
          // Insert operations handled separately
          break
        case 'update':
          // Update operations handled separately
          break
        case 'delete':
          // Delete operations handled separately
          break
      }

      // Apply filters
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true
        })
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Cache result for select operations
      if (operation === 'select' && cache && data) {
        await cacheManager.set(cacheKey, data, {
          namespace: CacheNamespace.QUERY,
          ttl
        })
      }

      this.updateMetrics(startTime, false)
      return data || []
    } catch (error) {
      logger.error('Supabase query error', { table, operation, options, error })
      throw error
    }
  }

  /**
   * Prepare statement for repeated use
   */
  public async prepareStatement(
    name: string,
    query: string
  ): Promise<void> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not initialized')
    }

    try {
      const client = await this.pgPool.connect()
      
      try {
        await client.query(`PREPARE ${name} AS ${query}`)
        this.preparedStatements.set(name, query)
        logger.info('Prepared statement created', { name })
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Failed to prepare statement', { name, query, error })
      throw error
    }
  }

  /**
   * Execute prepared statement
   */
  public async executePrepared<T extends Record<string, any> = any>(
    name: string,
    params?: any[],
    options?: {
      cache?: boolean
      ttl?: number
    }
  ): Promise<QueryResult<T>> {
    if (!this.preparedStatements.has(name)) {
      throw new Error(`Prepared statement '${name}' not found`)
    }

    const startTime = Date.now()
    const { cache = true, ttl = 300 } = options || {}

    // Generate cache key
    const cacheKey = `prepared:${name}:${JSON.stringify(params)}`

    // Try cache first
    if (cache) {
      const cached = await cacheManager.get<QueryResult<T>>(cacheKey, {
        namespace: CacheNamespace.QUERY
      })

      if (cached) {
        this.queryMetrics.cached++
        this.updateMetrics(startTime, true)
        return cached
      }
    }

    // Execute prepared statement
    try {
      if (!this.pgPool) {
        throw new Error('PostgreSQL pool not initialized')
      }

      const result = await this.pgPool.query<T>(
        `EXECUTE ${name}(${params?.map((_, i) => `$${i + 1}`).join(', ')})`,
        params
      )

      // Cache result
      if (cache) {
        await cacheManager.set(cacheKey, result, {
          namespace: CacheNamespace.QUERY,
          ttl
        })
      }

      this.updateMetrics(startTime, false)
      return result
    } catch (error) {
      logger.error('Prepared statement execution error', { name, params, error })
      throw error
    }
  }

  /**
   * Batch query execution
   */
  public async batchQuery<T extends Record<string, any> = any>(
    queries: Array<{
      query: string
      params?: any[]
      cache?: boolean
      ttl?: number
    }>
  ): Promise<QueryResult<T>[]> {
    const results = await Promise.all(
      queries.map(q => this.query<T>(q.query, q.params, {
        cache: q.cache,
        ttl: q.ttl
      }))
    )

    return results
  }

  /**
   * Transaction support
   */
  public async transaction<T = any>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not initialized')
    }

    const client = await this.pgPool.connect()

    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Generate query cache key
   */
  private generateQueryCacheKey(query: string, params?: any[]): string {
    const queryHash = crypto
      .createHash('sha256')
      .update(query + JSON.stringify(params || []))
      .digest('hex')
      .substring(0, 16)
    
    return `query:${queryHash}`
  }

  /**
   * Update query metrics
   */
  private updateMetrics(startTime: number, fromCache: boolean): void {
    const responseTime = Date.now() - startTime
    
    this.queryMetrics.total++
    this.queryMetrics.avgResponseTime = 
      (this.queryMetrics.avgResponseTime * (this.queryMetrics.total - 1) + responseTime) / 
      this.queryMetrics.total

    // Track slow queries (> 1 second)
    if (responseTime > 1000 && !fromCache) {
      this.queryMetrics.slowQueries++
    }
  }

  /**
   * Get pool statistics
   */
  public getPoolStats(): {
    total: number
    idle: number
    waiting: number
    queryMetrics: {
      total: number
      cached: number
      avgResponseTime: number
      slowQueries: number
    }
  } {
    if (!this.pgPool) {
      return {
        total: 0,
        idle: 0,
        waiting: 0,
        queryMetrics: this.queryMetrics
      }
    }

    return {
      total: this.pgPool.totalCount,
      idle: this.pgPool.idleCount,
      waiting: this.pgPool.waitingCount,
      queryMetrics: this.queryMetrics
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Check PostgreSQL
      if (this.pgPool) {
        await this.pgPool.query('SELECT 1')
      }

      // Check Supabase
      if (this.supabase) {
        await this.supabase.from('_health_check').select('*').limit(1)
      }

      return true
    } catch (error) {
      logger.error('Database health check failed', { error })
      return false
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end()
      logger.info('PostgreSQL pool closed')
    }

    this.supabase = null
    logger.info('Database connections closed')
  }
}

// Export singleton instance
export const dbPool = OptimizedDatabasePool.getInstance()

/**
 * Query optimization helpers
 */
export const queryOptimizer = {
  /**
   * Add indexes for common queries
   */
  createIndexes: async () => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)',
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)',
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at)',
      'CREATE INDEX IF NOT EXISTS idx_navigation_order ON navigation_items(order_index)',
      'CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp)'
    ]

    for (const index of indexes) {
      try {
        await dbPool.query(index)
        logger.info('Index created', { index })
      } catch (error) {
        logger.error('Failed to create index', { index, error })
      }
    }
  },

  /**
   * Analyze query performance
   */
  analyzeQuery: async (query: string, params?: any[]) => {
    const explainQuery = `EXPLAIN ANALYZE ${query}`
    const result = await dbPool.query(explainQuery, params)
    return result.rows
  },

  /**
   * Vacuum database for performance
   */
  vacuum: async () => {
    try {
      await dbPool.query('VACUUM ANALYZE')
      logger.info('Database vacuum completed')
    } catch (error) {
      logger.error('Database vacuum failed', { error })
    }
  }
}