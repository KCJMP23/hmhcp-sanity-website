/**
 * Vercel Edge Caching Strategy
 * 
 * This module implements optimized caching strategies for Vercel deployment:
 * - Edge-side caching for static content
 * - API response caching with smart invalidation
 * - Database query result caching
 * - Image optimization caching
 */

import { NextRequest, NextResponse } from 'next/server'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  vary?: string[] // Vary headers
  revalidate?: boolean // Enable background revalidation
}

/**
 * Create optimized cache headers for Vercel Edge Network
 */
export function createCacheHeaders(options: CacheOptions = {}): Record<string, string> {
  const {
    ttl = 300, // 5 minutes default
    tags = [],
    vary = [],
    revalidate = true
  } = options

  const headers: Record<string, string> = {
    // Public caching with stale-while-revalidate
    'Cache-Control': revalidate 
      ? `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`
      : `public, max-age=${ttl}, s-maxage=${ttl}`
  }

  // Add cache tags for smart invalidation
  if (tags.length > 0) {
    headers['X-Vercel-Cache-Tags'] = tags.join(',')
  }

  // Add vary headers
  if (vary.length > 0) {
    headers['Vary'] = vary.join(', ')
  }

  return headers
}

/**
 * API Response caching wrapper
 */
export function withCache<T = any>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse<T>> => {
    const response = await handler(req)
    
    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      const cacheHeaders = createCacheHeaders(options)
      
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    
    return response
  }
}

/**
 * Static content cache headers
 */
export const STATIC_CACHE_HEADERS = createCacheHeaders({
  ttl: 31536000, // 1 year
  revalidate: false
})

/**
 * API cache headers for different types of endpoints
 */
export const API_CACHE_HEADERS = {
  // Fast-changing data (user sessions, real-time data)
  DYNAMIC: createCacheHeaders({
    ttl: 0, // No caching
    revalidate: false
  }),
  
  // Medium-changing data (dashboard stats, content lists)
  MEDIUM: createCacheHeaders({
    ttl: 300, // 5 minutes
    tags: ['api', 'content'],
    revalidate: true
  }),
  
  // Slow-changing data (settings, configurations)
  SLOW: createCacheHeaders({
    ttl: 3600, // 1 hour
    tags: ['api', 'settings'],
    revalidate: true
  }),
  
  // Static API responses (health checks, metadata)
  STATIC: createCacheHeaders({
    ttl: 86400, // 24 hours
    tags: ['api', 'static'],
    revalidate: true
  })
}

/**
 * Database query result caching
 */
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function cacheQuery<T>(
  key: string, 
  queryFn: () => Promise<T>, 
  ttl: number = 300
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const now = Date.now()
      const cached = queryCache.get(key)
      
      // Return cached data if still valid
      if (cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
        resolve(cached.data)
        return
      }
      
      // Fetch fresh data
      const data = await queryFn()
      
      // Cache the result
      queryCache.set(key, {
        data,
        timestamp: now,
        ttl
      })
      
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Clear cache by tags
 */
export function invalidateCache(tags: string[]) {
  if (typeof process !== 'undefined' && process.env.VERCEL_ENV) {
    // In Vercel environment, use the cache API
    // This would need to be implemented with Vercel's cache invalidation API
    console.log(`[Cache] Invalidating tags: ${tags.join(', ')}`)
  }
  
  // Clear local query cache for matching tags
  const keysToDelete: string[] = []
  queryCache.forEach((value, key) => {
    // Simple tag-based invalidation (you could make this more sophisticated)
    if (tags.some(tag => key.includes(tag))) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => queryCache.delete(key))
}

/**
 * Image optimization cache headers
 */
export const IMAGE_CACHE_HEADERS = createCacheHeaders({
  ttl: 2592000, // 30 days
  tags: ['images'],
  revalidate: true
})

/**
 * Middleware for automatic cache header injection
 */
export function addCacheHeaders(
  request: NextRequest,
  response: NextResponse,
  options: CacheOptions = {}
) {
  const pathname = request.nextUrl.pathname
  
  // Different caching strategies based on path
  let cacheHeaders: Record<string, string>
  
  if (pathname.startsWith('/api/')) {
    // API routes
    if (pathname.includes('/auth/') || pathname.includes('/admin/dashboard/')) {
      cacheHeaders = API_CACHE_HEADERS.DYNAMIC
    } else if (pathname.includes('/health') || pathname.includes('/hello')) {
      cacheHeaders = API_CACHE_HEADERS.STATIC
    } else {
      cacheHeaders = API_CACHE_HEADERS.MEDIUM
    }
  } else if (pathname.startsWith('/_next/static/')) {
    // Static assets
    cacheHeaders = STATIC_CACHE_HEADERS
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
    // Images
    cacheHeaders = IMAGE_CACHE_HEADERS
  } else {
    // Regular pages
    cacheHeaders = createCacheHeaders({
      ttl: 1800, // 30 minutes
      tags: ['pages'],
      revalidate: true,
      ...options
    })
  }
  
  // Apply cache headers
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Edge-side includes (ESI) for dynamic content in cached pages
 */
export function createESIPlaceholder(key: string, fallback: string = ''): string {
  return `<!--esi <esi:include src="/api/esi/${key}" onerror="continue" /> -->${fallback}<!--/esi-->`
}

/**
 * Performance monitoring for cache effectiveness
 */
export class CacheMetrics {
  private static hits = 0
  private static misses = 0
  
  static recordHit() {
    this.hits++
  }
  
  static recordMiss() {
    this.misses++
  }
  
  static getStats() {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0
    }
  }
  
  static reset() {
    this.hits = 0
    this.misses = 0
  }
}