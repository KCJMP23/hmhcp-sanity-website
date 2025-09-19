/**
 * API Response utility with automatic cache header application
 * Provides consistent caching strategies across all API endpoints
 */

import { NextResponse } from 'next/server'
import { getCacheHeaders, CACHE_STRATEGIES, getCDNHeaders, getPerformanceHeaders } from './headers'

export interface ApiCacheConfig {
  strategy?: keyof typeof CACHE_STRATEGIES
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  tags?: string[]
  etag?: boolean
  lastModified?: Date
  vary?: string[]
}

/**
 * Create a cached API response with appropriate headers
 */
export function createCachedResponse<T = any>(
  data: T,
  config: ApiCacheConfig = {}
): NextResponse<T> {
  const response = NextResponse.json(data)
  
  // Apply cache strategy
  const strategy = config.strategy || 'API_NO_CACHE'
  const cacheHeaders = getCacheHeaders(strategy, {
    maxAge: config.maxAge,
    sMaxAge: config.sMaxAge,
    staleWhileRevalidate: config.staleWhileRevalidate,
    vary: config.vary,
    etag: config.etag,
  })
  
  // Apply cache headers
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add CDN headers if tags provided
  if (config.tags && config.tags.length > 0) {
    response.headers.set('Cache-Tag', config.tags.join(','))
  }
  
  // Add Last-Modified header if provided
  if (config.lastModified) {
    response.headers.set('Last-Modified', config.lastModified.toUTCString())
  }
  
  // Add performance headers
  const perfHeaders = getPerformanceHeaders()
  Object.entries(perfHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Create a response for static data that changes infrequently
 */
export function createStaticDataResponse<T = any>(
  data: T,
  options: {
    maxAge?: number
    tags?: string[]
    lastModified?: Date
  } = {}
): NextResponse<T> {
  return createCachedResponse(data, {
    strategy: 'API_PUBLIC',
    maxAge: options.maxAge || 3600, // 1 hour default
    tags: options.tags,
    lastModified: options.lastModified,
    vary: ['Accept-Encoding'],
    etag: true,
  })
}

/**
 * Create a response for frequently changing data with edge caching
 */
export function createDynamicDataResponse<T = any>(
  data: T,
  options: {
    maxAge?: number
    sMaxAge?: number
    staleWhileRevalidate?: number
    tags?: string[]
  } = {}
): NextResponse<T> {
  return createCachedResponse(data, {
    strategy: 'ISR_CONTENT',
    maxAge: options.maxAge || 0,
    sMaxAge: options.sMaxAge || 60,
    staleWhileRevalidate: options.staleWhileRevalidate || 300,
    tags: options.tags,
    vary: ['Accept-Encoding'],
  })
}

/**
 * Create a response for user-specific data (no caching)
 */
export function createPrivateDataResponse<T = any>(
  data: T,
  options: {
    vary?: string[]
  } = {}
): NextResponse<T> {
  return createCachedResponse(data, {
    strategy: 'API_NO_CACHE',
    vary: options.vary || ['Authorization', 'Cookie'],
  })
}

/**
 * Create a response for health checks and monitoring
 */
export function createHealthCheckResponse<T = any>(
  data: T
): NextResponse<T> {
  return createCachedResponse(data, {
    strategy: 'HEALTH_CHECK',
    tags: ['health', 'monitoring'],
  })
}

/**
 * Conditional response based on If-None-Match header
 */
export function createConditionalResponse<T = any>(
  request: Request,
  data: T,
  etag: string,
  config: ApiCacheConfig = {}
): NextResponse<T> {
  const ifNoneMatch = request.headers.get('if-none-match')
  
  if (ifNoneMatch === etag) {
    const notModifiedResponse = new NextResponse(null, { status: 304 })
    
    // Apply cache headers to 304 response
    const cacheHeaders = getCacheHeaders(config.strategy || 'API_PUBLIC', config)
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      notModifiedResponse.headers.set(key, value)
    })
    
    notModifiedResponse.headers.set('ETag', etag)
    return notModifiedResponse as NextResponse<T>
  }
  
  const response = createCachedResponse(data, config)
  response.headers.set('ETag', etag)
  return response
}

/**
 * Response with compression hints
 */
export function createCompressedResponse<T = any>(
  data: T,
  config: ApiCacheConfig = {}
): NextResponse<T> {
  const response = createCachedResponse(data, {
    ...config,
    vary: [...(config.vary || []), 'Accept-Encoding'],
  })
  
  // Add compression hints
  response.headers.set('Content-Encoding', 'gzip')
  response.headers.set('Vary', 'Accept-Encoding')
  
  return response
}

/**
 * Error response with appropriate caching (no caching for errors)
 */
export function createErrorResponse(
  error: string | { message: string; code?: string },
  status: number = 500
): NextResponse {
  const errorData = typeof error === 'string' ? { error } : error
  
  const response = NextResponse.json(errorData, { status })
  
  // Never cache error responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * Success response with default caching for successful operations
 */
export function createSuccessResponse<T = any>(
  data: T,
  options: {
    message?: string
    cache?: ApiCacheConfig
  } = {}
): NextResponse<{ success: boolean; data: T; message?: string }> {
  const responseData = {
    success: true,
    data,
    ...(options.message && { message: options.message }),
  }
  
  return createCachedResponse(responseData, options.cache || { strategy: 'API_NO_CACHE' })
}

/**
 * Paginated response with cache optimization
 */
export function createPaginatedResponse<T = any>(
  items: T[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  },
  config: ApiCacheConfig = {}
): NextResponse<{
  items: T[]
  pagination: typeof pagination
}> {
  const data = { items, pagination }
  
  // Add pagination-specific cache tags
  const tags = [
    ...(config.tags || []),
    `page-${pagination.page}`,
    `limit-${pagination.limit}`,
  ]
  
  return createCachedResponse(data, {
    ...config,
    tags,
    vary: [...(config.vary || []), 'Accept-Encoding'],
  })
}

/**
 * Content-based ETag generation
 */
export function generateContentETag(content: any): string {
  const contentString = typeof content === 'string' ? content : JSON.stringify(content)
  
  // Simple hash function for demonstration
  // In production, consider using a more robust hashing algorithm
  let hash = 0
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return `"${Math.abs(hash).toString(36)}"`
}

/**
 * Middleware helper for API routes
 */
export function withCaching<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  defaultConfig: ApiCacheConfig = {}
): T {
  return (async (...args: Parameters<T>) => {
    const response = await handler(...args)
    
    // Apply default caching if no cache headers are present
    if (!response.headers.get('Cache-Control')) {
      const cacheHeaders = getCacheHeaders(
        defaultConfig.strategy || 'API_NO_CACHE',
        defaultConfig
      )
      
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    
    return response
  }) as T
}