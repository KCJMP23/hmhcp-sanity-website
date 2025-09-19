/**
 * Cache strategy utilities for performance optimization
 */

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
}

class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private maxSize = 100
  private hits = 0
  private misses = 0

  get(key: string): any {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.misses++
      return null
    }
    
    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }
    
    this.hits++
    return entry.data
  }

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }
}

const performanceCache = new PerformanceCache()

export function getCacheMetrics(): CacheMetrics {
  return performanceCache.getMetrics()
}

export function cacheApiResponse(key: string, data: any, ttl?: number): void {
  performanceCache.set(key, data, ttl)
}

export function getCachedApiResponse(key: string): any {
  return performanceCache.get(key)
}

export function clearPerformanceCache(): void {
  performanceCache.clear()
}