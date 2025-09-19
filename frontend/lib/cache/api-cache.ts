/**
 * API Response Caching Layer
 * Provides intelligent caching for API responses with Redis and memory fallback
 */

import { getRedisClient, safeRedisOperation } from '@/lib/redis/client'

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expires: number }>()

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL in seconds
  defaultTTL: 300, // 5 minutes
  
  // Specific TTLs for different content types
  ttl: {
    page: 600,        // 10 minutes for pages
    blog: 300,        // 5 minutes for blog posts
    platform: 600,    // 10 minutes for platform data
    health: 60,       // 1 minute for health checks
    static: 3600,     // 1 hour for static content
  },
  
  // Maximum memory cache size
  maxMemoryCacheSize: 100,
  
  // Stale-while-revalidate time in seconds
  staleWhileRevalidate: 60,
}

/**
 * Generate cache key with namespace
 */
export function generateCacheKey(namespace: string, identifier: string): string {
  return `api:cache:${namespace}:${identifier}`
}

/**
 * Set data in cache with TTL
 */
export async function setCacheData(
  key: string,
  data: any,
  ttl?: number
): Promise<void> {
  const expiryTime = ttl || CACHE_CONFIG.defaultTTL
  
  // Try Redis first
  const redisSet = await safeRedisOperation(
    async (client) => {
      const serialized = JSON.stringify(data)
      await client.setex(key, expiryTime, serialized)
      return true
    },
    false
  )
  
  // Fallback to memory cache
  if (!redisSet) {
    // Implement LRU eviction if cache is full
    if (memoryCache.size >= CACHE_CONFIG.maxMemoryCacheSize) {
      const firstKey = memoryCache.keys().next().value
      if (firstKey) memoryCache.delete(firstKey)
    }
    
    memoryCache.set(key, {
      data,
      expires: Date.now() + (expiryTime * 1000)
    })
  }
}

/**
 * Get data from cache
 */
export async function getCacheData<T = any>(
  key: string
): Promise<{ data: T | null; stale: boolean }> {
  // Try Redis first
  const redisData = await safeRedisOperation(
    async (client) => {
      const data = await client.get(key)
      if (data) {
        // Check TTL for stale-while-revalidate
        const ttl = await client.ttl(key)
        const parsed = JSON.parse(data)
        return {
          data: parsed,
          stale: ttl < CACHE_CONFIG.staleWhileRevalidate
        }
      }
      return null
    },
    null
  )
  
  if (redisData) {
    return redisData
  }
  
  // Fallback to memory cache
  const memoryCached = memoryCache.get(key)
  if (memoryCached) {
    const now = Date.now()
    if (now < memoryCached.expires) {
      const timeUntilExpiry = (memoryCached.expires - now) / 1000
      return {
        data: memoryCached.data,
        stale: timeUntilExpiry < CACHE_CONFIG.staleWhileRevalidate
      }
    } else {
      // Clean up expired entry
      memoryCache.delete(key)
    }
  }
  
  return { data: null, stale: false }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  // Invalidate in Redis
  await safeRedisOperation(
    async (client) => {
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    },
    null
  )
  
  // Invalidate in memory cache
  const keysToDelete: string[] = []
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => memoryCache.delete(key))
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number
    forceRefresh?: boolean
    staleWhileRevalidate?: boolean
  } = {}
): Promise<T> {
  const { ttl, forceRefresh, staleWhileRevalidate = true } = options
  
  // Skip cache if force refresh
  if (!forceRefresh) {
    const cached = await getCacheData<T>(cacheKey)
    
    if (cached.data !== null) {
      // Return cached data immediately
      if (!cached.stale || !staleWhileRevalidate) {
        return cached.data
      }
      
      // Return stale data and revalidate in background
      if (cached.stale && staleWhileRevalidate) {
        // Trigger background revalidation
        fetchFn()
          .then(freshData => setCacheData(cacheKey, freshData, ttl))
          .catch(err => console.error(`Cache revalidation failed for ${cacheKey}:`, err))
        
        return cached.data
      }
    }
  }
  
  // Fetch fresh data
  try {
    const freshData = await fetchFn()
    await setCacheData(cacheKey, freshData, ttl)
    return freshData
  } catch (error) {
    // If fetch fails, try to return stale data as last resort
    const cached = await getCacheData<T>(cacheKey)
    if (cached.data !== null) {
      console.warn(`Using stale cache for ${cacheKey} due to fetch error:`, error)
      return cached.data
    }
    throw error
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  redis: { connected: boolean; size?: number }
  memory: { size: number; keys: string[] }
}> {
  const redisStats = await safeRedisOperation(
    async (client) => {
      const dbSize = await client.dbsize()
      return { connected: true, size: dbSize }
    },
    { connected: false }
  )
  
  return {
    redis: redisStats,
    memory: {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys())
    }
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  // Clear Redis cache
  await safeRedisOperation(
    async (client) => {
      const keys = await client.keys('api:cache:*')
      if (keys.length > 0) {
        await client.del(...keys)
      }
    },
    null
  )
  
  // Clear memory cache
  memoryCache.clear()
}