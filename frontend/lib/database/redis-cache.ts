// =============================================
// ENTERPRISE REDIS CACHING SYSTEM
// Target: >95% cache hit ratio, <5ms cache response
// =============================================

import Redis from 'ioredis'
import { logger } from '@/lib/logger'

// Cache configuration for enterprise performance
const CACHE_CONFIG = {
  // Redis connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Performance optimization
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Connection pool
  family: 4,
  enableReadyCheck: true,
  maxLoadingTimeout: 5000,
}

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  PUBLIC_CONTENT: 300,      // 5 minutes for public content
  USER_SESSIONS: 1800,      // 30 minutes for user sessions
  ANALYTICS: 3600,          // 1 hour for analytics
  USER_DASHBOARD: 600,      // 10 minutes for user dashboard
  SEARCH_RESULTS: 900,      // 15 minutes for search results
  METADATA: 1800,           // 30 minutes for metadata
  HEALTH_CHECK: 60,         // 1 minute for health checks
  SLOW_QUERIES: 86400,      // 24 hours for slow query data
} as const

interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  totalRequests: number
  avgResponseTime: number
  hitRatio: number
  lastUpdate: Date
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  compressed: boolean
}

class RedisCache {
  private redis: Redis
  private fallbackCache: Map<string, any> = new Map()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    hitRatio: 0,
    lastUpdate: new Date()
  }
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.redis = new Redis(CACHE_CONFIG)
    this.initializeEventHandlers()
    this.initializeHealthChecks()
  }

  private initializeEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Redis cache connected successfully')
    })

    this.redis.on('error', (error) => {
      logger.error('Redis cache error', {
        error: error.message,
        fallback: 'Using in-memory fallback cache'
      })
      this.metrics.errors++
    })

    this.redis.on('close', () => {
      logger.warn('Redis cache connection closed')
    })

    this.redis.on('reconnecting', () => {
      logger.info('Redis cache reconnecting...')
    })
  }

  private initializeHealthChecks(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 30000)
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now()
    
    try {
      await this.redis.ping()
      const responseTime = performance.now() - startTime
      
      if (responseTime > 10) {
        logger.warn('Redis cache health check slow', {
          responseTime: `${responseTime.toFixed(2)}ms`,
          target: '<5ms'
        })
      }
    } catch (error) {
      logger.error('Redis cache health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private updateMetrics(hit: boolean, responseTime: number): void {
    this.metrics.totalRequests++
    
    if (hit) {
      this.metrics.hits++
    } else {
      this.metrics.misses++
    }
    
    // Update average response time
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
      this.metrics.totalRequests
    )
    
    // Calculate hit ratio
    this.metrics.hitRatio = (this.metrics.hits / this.metrics.totalRequests) * 100
    this.metrics.lastUpdate = new Date()
  }

  private generateCacheKey(prefix: string, key: string | object): string {
    const keyString = typeof key === 'string' ? key : JSON.stringify(key)
    return `hmhcp:${prefix}:${keyString}`
  }

  private async compressData(data: any): Promise<string> {
    // Simple JSON compression - in production, consider using gzip
    return JSON.stringify(data)
  }

  private async decompressData<T>(data: string): Promise<T> {
    return JSON.parse(data)
  }

  // Generic cache get method
  async get<T>(prefix: string, key: string | object): Promise<T | null> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(prefix, key)
    
    try {
      // Try Redis first
      const cachedData = await this.redis.get(cacheKey)
      const responseTime = performance.now() - startTime
      
      if (cachedData) {
        this.updateMetrics(true, responseTime)
        const entry: CacheEntry<T> = await this.decompressData(cachedData)
        
        // Check if entry is still valid
        if (Date.now() - entry.timestamp < entry.ttl * 1000) {
          return entry.data
        } else {
          // Remove expired entry
          await this.redis.del(cacheKey)
        }
      }
      
      // Try fallback cache
      if (this.fallbackCache.has(cacheKey)) {
        const entry = this.fallbackCache.get(cacheKey)
        if (Date.now() - entry.timestamp < entry.ttl * 1000) {
          this.updateMetrics(true, responseTime)
          return entry.data
        } else {
          this.fallbackCache.delete(cacheKey)
        }
      }
      
      this.updateMetrics(false, responseTime)
      return null
      
    } catch (error) {
      const responseTime = performance.now() - startTime
      this.updateMetrics(false, responseTime)
      
      logger.error('Cache get operation failed', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return null
    }
  }

  // Generic cache set method
  async set<T>(
    prefix: string,
    key: string | object,
    data: T,
    ttl: number = CACHE_TTL.PUBLIC_CONTENT
  ): Promise<boolean> {
    const cacheKey = this.generateCacheKey(prefix, key)
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      compressed: true
    }
    
    try {
      const compressed = await this.compressData(entry)
      
      // Set in Redis with TTL
      await this.redis.setex(cacheKey, ttl, compressed)
      
      // Also set in fallback cache (with size limit)
      if (this.fallbackCache.size < 1000) {
        this.fallbackCache.set(cacheKey, entry)
      }
      
      return true
      
    } catch (error) {
      logger.error('Cache set operation failed', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Try fallback cache
      try {
        if (this.fallbackCache.size < 1000) {
          this.fallbackCache.set(cacheKey, entry)
          return true
        }
      } catch (fallbackError) {
        logger.error('Fallback cache set failed', {
          error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        })
      }
      
      return false
    }
  }

  // Cache invalidation methods
  async invalidate(prefix: string, key?: string | object): Promise<boolean> {
    try {
      if (key) {
        const cacheKey = this.generateCacheKey(prefix, key)
        await this.redis.del(cacheKey)
        this.fallbackCache.delete(cacheKey)
      } else {
        // Invalidate all keys with prefix
        const pattern = `hmhcp:${prefix}:*`
        const keys = await this.redis.keys(pattern)
        
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
        
        // Clear fallback cache entries with prefix
        for (const [key] of this.fallbackCache) {
          if (key.startsWith(`hmhcp:${prefix}:`)) {
            this.fallbackCache.delete(key)
          }
        }
      }
      
      return true
    } catch (error) {
      logger.error('Cache invalidation failed', {
        prefix,
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Specialized cache methods for common use cases
  
  // Public content caching
  async cachePublicContent(content: any[]): Promise<boolean> {
    return this.set('public_content', 'all', content, CACHE_TTL.PUBLIC_CONTENT)
  }

  async getPublicContent(): Promise<any[] | null> {
    return this.get('public_content', 'all')
  }

  // Search results caching
  async cacheSearchResults(query: string, results: any[]): Promise<boolean> {
    return this.set('search_results', query, results, CACHE_TTL.SEARCH_RESULTS)
  }

  async getSearchResults(query: string): Promise<any[] | null> {
    return this.get('search_results', query)
  }

  // User dashboard caching
  async cacheUserDashboard(userId: string, data: any): Promise<boolean> {
    return this.set('user_dashboard', userId, data, CACHE_TTL.USER_DASHBOARD)
  }

  async getUserDashboard(userId: string): Promise<any | null> {
    return this.get('user_dashboard', userId)
  }

  // Analytics caching
  async cacheAnalytics(key: string, data: any): Promise<boolean> {
    return this.set('analytics', key, data, CACHE_TTL.ANALYTICS)
  }

  async getAnalytics(key: string): Promise<any | null> {
    return this.get('analytics', key)
  }

  // Cache warming strategies
  async warmCache(): Promise<void> {
    logger.info('Starting cache warming process')
    
    try {
      // This would typically fetch and cache frequently accessed data
      // Implementation depends on your specific use case
      
      // Example: Pre-cache public content
      // const publicContent = await fetchPublicContent()
      // await this.cachePublicContent(publicContent)
      
      logger.info('Cache warming completed successfully')
    } catch (error) {
      logger.error('Cache warming failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Batch operations for efficiency
  async setMultiple<T>(entries: Array<{
    prefix: string,
    key: string | object,
    data: T,
    ttl?: number
  }>): Promise<boolean[]> {
    const results = await Promise.allSettled(
      entries.map(entry => 
        this.set(entry.prefix, entry.key, entry.data, entry.ttl)
      )
    )
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : false
    )
  }

  async getMultiple<T>(keys: Array<{
    prefix: string,
    key: string | object
  }>): Promise<(T | null)[]> {
    const results = await Promise.allSettled(
      keys.map(keyInfo => this.get<T>(keyInfo.prefix, keyInfo.key))
    )
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    )
  }

  // Performance metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  async getDetailedMetrics(): Promise<any> {
    try {
      const info = await this.redis.info('memory')
      const keyspace = await this.redis.info('keyspace')
      
      return {
        cache_metrics: this.metrics,
        redis_info: {
          memory: info,
          keyspace: keyspace
        },
        performance_summary: {
          hit_ratio: `${this.metrics.hitRatio.toFixed(2)}%`,
          avg_response_time: `${this.metrics.avgResponseTime.toFixed(2)}ms`,
          total_requests: this.metrics.totalRequests,
          error_rate: `${(this.metrics.errors / this.metrics.totalRequests * 100).toFixed(2)}%`,
          status: this.metrics.hitRatio >= 95 ? 'excellent' : 
                  this.metrics.hitRatio >= 80 ? 'good' : 'needs_optimization'
        }
      }
    } catch (error) {
      return {
        cache_metrics: this.metrics,
        error: 'Failed to get detailed metrics'
      }
    }
  }

  // Cleanup method
  async destroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    this.fallbackCache.clear()
    await this.redis.quit()
  }
}

// Singleton instance
let redisCacheInstance: RedisCache | null = null

export function getRedisCache(): RedisCache {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCache()
  }
  return redisCacheInstance
}

// Convenience exports
export const cache = {
  get: <T>(prefix: string, key: string | object) => 
    getRedisCache().get<T>(prefix, key),
  
  set: <T>(prefix: string, key: string | object, data: T, ttl?: number) => 
    getRedisCache().set(prefix, key, data, ttl),
  
  invalidate: (prefix: string, key?: string | object) => 
    getRedisCache().invalidate(prefix, key),
  
  getMetrics: () => getRedisCache().getMetrics(),
  
  warmCache: () => getRedisCache().warmCache()
}

export { CACHE_TTL }
export default getRedisCache