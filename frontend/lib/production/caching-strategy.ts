/**
 * Production Caching Strategy
 * 
 * Optimized caching configuration for 298 static pages
 * with proper ISR (Incremental Static Regeneration) setup.
 */

import { unstable_cache } from 'next/cache'
import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { isBuildTime, shouldInitializeServices } from './build-runtime-separator'

/**
 * Cache Tags for organized invalidation
 */
export const CacheTags = {
  // Content tags
  PAGES: 'pages',
  POSTS: 'posts',
  NAVIGATION: 'navigation',
  SETTINGS: 'settings',
  
  // User-specific tags
  USER_SESSION: 'user-session',
  USER_PREFERENCES: 'user-preferences',
  
  // API response tags  
  API_HEALTH: 'api-health',
  API_ANALYTICS: 'api-analytics',
  
  // Static content tags
  IMAGES: 'images',
  ASSETS: 'assets',
  
  // Dynamic content tags
  FORMS: 'forms',
  SEARCH: 'search'
} as const

/**
 * Cache durations in seconds
 */
export const CacheDurations = {
  // Static content - very long cache
  STATIC_ASSETS: 31536000, // 1 year
  STATIC_PAGES: 86400,     // 24 hours
  
  // Semi-static content - moderate cache
  NAVIGATION: 3600,        // 1 hour
  SETTINGS: 1800,          // 30 minutes
  
  // Dynamic content - short cache
  API_RESPONSES: 300,      // 5 minutes
  USER_DATA: 900,          // 15 minutes
  
  // Real-time content - very short cache
  HEALTH_CHECKS: 60,       // 1 minute
  ANALYTICS: 300,          // 5 minutes
  
  // ISR revalidation intervals
  ISR_PAGES: 3600,         // 1 hour for page regeneration
  ISR_POSTS: 1800,         // 30 minutes for blog posts
} as const

/**
 * Cache configuration for different content types
 */
export const CacheConfig = {
  // Static pages configuration
  staticPages: {
    revalidate: CacheDurations.ISR_PAGES,
    tags: [CacheTags.PAGES],
    fetchCache: 'force-cache' as const
  },
  
  // Blog posts configuration
  blogPosts: {
    revalidate: CacheDurations.ISR_POSTS,
    tags: [CacheTags.POSTS],
    fetchCache: 'force-cache' as const
  },
  
  // Navigation configuration
  navigation: {
    revalidate: CacheDurations.NAVIGATION,
    tags: [CacheTags.NAVIGATION],
    fetchCache: 'default-cache' as const
  },
  
  // API responses configuration
  apiResponses: {
    revalidate: CacheDurations.API_RESPONSES,
    tags: [CacheTags.API_HEALTH],
    fetchCache: 'default-no-store' as const
  },
  
  // User-specific data configuration
  userData: {
    revalidate: CacheDurations.USER_DATA,
    tags: [CacheTags.USER_SESSION],
    fetchCache: 'default-no-store' as const
  }
} as const

/**
 * Next.js cache wrapper with production optimizations
 */
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    tags?: string[]
    revalidate?: number
    keyParts?: (args: T) => string[]
  }
) {
  const { tags = [], revalidate = CacheDurations.API_RESPONSES, keyParts } = options
  
  return unstable_cache(
    fn,
    keyParts ? undefined : [fn.name],
    {
      tags,
      revalidate
    }
  )
}

/**
 * Page-level caching utility
 */
export class PageCache {
  private static instance: PageCache
  
  static getInstance(): PageCache {
    if (!PageCache.instance) {
      PageCache.instance = new PageCache()
    }
    return PageCache.instance
  }
  
  /**
   * Cache a page with automatic tag generation
   */
  async cachePage<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      revalidate?: number
      tags?: string[]
      type?: keyof typeof CacheConfig
    } = {}
  ): Promise<T> {
    if (isBuildTime()) {
      // During build, execute function directly without caching
      try {
        return await fetcher()
      } catch (error) {
        logger.warn(`Build-time cache miss for ${key}, using fallback`)
        throw error
      }
    }
    
    const config = options.type ? CacheConfig[options.type] : {}
    const cacheOptions = {
      revalidate: options.revalidate || config.revalidate || CacheDurations.STATIC_PAGES,
      tags: [...(options.tags || []), ...(config.tags || []), `page:${key}`]
    }
    
    const cachedFetcher = createCachedFunction(fetcher, {
      ...cacheOptions,
      keyParts: () => [key]
    })
    
    try {
      const result = await cachedFetcher()
      logger.debug(`Cache hit for page: ${key}`, { tags: cacheOptions.tags })
      return result
    } catch (error) {
      logger.error(`Cache error for page: ${key}`, error)
      throw error
    }
  }
  
  /**
   * Invalidate page cache
   */
  async invalidatePage(key: string): Promise<void> {
    try {
      await revalidateTag(`page:${key}`)
      logger.info(`Invalidated cache for page: ${key}`)
    } catch (error) {
      logger.error(`Failed to invalidate cache for page: ${key}`, error)
    }
  }
  
  /**
   * Invalidate multiple pages by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      await revalidateTag(tag)
      logger.info(`Invalidated cache for tag: ${tag}`)
    } catch (error) {
      logger.error(`Failed to invalidate cache for tag: ${tag}`, error)
    }
  }
  
  /**
   * Invalidate path-based cache
   */
  async invalidatePath(path: string): Promise<void> {
    try {
      await revalidatePath(path)
      logger.info(`Invalidated cache for path: ${path}`)
    } catch (error) {
      logger.error(`Failed to invalidate cache for path: ${path}`, error)
    }
  }
}

