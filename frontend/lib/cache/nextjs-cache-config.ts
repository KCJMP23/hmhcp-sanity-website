/**
 * Next.js Cache Configuration
 * 
 * Optimized caching strategies for Next.js app router
 * Includes ISR, static generation, and dynamic caching
 */

import { unstable_cache } from 'next/cache'
import { cache as reactCache } from 'react'
import { cacheManager, CacheNamespace, CacheTag } from './redis-cache-manager'

// Cache revalidation times (in seconds)
export const REVALIDATE_TIMES = {
  HOMEPAGE: 300,        // 5 minutes
  STATIC_PAGE: 3600,    // 1 hour
  BLOG_POST: 1800,      // 30 minutes
  BLOG_LIST: 600,       // 10 minutes
  NAVIGATION: 3600,     // 1 hour
  CMS_CONTENT: 300,     // 5 minutes
  API_DATA: 60,         // 1 minute
  USER_DATA: 30,        // 30 seconds
  PLATFORMS: 3600,      // 1 hour
  SERVICES: 3600        // 1 hour
} as const

// Cache tags for Next.js revalidation
export const CACHE_TAGS = {
  homepage: ['homepage', 'cms'],
  navigation: ['navigation', 'cms'],
  blog: ['blog', 'cms'],
  blogPost: (slug: string) => ['blog', `blog-${slug}`, 'cms'],
  page: (slug: string) => ['page', `page-${slug}`, 'cms'],
  platforms: ['platforms', 'cms'],
  services: ['services', 'cms'],
  research: ['research', 'cms']
} as const

/**
 * Create cached function with Next.js unstable_cache
 * Combines with Redis for multi-layer caching
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    name: string
    tags?: string[]
    revalidate?: number
    namespace?: CacheNamespace
    useRedis?: boolean
  }
): T {
  const { name, tags = [], revalidate = 60, namespace = CacheNamespace.API, useRedis = true } = options

  // Wrap with React cache for request deduplication
  const reactCached = reactCache(async (...args: Parameters<T>) => {
    const cacheKey = `${name}:${JSON.stringify(args)}`

    // Try Redis cache first
    if (useRedis) {
      const cached = await cacheManager.get(cacheKey, { namespace })
      if (cached !== null) {
        return cached
      }
    }

    // Execute function
    const result = await fn(...args)

    // Store in Redis
    if (useRedis) {
      await cacheManager.set(cacheKey, result, {
        namespace,
        ttl: revalidate,
        tags: tags.map(tag => tag as CacheTag)
      })
    }

    return result
  })

  // Wrap with Next.js unstable_cache for build-time and ISR caching
  const nextCached = unstable_cache(
    reactCached,
    [name],
    {
      tags,
      revalidate
    }
  )

  return nextCached as T
}

/**
 * CMS Data Cache Layer
 */
export const cmsCache = {
  /**
   * Cache homepage data
   */
  homepage: createCachedFunction(
    async () => {
      const { getContent } = await import('../dal/content')
      const result = await getContent({ type: 'page', status: 'published', limit: 1 })
      return result.items[0] || null
    },
    {
      name: 'homepage-data',
      tags: [...CACHE_TAGS.homepage],
      revalidate: REVALIDATE_TIMES.HOMEPAGE,
      namespace: CacheNamespace.HOMEPAGE
    }
  ),

  /**
   * Cache navigation data
   */
  navigation: createCachedFunction(
    async () => {
      const { getAllNavigationMenus } = await import('../dal/navigation')
      return getAllNavigationMenus()
    },
    {
      name: 'navigation-data',
      tags: [...CACHE_TAGS.navigation],
      revalidate: REVALIDATE_TIMES.NAVIGATION,
      namespace: CacheNamespace.NAVIGATION
    }
  ),

  /**
   * Cache page data
   */
  page: createCachedFunction(
    async (slug: string) => {
      const { getContentBySlug } = await import('../dal/content')
      return getContentBySlug('page', slug)
    },
    {
      name: 'page-data',
      tags: ['pages', 'cms'],
      revalidate: REVALIDATE_TIMES.STATIC_PAGE,
      namespace: CacheNamespace.PAGES
    }
  ),

  /**
   * Cache blog posts
   */
  blogPosts: createCachedFunction(
    async (limit?: number, offset?: number) => {
      const { getContent } = await import('../dal/content')
      return getContent({ type: 'post', status: 'published', limit, offset })
    },
    {
      name: 'blog-posts',
      tags: [...CACHE_TAGS.blog],
      revalidate: REVALIDATE_TIMES.BLOG_LIST,
      namespace: CacheNamespace.CMS
    }
  ),

  /**
   * Cache single blog post
   */
  blogPost: createCachedFunction(
    async (slug: string) => {
      const { getContentBySlug } = await import('../dal/content')
      return getContentBySlug('post', slug)
    },
    {
      name: 'blog-post',
      tags: ['blog', 'cms'],
      revalidate: REVALIDATE_TIMES.BLOG_POST,
      namespace: CacheNamespace.CMS
    }
  )
}

/**
 * API Response Cache Layer
 */
export const apiCache = {
  /**
   * Cache API responses with intelligent key generation
   */
  response: async <T>(
    endpoint: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number
      tags?: CacheTag[]
    }
  ): Promise<T> => {
    const cacheKey = `api:${endpoint}`
    
    return cacheManager.getOrSet(
      cacheKey,
      fetcher,
      {
        namespace: CacheNamespace.API,
        ttl: options?.ttl || REVALIDATE_TIMES.API_DATA,
        tags: options?.tags
      }
    )
  },

  /**
   * Cache POST request responses (with body hash)
   */
  post: async <T>(
    endpoint: string,
    body: any,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const bodyHash = JSON.stringify(body)
    const cacheKey = `api:post:${endpoint}:${bodyHash}`
    
    return cacheManager.getOrSet(
      cacheKey,
      fetcher,
      {
        namespace: CacheNamespace.API,
        ttl: ttl || 30 // Short TTL for POST responses
      }
    )
  }
}

