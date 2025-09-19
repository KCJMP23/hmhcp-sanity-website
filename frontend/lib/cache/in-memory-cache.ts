/**
 * In-Memory Cache Implementation
 * 
 * High-performance in-memory caching with LRU eviction
 * Used as fallback when Redis is unavailable
 */

import { logger } from '../logger'

interface CacheEntry<T> {
  value: T
  expires: number
  size: number
  lastAccess: number
  hits: number
}

interface CacheOptions {
  ttl?: number // Time to live in seconds
  maxSize?: number // Max cache size in bytes
  maxEntries?: number // Max number of entries
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  entries: number
  hitRate: number
}

/**
 * LRU In-Memory Cache
 */
export class InMemoryCache {
  private static instance: InMemoryCache
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number = 100 * 1024 * 1024 // 100MB default
  private maxEntries: number = 10000 // 10k entries default
  private currentSize: number = 0
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entries: 0,
    hitRate: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null

  private constructor() {
    // Start cleanup interval
    this.startCleanup()
  }

  public static getInstance(): InMemoryCache {
    if (!InMemoryCache.instance) {
      InMemoryCache.instance = new InMemoryCache()
    }
    return InMemoryCache.instance
  }

  /**
   * Get value from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if expired
    if (entry.expires > 0 && Date.now() > entry.expires) {
      this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Update access time and hits
    entry.lastAccess = Date.now()
    entry.hits++
    
    this.stats.hits++
    this.updateHitRate()

    return entry.value as T
  }

  /**
   * Set value in cache
   */
  public set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): boolean {
    const ttl = options.ttl || 300 // 5 minutes default
    const size = this.calculateSize(value)

    // Check if we need to evict entries
    if (this.shouldEvict(size)) {
      this.evictLRU(size)
    }

    const entry: CacheEntry<T> = {
      value,
      expires: ttl > 0 ? Date.now() + (ttl * 1000) : 0,
      size,
      lastAccess: Date.now(),
      hits: 0
    }

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!
      this.currentSize -= oldEntry.size
    }

    // Add new entry
    this.cache.set(key, entry)
    this.currentSize += size
    this.stats.entries = this.cache.size
    this.stats.size = this.currentSize

    return true
  }

  /**
   * Delete key from cache
   */
  public delete(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) return false

    this.cache.delete(key)
    this.currentSize -= entry.size
    this.stats.entries = this.cache.size
    this.stats.size = this.currentSize

    return true
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear()
    this.currentSize = 0
    this.stats.entries = 0
    this.stats.size = 0
    logger.info('In-memory cache cleared')
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Check if should evict entries
   */
  private shouldEvict(newSize: number): boolean {
    return (
      this.currentSize + newSize > this.maxSize ||
      this.cache.size >= this.maxEntries
    )
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(requiredSize: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)

    let freedSize = 0
    let evicted = 0

    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize && this.cache.size < this.maxEntries) {
        break
      }

      this.cache.delete(key)
      freedSize += entry.size
      evicted++
    }

    this.currentSize -= freedSize
    this.stats.evictions += evicted
    this.stats.entries = this.cache.size
    this.stats.size = this.currentSize

    if (evicted > 0) {
      logger.debug(`Evicted ${evicted} entries from in-memory cache`)
    }
  }

  /**
   * Calculate size of value
   */
  private calculateSize(value: any): number {
    if (value === null || value === undefined) return 0
    
    const str = typeof value === 'string' 
      ? value 
      : JSON.stringify(value)
    
    // Rough estimate: 2 bytes per character
    return str.length * 2
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 
      ? (this.stats.hits / total) * 100 
      : 0
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)

    // Ensure cleanup runs on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.stopCleanup())
    }
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires > 0 && now > entry.expires) {
        this.cache.delete(key)
        this.currentSize -= entry.size
        removed++
      }
    }

    if (removed > 0) {
      this.stats.entries = this.cache.size
      this.stats.size = this.currentSize
      logger.debug(`Cleaned up ${removed} expired entries from cache`)
    }
  }

  /**
   * Get or set with callback
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    try {
      const data = await fetcher()
      this.set(key, data, options)
      return data
    } catch (error) {
      logger.error('In-memory cache fetch error', { key, error })
      throw error
    }
  }

  /**
   * Batch get
   */
  public mget<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>()
    
    for (const key of keys) {
      result.set(key, this.get<T>(key))
    }
    
    return result
  }

  /**
   * Batch set
   */
  public mset<T>(
    entries: Map<string, T>,
    options: CacheOptions = {}
  ): boolean {
    let success = true
    
    for (const [key, value] of entries) {
      if (!this.set(key, value, options)) {
        success = false
      }
    }
    
    return success
  }

  /**
   * Get keys matching pattern
   */
  public keys(pattern?: string): string[] {
    if (!pattern) {
      return Array.from(this.cache.keys())
    }

    // Convert pattern to regex
    const regex = new RegExp(
      pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    )

    return Array.from(this.cache.keys())
      .filter(key => regex.test(key))
  }

  /**
   * Check if key exists
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) return false
    
    // Check if expired
    if (entry.expires > 0 && Date.now() > entry.expires) {
      this.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Get remaining TTL for key
   */
  public ttl(key: string): number {
    const entry = this.cache.get(key)
    
    if (!entry || entry.expires === 0) return -1
    
    const remaining = Math.floor((entry.expires - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  }

  /**
   * Warm cache with data
   */
  public async warmCache(
    warmer: () => Promise<Map<string, any>>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const data = await warmer()
      return this.mset(data, options)
    } catch (error) {
      logger.error('Cache warming error', { error })
      return false
    }
  }

  /**
   * Export cache for persistence
   */
  public export(): string {
    const data = {
      entries: Array.from(this.cache.entries()),
      stats: this.stats,
      timestamp: Date.now()
    }
    return JSON.stringify(data)
  }

  /**
   * Import cache from persistence
   */
  public import(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      
      this.clear()
      
      for (const [key, entry] of parsed.entries) {
        // Skip expired entries
        if (entry.expires > 0 && Date.now() > entry.expires) {
          continue
        }
        
        this.cache.set(key, entry)
        this.currentSize += entry.size
      }
      
      this.stats.entries = this.cache.size
      this.stats.size = this.currentSize
      
      logger.info('Cache imported successfully', {
        entries: this.cache.size,
        size: this.currentSize
      })
      
      return true
    } catch (error) {
      logger.error('Cache import error', { error })
      return false
    }
  }
}

// Export singleton instance
export const memoryCache = InMemoryCache.getInstance()

// Helper functions
export const inMemoryCache = {
  get: <T>(key: string) => memoryCache.get<T>(key),
  set: <T>(key: string, value: T, options?: CacheOptions) => 
    memoryCache.set(key, value, options),
  delete: (key: string) => memoryCache.delete(key),
  clear: () => memoryCache.clear(),
  getOrSet: <T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options?: CacheOptions
  ) => memoryCache.getOrSet(key, fetcher, options),
  stats: () => memoryCache.getStats(),
  has: (key: string) => memoryCache.has(key),
  ttl: (key: string) => memoryCache.ttl(key),
  keys: (pattern?: string) => memoryCache.keys(pattern)
}