/**
 * API response caching utility
 */
export class ApiCache {
  private static instance: ApiCache
  
  static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache()
    }
    return ApiCache.instance
  }
  
  /**
   * Cache API response with automatic headers
   */
  async cacheResponse<T>(
    endpoint: string,
    fetcher: () => Promise<T>,
    options: {
      revalidate?: number
      tags?: string[]
      headers?: Record<string, string>
    } = {}
  ): Promise<T & { _cached?: boolean; _cacheTime?: string }> {
    if (isBuildTime()) {
      // Skip caching during build
      return await fetcher()
    }
    
    const cacheOptions = {
      revalidate: options.revalidate || CacheDurations.API_RESPONSES,
      tags: [...(options.tags || []), CacheTags.API_HEALTH, `api:${endpoint}`]
    }
    
    const cachedFetcher = createCachedFunction(async () => {
      const result = await fetcher()
      return {
        ...result,
        _cached: true,
        _cacheTime: new Date().toISOString()
      }
    }, {
      ...cacheOptions,
      keyParts: () => [endpoint]
    })
    
    try {
      return await cachedFetcher()
    } catch (error) {
      logger.error(`API cache error for endpoint: ${endpoint}`, error)
      throw error
    }
  }
}

/**
 * Static asset caching utility
 */
export class StaticAssetCache {
  /**
   * Generate cache headers for static assets
   */
  static getCacheHeaders(assetType: 'image' | 'css' | 'js' | 'font' | 'other' = 'other') {
    const durations = {
      image: CacheDurations.STATIC_ASSETS,
      css: CacheDurations.STATIC_ASSETS,
      js: CacheDurations.STATIC_ASSETS,
      font: CacheDurations.STATIC_ASSETS,
      other: CacheDurations.STATIC_PAGES
    }
    
    const maxAge = durations[assetType]
    
    return {
      'Cache-Control': `public, max-age=${maxAge}, immutable`,
      'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    }
  }
}

/**
 * ISR (Incremental Static Regeneration) configuration
 */
export class ISRConfig {
  /**
   * Get ISR configuration for page types
   */
  static getPageConfig(pageType: 'static' | 'blog' | 'dynamic' | 'api' = 'static') {
    const configs = {
      static: {
        revalidate: CacheDurations.ISR_PAGES,
        tags: [CacheTags.PAGES],
      },
      blog: {
        revalidate: CacheDurations.ISR_POSTS,
        tags: [CacheTags.POSTS],
      },
      dynamic: {
        revalidate: CacheDurations.API_RESPONSES,
        tags: [CacheTags.API_HEALTH],
      },
      api: {
        revalidate: false, // No ISR for API routes
        tags: []
      }
    }
    
    return configs[pageType]
  }
  
  /**
   * Batch invalidate pages for content updates
   */
  static async batchInvalidate(pages: string[], tags: string[] = []) {
    const promises = [
      // Invalidate specific pages
      ...pages.map(page => revalidatePath(page)),
      // Invalidate by tags
      ...tags.map(tag => revalidateTag(tag))
    ]
    
    try {
      await Promise.all(promises)
      logger.info('Batch cache invalidation completed', { pages, tags })
    } catch (error) {
      logger.error('Batch cache invalidation failed', error)
    }
  }
}

/**
 * Cache warming utility for production
 */
export class CacheWarmer {
  private static criticalPaths = [
    '/',
    '/about',
    '/services',
    '/contact',
    '/blog',
    '/privacy',
    '/terms'
  ]
  
  /**
   * Warm critical paths after deployment
   */
  static async warmCriticalPaths(baseUrl: string) {
    if (isBuildTime() || !shouldInitializeServices()) {
      logger.info('Skipping cache warming during build')
      return
    }
    
    const promises = this.criticalPaths.map(async (path) => {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          headers: { 'X-Cache-Warm': 'true' }
        })
        
        if (response.ok) {
          logger.info(`Cache warmed: ${path}`)
        } else {
          logger.warn(`Cache warm failed: ${path} (${response.status})`)
        }
      } catch (error) {
        logger.error(`Cache warm error: ${path}`, error)
      }
    })
    
    await Promise.allSettled(promises)
    logger.info('Cache warming completed')
  }
}

// Export singleton instances
export const pageCache = PageCache.getInstance()
export const apiCache = ApiCache.getInstance()

// Export utilities
export { 
  StaticAssetCache,
  ISRConfig, 
  CacheWarmer 
}