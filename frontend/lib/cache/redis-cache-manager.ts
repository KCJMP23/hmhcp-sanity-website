/**
 * Redis Cache Manager
 * 
 * Comprehensive caching layer for HMHCP marketing website
 * Provides intelligent caching with TTL management, invalidation, and monitoring
 */

import Redis from 'ioredis'
import { getRedisConfig, getRecommendedTTL } from '../config/redis-config'
import { logger } from '../logger'
import crypto from 'crypto'

// Cache namespaces for different data types
export enum CacheNamespace {
  CMS = 'cms',
  API = 'api',
  SESSION = 'session',
  HTML = 'html',
  QUERY = 'query',
  IMAGE = 'image',
  STATIC = 'static',
  NAVIGATION = 'nav',
  HOMEPAGE = 'homepage',
  PAGES = 'pages',
  SYSTEM = 'system'
}

// Cache tags for invalidation groups
export enum CacheTag {
  HOMEPAGE = 'homepage',
  NAVIGATION = 'navigation',
  BLOG = 'blog',
  SERVICES = 'services',
  PLATFORMS = 'platforms',
  RESEARCH = 'research',
  ADMIN = 'admin',
  USER = 'user'
}

interface CacheOptions {
  ttl?: number
  tags?: CacheTag[]
  namespace?: CacheNamespace
  compress?: boolean
  serialize?: boolean
}

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  avgResponseTime: number
  cacheSize: number
}

export class RedisCacheManager {
  private static instance: RedisCacheManager
  private redis: Redis
  private readReplica?: Redis
  private metrics: CacheMetrics
  private isConnected: boolean = false
  private connectionPromise: Promise<void> | null = null

  private constructor() {
    const config = getRedisConfig()
    this.redis = new Redis(config.options)
    
    // Setup read replica for read-heavy operations
    if (process.env.REDIS_READ_REPLICA_URL) {
      this.readReplica = new Redis(process.env.REDIS_READ_REPLICA_URL)
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      avgResponseTime: 0,
      cacheSize: 0
    }

    this.setupEventHandlers()
    this.connectionPromise = this.connect()
  }

