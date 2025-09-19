/**
 * Universal Cache Wrapper
 * 
 * Automatically selects between Redis and in-memory cache
 * Provides fallback mechanism for high availability
 */

import { cacheManager, CacheNamespace, CacheTag } from './redis-cache-manager'
import { memoryCache } from './in-memory-cache'
import { logger } from '../logger'

interface UniversalCacheOptions {
  ttl?: number
  namespace?: CacheNamespace
  tags?: CacheTag[]
  preferRedis?: boolean
  fallbackToMemory?: boolean
}

class UniversalCache {
  private useRedis: boolean = false
  private redisHealthy: boolean = false
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 30000 // 30 seconds

  constructor() {
    this.checkRedisHealth()
  }

  /**
   * Check Redis health periodically
   */
  private async checkRedisHealth(): Promise<boolean> {
    const now = Date.now()
    
    // Use cached health status if recent
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.redisHealthy
    }

    try {
      this.redisHealthy = await cacheManager.healthCheck()
      this.useRedis = this.redisHealthy && process.env.REDIS_URL !== undefined
      this.lastHealthCheck = now
      
      if (!this.useRedis) {
        logger.warn('Redis unavailable, using in-memory cache')
      }
      
      return this.redisHealthy
    } catch (error) {
      this.redisHealthy = false
      this.useRedis = false
      this.lastHealthCheck = now
      logger.error('Redis health check failed', { error })
      return false
    }
  }

  /**
   * Get from cache with automatic fallback
   */
  public async get<T>(
    key: string,
    options: UniversalCacheOptions = {}
  ): Promise<T | null> {
    const { preferRedis = true, fallbackToMemory = true } = options

    // Try Redis first if available and preferred
    if (preferRedis && this.useRedis) {
      try {
        const result = await cacheManager.get<T>(key, {
          namespace: options.namespace
        })
        
        if (result !== null) return result
        
        // If not in Redis, check memory cache
        if (fallbackToMemory) {
          const memResult = memoryCache.get<T>(this.getMemoryKey(key, options.namespace))
          if (memResult !== null) {
            // Sync back to Redis if possible
            this.syncToRedis(key, memResult, options)
          }
          return memResult
        }
      } catch (error) {
        logger.error('Redis get error, falling back to memory', { key, error })
        
        if (fallbackToMemory) {
          return memoryCache.get<T>(this.getMemoryKey(key, options.namespace))
        }
      }
    }
    
    // Use in-memory cache
    return memoryCache.get<T>(this.getMemoryKey(key, options.namespace))
  }

  /**
   * Set in cache with automatic fallback
   */
  public async set<T>(
    key: string,
    value: T,
    options: UniversalCacheOptions = {}
  ): Promise<boolean> {
    const { ttl = 300, preferRedis = true, fallbackToMemory = true } = options
    let redisSuccess = false
    let memorySuccess = false

    // Try Redis if available
    if (preferRedis && this.useRedis) {
      try {
        redisSuccess = await cacheManager.set(key, value, {
          ttl,
          namespace: options.namespace,
          tags: options.tags
        })
      } catch (error) {
        logger.error('Redis set error', { key, error })
      }
    }

    // Always set in memory cache as backup
    if (fallbackToMemory || !redisSuccess) {
      memorySuccess = memoryCache.set(
        this.getMemoryKey(key, options.namespace),
        value,
        { ttl }
      )
    }

    return redisSuccess || memorySuccess
  }

  /**
   * Delete from cache
   */
  public async delete(
    key: string,
    namespace?: CacheNamespace
  ): Promise<boolean> {
    let redisSuccess = false
    let memorySuccess = false

    // Delete from Redis
    if (this.useRedis) {
      try {
        redisSuccess = await cacheManager.delete(key, namespace)
      } catch (error) {
        logger.error('Redis delete error', { key, error })
      }
    }

    // Delete from memory
    memorySuccess = memoryCache.delete(this.getMemoryKey(key, namespace))

    return redisSuccess || memorySuccess
  }

  /**
   * Get or set with automatic fallback
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: UniversalCacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) return cached

    // Fetch fresh data
    try {
      const data = await fetcher()
      await this.set(key, data, options)
      return data
    } catch (error) {
      logger.error('Universal cache fetch error', { key, error })
      throw error
    }
  }

  /**
   * Clear cache by pattern or namespace
   */
  public async clear(pattern?: string, namespace?: CacheNamespace): Promise<number> {
    let cleared = 0

    // Clear from Redis
    if (this.useRedis) {
      try {
        if (namespace) {
          cleared += await cacheManager.clearNamespace(namespace)
        } else if (pattern) {
          cleared += await cacheManager.deletePattern(pattern)
        }
      } catch (error) {
        logger.error('Redis clear error', { pattern, error })
      }
    }

    // Clear from memory
    if (pattern) {
      const keys = memoryCache.keys(pattern)
      keys.forEach(key => memoryCache.delete(key))
      cleared += keys.length
    } else if (!pattern && !namespace) {
      memoryCache.clear()
    }

    return cleared
  }

  /**
   * Invalidate by tags (Redis only)
   */
  public async invalidateByTags(tags: CacheTag[]): Promise<number> {
    if (!this.useRedis) return 0

    try {
      return await cacheManager.invalidateByTags(tags)
    } catch (error) {
      logger.error('Tag invalidation error', { tags, error })
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<{
    redis?: any
    memory: any
    useRedis: boolean
  }> {
    const stats: any = {
      memory: memoryCache.getStats(),
      useRedis: this.useRedis
    }

    if (this.useRedis) {
      try {
        stats.redis = cacheManager.getMetrics()
      } catch (error) {
        logger.error('Failed to get Redis stats', { error })
      }
    }

    return stats
  }

  /**
   * Warm cache with critical data
   */
  public async warmCache(
    warmer: () => Promise<Map<string, any>>,
    options: UniversalCacheOptions = {}
  ): Promise<boolean> {
    try {
      const data = await warmer()
      
      // Warm both caches
      const promises: Promise<boolean>[] = []
      
      if (this.useRedis) {
        promises.push(
          cacheManager.mset(data, {
            ttl: options.ttl,
            namespace: options.namespace,
            tags: options.tags
          })
        )
      }
      
      promises.push(
        memoryCache.mset(data, { ttl: options.ttl })
      )
      
      const results = await Promise.all(promises)
      return results.some(r => r === true)
    } catch (error) {
      logger.error('Cache warming error', { error })
      return false
    }
  }

  /**
   * Get memory cache key with namespace
   */
  private getMemoryKey(key: string, namespace?: CacheNamespace): string {
    return namespace ? `${namespace}:${key}` : key
  }

  /**
   * Sync data back to Redis if it becomes available
   */
  private async syncToRedis<T>(
    key: string,
    value: T,
    options: UniversalCacheOptions
  ): Promise<void> {
    if (!this.useRedis) return

    try {
      await cacheManager.set(key, value, {
        ttl: options.ttl,
        namespace: options.namespace,
        tags: options.tags
      })
    } catch (error) {
      // Silent fail - this is best effort
      logger.debug('Failed to sync to Redis', { key, error })
    }
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean
    redis: boolean
    memory: boolean
  }> {
    const redisHealthy = await this.checkRedisHealth()
    
    return {
      healthy: true, // Memory cache is always available
      redis: redisHealthy,
      memory: true
    }
  }
}

// Export singleton instance
export const universalCache = new UniversalCache()

// Helper functions for easy access
export const cache = {
  get: <T>(key: string, options?: UniversalCacheOptions) =>
    universalCache.get<T>(key, options),
  
  set: <T>(key: string, value: T, options?: UniversalCacheOptions) =>
    universalCache.set(key, value, options),
  
  delete: (key: string, namespace?: CacheNamespace) =>
    universalCache.delete(key, namespace),
  
  getOrSet: <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: UniversalCacheOptions
  ) => universalCache.getOrSet(key, fetcher, options),
  
  clear: (pattern?: string, namespace?: CacheNamespace) =>
    universalCache.clear(pattern, namespace),
  
  invalidateByTags: (tags: CacheTag[]) =>
    universalCache.invalidateByTags(tags),
  
  stats: () => universalCache.getStats(),
  
  warmCache: (
    warmer: () => Promise<Map<string, any>>,
    options?: UniversalCacheOptions
  ) => universalCache.warmCache(warmer, options),
  
  healthCheck: () => universalCache.healthCheck()
}

// Export for use in API routes
export default cache