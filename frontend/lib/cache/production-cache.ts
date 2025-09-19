/**
 * Production Caching Strategies
 * Advanced caching configuration for optimal performance
 */

import { NextRequest, NextResponse } from 'next/server'

// Cache configuration
export const CACHE_CONFIG = {
  // Static assets cache (1 year)
  STATIC_ASSETS: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400, // 1 day
  },
  
  // API responses cache (5 minutes)
  API_RESPONSES: {
    maxAge: 300, // 5 minutes
    sMaxAge: 300,
    staleWhileRevalidate: 60, // 1 minute
  },
  
  // Public content cache (1 hour)
  PUBLIC_CONTENT: {
    maxAge: 3600, // 1 hour
    sMaxAge: 3600,
    staleWhileRevalidate: 300, // 5 minutes
  },
  
  // Admin content cache (30 minutes)
  ADMIN_CONTENT: {
    maxAge: 1800, // 30 minutes
    sMaxAge: 1800,
    staleWhileRevalidate: 300, // 5 minutes
  },
  
  // User-specific content cache (5 minutes)
  USER_CONTENT: {
    maxAge: 300, // 5 minutes
    sMaxAge: 0, // Don't cache on CDN
    staleWhileRevalidate: 60, // 1 minute
  }
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  response: NextResponse,
  cacheType: keyof typeof CACHE_CONFIG,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const config = CACHE_CONFIG[cacheType]
  
  const headers = {
    'Cache-Control': `public, max-age=${config.maxAge}, s-maxage=${config.sMaxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`,
    'Vary': 'Accept-Encoding',
    ...additionalHeaders
  }
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Add ETag for conditional requests
 */
export function addETag(response: NextResponse, content: string): NextResponse {
  const etag = `"${Buffer.from(content).toString('base64').slice(0, 16)}"`
  response.headers.set('ETag', etag)
  return response
}

/**
 * Check if request has valid ETag
 */
export function checkETag(request: NextRequest, content: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  const etag = `"${Buffer.from(content).toString('base64').slice(0, 16)}"`
  
  return ifNoneMatch === etag
}

/**
 * Cache key generator
 */
export function generateCacheKey(
  baseKey: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  
  return `${baseKey}:${sortedParams}`
}

/**
 * Redis cache implementation for production
 */
export class ProductionCache {
  private static instance: ProductionCache
  private cache: Map<string, { data: any; expires: number }> = new Map()
  
  static getInstance(): ProductionCache {
    if (!ProductionCache.instance) {
      ProductionCache.instance = new ProductionCache()
    }
    return ProductionCache.instance
  }
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }
  
  async set<T>(
    key: string, 
    data: T, 
    ttlSeconds: number = 300
  ): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expires })
  }
  
  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }
  
  async clear(): Promise<void> {
    this.cache.clear()
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.cache.keys()).filter(key => regex.test(key))
  }
}

/**
 * Cache middleware for API routes
 */
export function withCache(
  cacheType: keyof typeof CACHE_CONFIG,
  ttlSeconds?: number
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      const cache = ProductionCache.getInstance()
      const cacheKey = generateCacheKey(
        req.nextUrl.pathname,
        Object.fromEntries(req.nextUrl.searchParams)
      )
      
      // Try to get from cache
      const cached = await cache.get(cacheKey)
      if (cached) {
        const response = NextResponse.json(cached)
        return addCacheHeaders(response, cacheType)
      }
      
      // Execute handler
      const response = await handler(req)
      
      // Cache successful responses
      if (response.status === 200) {
        const data = await response.clone().json()
        await cache.set(cacheKey, data, ttlSeconds || CACHE_CONFIG[cacheType].maxAge)
      }
      
      return addCacheHeaders(response, cacheType)
    }
  }
}

export default ProductionCache