  public static getInstance(): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager()
    }
    return RedisCacheManager.instance
  }

  private async connect(): Promise<void> {
    try {
      await this.redis.ping()
      this.isConnected = true
      logger.info('Redis cache manager connected successfully')
    } catch (error) {
      logger.error('Failed to connect to Redis', { error })
      this.isConnected = false
      throw error
    }
  }

  private setupEventHandlers(): void {
    this.redis.on('error', (error) => {
      logger.error('Redis error', { error })
      this.metrics.errors++
      this.isConnected = false
    })

    this.redis.on('connect', () => {
      logger.info('Redis connected')
      this.isConnected = true
    })

    this.redis.on('ready', () => {
      logger.info('Redis ready')
      this.isConnected = true
    })

    this.redis.on('close', () => {
      logger.warn('Redis connection closed')
      this.isConnected = false
    })

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...')
    })
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string, namespace?: CacheNamespace): string {
    const prefix = namespace || CacheNamespace.API
    return `${prefix}:${key}`
  }

  /**
   * Generate hash for complex objects
   */
  private generateHash(data: any): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16)
  }

  /**
   * Get data from cache
   */
  public async get<T>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    const startTime = Date.now()
    const cacheKey = this.generateKey(key, options.namespace)

    try {
      const client = this.readReplica || this.redis
      const data = await client.get(cacheKey)

      if (data) {
        this.metrics.hits++
        this.updateResponseTime(startTime)
        
        // Parse JSON if serialized
        if (options.serialize !== false) {
          try {
            return JSON.parse(data) as T
          } catch {
            return data as T
          }
        }
        
        return data as T
      }

      this.metrics.misses++
      return null
    } catch (error) {
      logger.error('Cache get error', { key: cacheKey, error })
      this.metrics.errors++
      return null
    }
  }

  /**
   * Set data in cache
   */
  public async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    const startTime = Date.now()
    const cacheKey = this.generateKey(key, options.namespace)
    const ttl = options.ttl || getRecommendedTTL(options.namespace || 'api')

    try {
      // Serialize data if needed
      const data = options.serialize !== false ? JSON.stringify(value) : value

      // Set with TTL
      await this.redis.setex(cacheKey, ttl, data)

      // Add to tags for grouped invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addToTags(cacheKey, options.tags)
      }

      this.metrics.sets++
      this.updateResponseTime(startTime)
      
      return true
    } catch (error) {
      logger.error('Cache set error', { key: cacheKey, error })
      this.metrics.errors++
      return false
    }
  }

  /**
   * Delete from cache
   */
  public async delete(key: string, namespace?: CacheNamespace): Promise<boolean> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    const cacheKey = this.generateKey(key, namespace)

    try {
      const result = await this.redis.del(cacheKey)
      this.metrics.deletes++
      return result > 0
    } catch (error) {
      logger.error('Cache delete error', { key: cacheKey, error })
      this.metrics.errors++
      return false
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  public async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0

      const result = await this.redis.del(...keys)
      this.metrics.deletes += result
      return result
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error })
      this.metrics.errors++
      return 0
    }
  }

  /**
   * Invalidate cache by tags
   */
  public async invalidateByTags(tags: CacheTag[]): Promise<number> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    let totalDeleted = 0

    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        const keys = await this.redis.smembers(tagKey)
        
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys)
          totalDeleted += deleted
          
          // Clean up the tag set
          await this.redis.del(tagKey)
        }
      }

      this.metrics.deletes += totalDeleted
      logger.info('Cache invalidated by tags', { tags, deleted: totalDeleted })
      
      return totalDeleted
    } catch (error) {
      logger.error('Cache invalidate by tags error', { tags, error })
      this.metrics.errors++
      return 0
    }
  }

  /**
   * Add cache key to tags for grouped invalidation
   */
  private async addToTags(key: string, tags: CacheTag[]): Promise<void> {
    const pipeline = this.redis.pipeline()
    
    for (const tag of tags) {
      const tagKey = `tag:${tag}`
      pipeline.sadd(tagKey, key)
      // Set TTL on tag set to prevent memory leak
      pipeline.expire(tagKey, 86400) // 24 hours
    }
    
    await pipeline.exec()
  }

  /**
   * Get or set cache (fetch if miss)
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    try {
      const data = await fetcher()
      
      // Cache the result
      await this.set(key, data, options)
      
      return data
    } catch (error) {
      logger.error('Cache getOrSet fetch error', { key, error })
      throw error
    }
  }

  /**
   * Batch get multiple keys
   */
  public async mget<T>(
    keys: string[],
    namespace?: CacheNamespace
  ): Promise<Map<string, T | null>> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    const cacheKeys = keys.map(key => this.generateKey(key, namespace))
    const result = new Map<string, T | null>()

    try {
      const client = this.readReplica || this.redis
      const values = await client.mget(...cacheKeys)

      keys.forEach((key, index) => {
        const value = values[index]
        if (value) {
          try {
            result.set(key, JSON.parse(value) as T)
            this.metrics.hits++
          } catch {
            result.set(key, value as T)
          }
        } else {
          result.set(key, null)
          this.metrics.misses++
        }
      })

      return result
    } catch (error) {
      logger.error('Cache mget error', { keys: cacheKeys, error })
      this.metrics.errors++
      
      // Return empty results on error
      keys.forEach(key => result.set(key, null))
      return result
    }
  }

  /**
   * Batch set multiple keys
   */
  public async mset(
    items: Map<string, any>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    const pipeline = this.redis.pipeline()
    const ttl = options.ttl || getRecommendedTTL(options.namespace || 'api')

    try {
      for (const [key, value] of items) {
        const cacheKey = this.generateKey(key, options.namespace)
        const data = options.serialize !== false ? JSON.stringify(value) : value
        
        pipeline.setex(cacheKey, ttl, data)
        
        if (options.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            const tagKey = `tag:${tag}`
            pipeline.sadd(tagKey, cacheKey)
            pipeline.expire(tagKey, 86400)
          }
        }
      }

      await pipeline.exec()
      this.metrics.sets += items.size
      
      return true
    } catch (error) {
      logger.error('Cache mset error', { error })
      this.metrics.errors++
      return false
    }
  }

  /**
   * Clear entire namespace
   */
  public async clearNamespace(namespace: CacheNamespace): Promise<number> {
    return this.deletePattern(`${namespace}:*`)
  }

  /**
   * Clear all cache (use with caution)
   */
  public async clearAll(): Promise<void> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    try {
      await this.redis.flushdb()
      logger.warn('All cache cleared')
    } catch (error) {
      logger.error('Cache clear all error', { error })
      this.metrics.errors++
    }
  }

  /**
   * Warm cache with critical data
   */
  public async warmCache(
    warmer: () => Promise<Map<string, any>>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const data = await warmer()
      return await this.mset(data, options)
    } catch (error) {
      logger.error('Cache warming error', { error })
      return false
    }
  }

  /**
   * Get cache metrics
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Get cache hit ratio
   */
  public getHitRatio(): number {
    const total = this.metrics.hits + this.metrics.misses
    if (total === 0) return 0
    return (this.metrics.hits / total) * 100
  }

  /**
   * Update average response time
   */
  private updateResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2
  }

  /**
   * Get cache size (estimated)
   */
  public async getCacheSize(): Promise<number> {
    if (!this.isConnected) {
      await this.connectionPromise
    }

    try {
      const info = await this.redis.info('memory')
      const match = info.match(/used_memory:(\d+)/)
      if (match) {
        const bytes = parseInt(match[1], 10)
        this.metrics.cacheSize = bytes
        return bytes
      }
      return 0
    } catch (error) {
      logger.error('Get cache size error', { error })
      return 0
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.redis.ping()
      return pong === 'PONG'
    } catch {
      return false
    }
  }

  /**
   * Close connections
   */
  public async close(): Promise<void> {
    await this.redis.quit()
    if (this.readReplica) {
      await this.readReplica.quit()
    }
    logger.info('Redis cache manager closed')
  }
}

// Export singleton instance
export const cacheManager = RedisCacheManager.getInstance()

// Helper functions for common cache operations
export const cache = {
  get: <T>(key: string, options?: CacheOptions) => 
    cacheManager.get<T>(key, options),
  
  set: (key: string, value: any, options?: CacheOptions) => 
    cacheManager.set(key, value, options),
  
  delete: (key: string, namespace?: CacheNamespace) => 
    cacheManager.delete(key, namespace),
  
  getOrSet: <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) => 
    cacheManager.getOrSet(key, fetcher, options),
  
  invalidateByTags: (tags: CacheTag[]) => 
    cacheManager.invalidateByTags(tags),
  
  clearNamespace: (namespace: CacheNamespace) => 
    cacheManager.clearNamespace(namespace),
  
  metrics: () => cacheManager.getMetrics(),
  
  hitRatio: () => cacheManager.getHitRatio()
}