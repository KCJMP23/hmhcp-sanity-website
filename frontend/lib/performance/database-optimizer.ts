/**
 * Database Query Optimization
 * Implements caching and query optimization for better API performance
 */

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL in milliseconds
  ttl: {
    blog: 5 * 60 * 1000,      // 5 minutes
    cms: 10 * 60 * 1000,      // 10 minutes
    static: 60 * 60 * 1000,   // 1 hour
  },
  
  // Cache size limits
  maxSize: {
    blog: 100,     // Max 100 blog posts
    cms: 50,       // Max 50 CMS items
    static: 20,    // Max 20 static items
  }
}

// Simple in-memory cache
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 300000) {
    // Check cache size limits
    if (this.cache.size >= 1000) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
  
  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
  
  size() {
    return this.cache.size
  }
}

// Singleton cache instance
const cache = new MemoryCache()

// Generate cache key
function generateCacheKey(endpoint: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${endpoint}${sortedParams ? `?${sortedParams}` : ''}`
}

// Optimized API client with caching
export class OptimizedAPIClient {
  private baseUrl: string
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }
  
  async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: {
      useCache?: boolean
      ttl?: number
      priority?: 'high' | 'normal' | 'low'
    } = {}
  ): Promise<T> {
    const {
      useCache = true,
      ttl = 300000, // 5 minutes default
      priority = 'normal'
    } = options
    
    const cacheKey = generateCacheKey(endpoint, params)
    
    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }
    
    // Build URL with parameters
    const url = new URL(endpoint, this.baseUrl)
    Object.keys(params).forEach(key => {
      url.searchParams.set(key, params[key])
    })
    
    // Make request with appropriate priority
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache', // Use browser cache
    }
    
    // Add priority header if supported
    if (priority === 'high') {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Priority': 'high'
      }
    }
    
    try {
      const response = await fetch(url.toString(), requestOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Cache successful responses
      if (useCache && response.ok) {
        cache.set(cacheKey, data, ttl)
      }
      
      return data
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }
  
  async post<T>(
    endpoint: string,
    data: any,
    options: {
      useCache?: boolean
      invalidateCache?: string[]
    } = {}
  ): Promise<T> {
    const { invalidateCache = [] } = options
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // Invalidate related cache entries
    invalidateCache.forEach(pattern => {
      // Simple pattern matching for cache invalidation
      // In a real app, you'd want more sophisticated cache invalidation
      cache.clear() // For now, clear all cache on POST
    })
    
    return result
  }
}

// Query optimization utilities
export class QueryOptimizer {
  // Optimize blog post queries
  static optimizeBlogQuery(params: {
    limit?: number
    offset?: number
    status?: string
    category?: string
  }) {
    const optimizedParams = { ...params }
    
    // Set reasonable defaults
    if (!optimizedParams.limit) {
      optimizedParams.limit = 10
    }
    
    // Limit maximum results
    if (optimizedParams.limit > 50) {
      optimizedParams.limit = 50
    }
    
    return optimizedParams
  }
  
  // Optimize CMS content queries
  static optimizeCMSQuery(params: {
    page?: number
    limit?: number
    status?: string
    type?: string
  }) {
    const optimizedParams = { ...params }
    
    // Set reasonable defaults
    if (!optimizedParams.page) optimizedParams.page = 1
    if (!optimizedParams.limit) optimizedParams.limit = 20
    
    // Limit maximum results
    if (optimizedParams.limit > 100) {
      optimizedParams.limit = 100
    }
    
    return optimizedParams
  }
  
  // Batch multiple queries
  static async batchQueries<T>(
    queries: Array<{
      endpoint: string
      params?: Record<string, any>
      ttl?: number
    }>
  ): Promise<T[]> {
    const client = new OptimizedAPIClient()
    
    // Execute queries in parallel
    const promises = queries.map(({ endpoint, params = {}, ttl = 300000 }) =>
      client.get<T>(endpoint, params, { ttl })
    )
    
    return Promise.all(promises)
  }
}

// Preload critical data
export async function preloadCriticalData() {
  if (typeof window === 'undefined') return
  
  const client = new OptimizedAPIClient()
  
  // Preload critical data in background
  const criticalQueries = [
    {
      endpoint: '/api/blog/posts',
      params: { limit: 3, status: 'published' },
      ttl: CACHE_CONFIG.ttl.blog
    },
    {
      endpoint: '/api/cms/content',
      params: { limit: 10, status: 'published' },
      ttl: CACHE_CONFIG.ttl.cms
    }
  ]
  
  try {
    await QueryOptimizer.batchQueries(criticalQueries)
    console.log('Critical data preloaded successfully')
  } catch (error) {
    console.warn('Failed to preload critical data:', error)
  }
}

// Cache management utilities
export function clearCache(pattern?: string) {
  if (pattern) {
    // Clear cache entries matching pattern
    // Simple implementation - in production, use more sophisticated pattern matching
    cache.clear()
  } else {
    cache.clear()
  }
}

export function getCacheStats() {
  return {
    size: cache.size(),
    maxSize: 1000
  }
}

// Initialize database optimizations
export function initializeDatabaseOptimizations() {
  if (typeof window === 'undefined') return
  
  // Preload critical data after initial render
  setTimeout(preloadCriticalData, 1000)
  
  // Set up cache cleanup interval
  setInterval(() => {
    // Cleanup expired cache entries
    cache.clear()
  }, 5 * 60 * 1000) // Every 5 minutes
}

// Export singleton API client
export const apiClient = new OptimizedAPIClient()
