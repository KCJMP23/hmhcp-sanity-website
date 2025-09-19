/**
 * Validation Cache Module
 * 
 * Provides high-performance caching for validation results
 * 
 * @module lib/validation/middleware/validation-cache
 */

import { LRUCache } from 'lru-cache'
import { createHash } from 'crypto'
import { ValidationResult } from './api-validator'

/**
 * Cache entry interface
 */
interface CacheEntry {
  result: ValidationResult
  timestamp: number
  hits: number
  lastAccessed: number
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number
  misses: number
  entries: number
  memoryUsage: number
  hitRate: number
  averageAccessTime: number
  evictions: number
}

/**
 * Validation cache class
 */
export class ValidationCache {
  private cache: LRUCache<string, CacheEntry>
  private stats: {
    hits: number
    misses: number
    evictions: number
    totalAccessTime: number
    accessCount: number
  }
  private readonly ttl: number

  constructor(ttlSeconds: number = 300, maxSize: number = 1000) {
    this.ttl = ttlSeconds * 1000 // Convert to milliseconds
    
    this.cache = new LRUCache<string, CacheEntry>({
      max: maxSize,
      ttl: this.ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
      sizeCalculation: (entry) => {
        // Estimate memory usage
        return JSON.stringify(entry).length
      },
      maxSize: 50 * 1024 * 1024, // 50MB max memory
      dispose: (value, key) => {
        this.stats.evictions++
      }
    })

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0
    }
  }

  /**
   * Get cached validation result
   */
  async get(key: string): Promise<ValidationResult | null> {
    const startTime = Date.now()
    
    try {
      const entry = this.cache.get(key)
      
      if (entry) {
        // Check if entry is still valid
        const age = Date.now() - entry.timestamp
        if (age <= this.ttl) {
          // Update statistics
          this.stats.hits++
          entry.hits++
          entry.lastAccessed = Date.now()
          
          // Update the entry with incremented hits
          this.cache.set(key, entry)
          
          this.updateAccessTime(startTime)
          
          return entry.result
        } else {
          // Entry is expired, remove it
          this.cache.delete(key)
        }
      }
      
      this.stats.misses++
      this.updateAccessTime(startTime)
      
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set cached validation result
   */
  async set(key: string, result: ValidationResult): Promise<void> {
    try {
      const entry: CacheEntry = {
        result,
        timestamp: Date.now(),
        hits: 0,
        lastAccessed: Date.now()
      }
      
      this.cache.set(key, entry)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete cached validation result
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  /**
   * Clear all cached entries
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.resetStats()
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0

    const averageAccessTime = this.stats.accessCount > 0
      ? this.stats.totalAccessTime / this.stats.accessCount
      : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      memoryUsage: this.cache.calculatedSize || 0,
      hitRate,
      averageAccessTime,
      evictions: this.stats.evictions
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0
    }
  }

  /**
   * Prune expired entries
   */
  async prune(): Promise<number> {
    const before = this.cache.size
    
    // LRUCache automatically handles TTL, but we can force a cleanup
    const now = Date.now()
    const keys = Array.from(this.cache.keys())
    
    for (const key of keys) {
      const entry = this.cache.peek(key) // Peek doesn't update age
      if (entry && (now - entry.timestamp) > this.ttl) {
        this.cache.delete(key)
      }
    }
    
    return before - this.cache.size
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache entry metadata
   */
  getEntryMetadata(key: string): Omit<CacheEntry, 'result'> | null {
    const entry = this.cache.get(key)
    if (entry) {
      return {
        timestamp: entry.timestamp,
        hits: entry.hits,
        lastAccessed: entry.lastAccessed
      }
    }
    return null
  }

  /**
   * Warm up cache with predefined entries
   */
  async warmUp(entries: Array<{ key: string; result: ValidationResult }>): Promise<void> {
    for (const { key, result } of entries) {
      await this.set(key, result)
    }
  }

  /**
   * Export cache entries for persistence
   */
  async export(): Promise<Array<{ key: string; entry: CacheEntry }>> {
    const entries: Array<{ key: string; entry: CacheEntry }> = []
    
    for (const [key, entry] of this.cache.entries()) {
      entries.push({ key, entry })
    }
    
    return entries
  }

  /**
   * Import cache entries from persistence
   */
  async import(entries: Array<{ key: string; entry: CacheEntry }>): Promise<void> {
    for (const { key, entry } of entries) {
      // Only import if not expired
      const age = Date.now() - entry.timestamp
      if (age <= this.ttl) {
        this.cache.set(key, entry)
      }
    }
  }

  /**
   * Update access time statistics
   */
  private updateAccessTime(startTime: number): void {
    const accessTime = Date.now() - startTime
    this.stats.totalAccessTime += accessTime
    this.stats.accessCount++
  }

  /**
   * Generate cache key from request data
   */
  static generateKey(data: {
    method?: string
    url?: string
    body?: any
    query?: any
    headers?: any
  }): string {
    const normalized = {
      method: data.method || '',
      url: data.url || '',
      body: data.body ? JSON.stringify(data.body) : '',
      query: data.query ? JSON.stringify(data.query) : '',
      headers: data.headers ? JSON.stringify(data.headers) : ''
    }
    
    const concatenated = Object.values(normalized).join('|')
    return createHash('sha256').update(concatenated).digest('hex')
  }

  /**
   * Create a distributed cache instance (Redis-backed)
   */
  static async createDistributed(options: {
    redisUrl: string
    ttlSeconds?: number
    keyPrefix?: string
  }): Promise<DistributedValidationCache> {
    return new DistributedValidationCache(options)
  }
}

/**
 * Distributed validation cache using Redis
 */
export class DistributedValidationCache extends ValidationCache {
  private redisClient: any // Would be Redis client instance
  private keyPrefix: string

  constructor(options: {
    redisUrl: string
    ttlSeconds?: number
    keyPrefix?: string
  }) {
    super(options.ttlSeconds)
    this.keyPrefix = options.keyPrefix || 'validation:'
    
    // Initialize Redis client (placeholder)
    // this.redisClient = new Redis(options.redisUrl)
  }

  /**
   * Get from distributed cache
   */
  async get(key: string): Promise<ValidationResult | null> {
    // First check local cache
    const local = await super.get(key)
    if (local) return local

    // Then check Redis
    try {
      const prefixedKey = this.keyPrefix + key
      // const data = await this.redisClient.get(prefixedKey)
      // if (data) {
      //   const result = JSON.parse(data)
      //   // Store in local cache for faster subsequent access
      //   await super.set(key, result)
      //   return result
      // }
    } catch (error) {
      console.error('Distributed cache get error:', error)
    }

    return null
  }

  /**
   * Set in distributed cache
   */
  async set(key: string, result: ValidationResult): Promise<void> {
    // Store in local cache
    await super.set(key, result)

    // Store in Redis
    try {
      const prefixedKey = this.keyPrefix + key
      // await this.redisClient.setex(
      //   prefixedKey,
      //   this.ttl / 1000,
      //   JSON.stringify(result)
      // )
    } catch (error) {
      console.error('Distributed cache set error:', error)
    }
  }

  /**
   * Delete from distributed cache
   */
  async delete(key: string): Promise<boolean> {
    const localDeleted = await super.delete(key)
    
    try {
      const prefixedKey = this.keyPrefix + key
      // await this.redisClient.del(prefixedKey)
      return true
    } catch (error) {
      console.error('Distributed cache delete error:', error)
      return localDeleted
    }
  }

  /**
   * Clear distributed cache
   */
  async clear(): Promise<void> {
    await super.clear()
    
    try {
      // const keys = await this.redisClient.keys(this.keyPrefix + '*')
      // if (keys.length > 0) {
      //   await this.redisClient.del(...keys)
      // }
    } catch (error) {
      console.error('Distributed cache clear error:', error)
    }
  }
}

export default ValidationCache