/**
 * HTML Fragment Cache
 */
export const htmlCache = {
  /**
   * Cache rendered HTML fragments
   */
  fragment: async (
    key: string,
    renderer: () => Promise<string>,
    ttl?: number
  ): Promise<string> => {
    return cacheManager.getOrSet(
      key,
      renderer,
      {
        namespace: CacheNamespace.HTML,
        ttl: ttl || REVALIDATE_TIMES.STATIC_PAGE,
        serialize: false // HTML is already a string
      }
    )
  },

  /**
   * Cache entire page HTML
   */
  page: async (
    pathname: string,
    renderer: () => Promise<string>,
    options?: {
      ttl?: number
      tags?: CacheTag[]
    }
  ): Promise<string> => {
    const cacheKey = `page:${pathname}`
    
    return cacheManager.getOrSet(
      cacheKey,
      renderer,
      {
        namespace: CacheNamespace.HTML,
        ttl: options?.ttl || REVALIDATE_TIMES.STATIC_PAGE,
        tags: options?.tags,
        serialize: false
      }
    )
  }
}

/**
 * Database Query Cache
 */
export const queryCache = {
  /**
   * Cache database query results
   */
  query: async <T>(
    queryKey: string,
    executor: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    return cacheManager.getOrSet(
      queryKey,
      executor,
      {
        namespace: CacheNamespace.QUERY,
        ttl: ttl || 300 // 5 minutes default
      }
    )
  },

  /**
   * Cache parameterized queries
   */
  parameterized: async <T>(
    query: string,
    params: any[],
    executor: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cacheKey = `${query}:${JSON.stringify(params)}`
    
    return cacheManager.getOrSet(
      cacheKey,
      executor,
      {
        namespace: CacheNamespace.QUERY,
        ttl: ttl || 300
      }
    )
  }
}

/**
 * Static Asset Cache Headers
 */
export const staticCacheHeaders = {
  /**
   * Get cache headers for static assets
   */
  getHeaders: (type: 'image' | 'font' | 'css' | 'js' | 'json'): HeadersInit => {
    const maxAge = {
      image: 31536000,  // 1 year
      font: 31536000,   // 1 year
      css: 86400,       // 1 day
      js: 86400,        // 1 day
      json: 3600        // 1 hour
    }

    return {
      'Cache-Control': `public, max-age=${maxAge[type]}, immutable`,
      'CDN-Cache-Control': `max-age=${maxAge[type]}`,
      'Cloudflare-CDN-Cache-Control': `max-age=${maxAge[type]}`
    }
  },

  /**
   * Get cache headers for dynamic content
   */
  getDynamicHeaders: (maxAge: number = 60, sMaxAge: number = 300): HeadersInit => {
    return {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=60`,
      'CDN-Cache-Control': `max-age=${sMaxAge}`,
      'Surrogate-Control': `max-age=${sMaxAge}`
    }
  }
}

/**
 * Cache Warming Strategies
 */
export const cacheWarming = {
  /**
   * Warm critical marketing pages
   */
  warmMarketingPages: async () => {
    const pages = ['/', '/services', '/platforms', '/research', '/about', '/contact']
    
    const warmingTasks = pages.map(async (page) => {
      try {
        // Warm page data
        await cmsCache.page(page.substring(1) || 'home')
        
        // Warm navigation
        await cmsCache.navigation()
        
        console.log(`Warmed cache for ${page}`)
      } catch (error) {
        console.error(`Failed to warm cache for ${page}:`, error)
      }
    })

    await Promise.all(warmingTasks)
  },

  /**
   * Warm blog cache
   */
  warmBlogCache: async () => {
    try {
      // Warm recent blog posts
      await cmsCache.blogPosts(10, 0)
      
      console.log('Warmed blog cache')
    } catch (error) {
      console.error('Failed to warm blog cache:', error)
    }
  },

  /**
   * Warm all critical caches
   */
  warmAll: async () => {
    await Promise.all([
      cacheWarming.warmMarketingPages(),
      cacheWarming.warmBlogCache(),
      cmsCache.homepage()
    ])
  }
}

/**
 * Cache Invalidation Helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate homepage
   */
  homepage: async () => {
    await cacheManager.invalidateByTags([CacheTag.HOMEPAGE])
    await cacheManager.clearNamespace(CacheNamespace.HOMEPAGE)
  },

  /**
   * Invalidate navigation
   */
  navigation: async () => {
    await cacheManager.invalidateByTags([CacheTag.NAVIGATION])
    await cacheManager.clearNamespace(CacheNamespace.NAVIGATION)
  },

  /**
   * Invalidate blog
   */
  blog: async () => {
    await cacheManager.invalidateByTags([CacheTag.BLOG])
  },

  /**
   * Invalidate specific page
   */
  page: async (slug: string) => {
    await cacheManager.delete(`page-data:["${slug}"]`, CacheNamespace.PAGES)
    await cacheManager.delete(`page:/${slug}`, CacheNamespace.HTML)
  },

  /**
   * Invalidate all CMS content
   */
  allCms: async () => {
    await Promise.all([
      cacheManager.clearNamespace(CacheNamespace.CMS),
      cacheManager.clearNamespace(CacheNamespace.HOMEPAGE),
      cacheManager.clearNamespace(CacheNamespace.PAGES),
      cacheManager.clearNamespace(CacheNamespace.NAVIGATION)
    ])
  }
}