/**
 * Incremental Static Regeneration (ISR) Configuration
 * Optimized for Next.js 15 with comprehensive caching strategies
 */

import React from 'react'

export interface ISRConfig {
  revalidate?: number | false
  tags?: string[]
  dynamicParams?: boolean
}

/**
 * ISR configurations for different page types
 */
export const ISR_CONFIGS = {
  // Homepage - revalidate every 5 minutes
  HOMEPAGE: {
    revalidate: 300,
    tags: ['homepage', 'layout'],
  },
  
  // Blog posts - revalidate every hour
  BLOG_POST: {
    revalidate: 3600,
    tags: ['blog', 'content'],
  },
  
  // Blog listing - revalidate every 15 minutes
  BLOG_LISTING: {
    revalidate: 900,
    tags: ['blog', 'listing'],
  },
  
  // Platform pages - revalidate every 30 minutes
  PLATFORM_PAGE: {
    revalidate: 1800,
    tags: ['platforms', 'content'],
  },
  
  // About/static pages - revalidate daily
  STATIC_PAGES: {
    revalidate: 86400,
    tags: ['static', 'content'],
  },
  
  // Contact page - revalidate every 6 hours
  CONTACT_PAGE: {
    revalidate: 21600,
    tags: ['contact', 'forms'],
  },
  
  // Admin pages - no ISR (always fresh)
  ADMIN_PAGES: {
    revalidate: false,
    tags: ['admin'],
  },
  
  // Search results - revalidate every 10 minutes
  SEARCH_RESULTS: {
    revalidate: 600,
    tags: ['search', 'results'],
  },
  
  // Legal pages - revalidate weekly
  LEGAL_PAGES: {
    revalidate: 604800,
    tags: ['legal', 'static'],
  },
} as const

/**
 * Generate ISR export config for page components
 */
export function generateISRExport(configKey: keyof typeof ISR_CONFIGS) {
  const config = ISR_CONFIGS[configKey]
  
  return {
    revalidate: config.revalidate,
    tags: config.tags,
  }
}

/**
 * Dynamic ISR configuration based on content freshness requirements
 */
export function getDynamicISRConfig(
  contentType: 'blog' | 'platform' | 'static' | 'dynamic',
  priority: 'high' | 'medium' | 'low' = 'medium'
): ISRConfig {
  const priorityMultipliers = {
    high: 0.5,
    medium: 1,
    low: 2,
  }
  
  const baseRevalidation = {
    blog: 3600,      // 1 hour
    platform: 1800,  // 30 minutes
    static: 86400,   // 1 day
    dynamic: 300,    // 5 minutes
  }
  
  const revalidate = Math.floor(baseRevalidation[contentType] * priorityMultipliers[priority])
  
  return {
    revalidate,
    tags: [contentType, priority],
  }
}

/**
 * Content-based cache invalidation tags
 */
export function generateCacheTags(params: {
  contentType: string
  slug?: string
  category?: string
  author?: string
  platform?: string
}): string[] {
  const tags: string[] = [params.contentType]
  
  if (params.slug) {
    tags.push(`${params.contentType}-${params.slug}`)
  }
  
  if (params.category) {
    tags.push(`category-${params.category}`)
  }
  
  if (params.author) {
    tags.push(`author-${params.author}`)
  }
  
  if (params.platform) {
    tags.push(`platform-${params.platform}`)
  }
  
  return tags
}

/**
 * Smart revalidation based on content update patterns
 */
export function getSmartRevalidation(
  lastUpdated: Date,
  contentType: keyof typeof ISR_CONFIGS
): number {
  const now = new Date()
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
  
  const baseConfig = ISR_CONFIGS[contentType]
  const baseRevalidate = typeof baseConfig.revalidate === 'number' ? baseConfig.revalidate : 3600
  
  // Increase revalidation time for older content
  if (hoursSinceUpdate > 168) { // 1 week
    return baseRevalidate * 4
  } else if (hoursSinceUpdate > 24) { // 1 day
    return baseRevalidate * 2
  }
  
  return baseRevalidate
}

/**
 * ISR configuration for API routes with caching
 */
export const API_ISR_CONFIGS = {
  // Public API endpoints
  PUBLIC_API: {
    revalidate: 300,
    tags: ['api', 'public'],
  },
  
  // CMS content API
  CMS_CONTENT: {
    revalidate: 600,
    tags: ['api', 'cms', 'content'],
  },
  
  // Search API
  SEARCH_API: {
    revalidate: 900,
    tags: ['api', 'search'],
  },
  
  // Analytics API
  ANALYTICS_API: {
    revalidate: 1800,
    tags: ['api', 'analytics'],
  },
} as const

/**
 * Generate metadata for ISR pages with cache optimization
 */
export function generateISRMetadata(
  title: string,
  description: string,
  config: ISRConfig
) {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
    other: {
      'cache-tags': config.tags?.join(',') || '',
      'revalidate': config.revalidate?.toString() || 'false',
    },
  }
}

/**
 * ISR page wrapper with automatic cache management
 */
export function withISR<T extends Record<string, any>>(
  PageComponent: React.ComponentType<T>,
  config: ISRConfig
) {
  const ISRPage = (props: T) => {
    return React.createElement(PageComponent, props)
  }
  
  // Add static properties for Next.js ISR
  ISRPage.revalidate = config.revalidate
  
  return ISRPage
}

/**
 * Cache warming strategy for critical pages
 */
export const CACHE_WARMING_STRATEGY = {
  // Critical pages to warm on deployment
  CRITICAL_PAGES: [
    '/',
    '/about',
    '/contact',
    '/platforms',
    '/blog',
  ],
  
  // Blog posts to warm (latest 10)
  BLOG_POSTS_COUNT: 10,
  
  // Platform pages to warm
  PLATFORM_PAGES: [
    '/platforms/hospital-management',
    '/platforms/telemedicine',
    '/platforms/electronic-health-records',
  ],
}

/**
 * Background revalidation for stale content
 */
export function scheduleBackgroundRevalidation(
  paths: string[],
  tags?: string[]
) {
  // This would typically integrate with your deployment pipeline
  // or a background job system like Vercel's revalidation API
  
  return {
    paths,
    tags,
    timestamp: new Date().toISOString(),
    strategy: 'background',
  }
}

/**
 * ISR analytics and monitoring
 */
export interface ISRAnalytics {
  path: string
  hitRate: number
  missRate: number
  revalidationCount: number
  lastRevalidation: Date
  avgResponseTime: number
}

export function trackISRPerformance(path: string): ISRAnalytics {
  // Implementation would integrate with your analytics service
  return {
    path,
    hitRate: 0.95,
    missRate: 0.05,
    revalidationCount: 0,
    lastRevalidation: new Date(),
    avgResponseTime: 150,
  }
}