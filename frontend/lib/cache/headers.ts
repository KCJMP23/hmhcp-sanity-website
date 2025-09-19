/**
 * Comprehensive caching headers utility
 * Provides optimized cache control headers for different content types
 */

export interface CacheConfig {
  maxAge: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  immutable?: boolean
  mustRevalidate?: boolean
  noCache?: boolean
  noStore?: boolean
  private?: boolean
  vary?: string[]
  etag?: boolean
}

export const CACHE_DURATIONS = {
  // Short-term caching
  NEVER: 0,
  MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  HOUR: 3600,
  
  // Medium-term caching
  SIX_HOURS: 21600,
  DAY: 86400,
  WEEK: 604800,
  
  // Long-term caching
  MONTH: 2592000,
  YEAR: 31536000,
} as const

export const CACHE_STRATEGIES = {
  // Static assets - never change
  STATIC_ASSETS: {
    maxAge: CACHE_DURATIONS.YEAR,
    immutable: true,
    vary: ['Accept-Encoding'],
  },
  
  // Fonts - cross-origin optimized
  FONTS: {
    maxAge: CACHE_DURATIONS.YEAR,
    immutable: true,
    vary: ['Accept-Encoding'],
  },
  
  // HTML pages - edge caching with instant updates
  HTML_PAGES: {
    maxAge: 0,
    sMaxAge: CACHE_DURATIONS.FIVE_MINUTES,
    mustRevalidate: true,
    vary: ['Accept-Encoding', 'User-Agent'],
  },
  
  // Dynamic content with ISR
  ISR_CONTENT: {
    maxAge: 0,
    sMaxAge: CACHE_DURATIONS.MINUTE,
    staleWhileRevalidate: CACHE_DURATIONS.FIVE_MINUTES,
    vary: ['Accept-Encoding'],
  },
  
  // API responses - no caching by default
  API_NO_CACHE: {
    maxAge: 0,
    noStore: true,
    noCache: true,
    mustRevalidate: true,
  },
  
  // Public API responses - short caching
  API_PUBLIC: {
    maxAge: CACHE_DURATIONS.MINUTE,
    vary: ['Accept-Encoding', 'Authorization'],
  },
  
  // Health checks and status endpoints
  HEALTH_CHECK: {
    maxAge: CACHE_DURATIONS.MINUTE,
  },
  
  // Service worker - allow updates
  SERVICE_WORKER: {
    maxAge: 0,
    mustRevalidate: true,
  },
  
  // Sitemap and robots - daily updates
  METADATA_FILES: {
    maxAge: CACHE_DURATIONS.DAY,
  },
} as const

/**
 * Generate Cache-Control header value from config
 */
export function generateCacheControl(config: CacheConfig): string {
  const directives: string[] = []
  
  if (config.private) {
    directives.push('private')
  } else {
    directives.push('public')
  }
  
  if (config.noStore) {
    directives.push('no-store')
  }
  
  if (config.noCache) {
    directives.push('no-cache')
  }
  
  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`)
  }
  
  if (config.sMaxAge !== undefined) {
    directives.push(`s-maxage=${config.sMaxAge}`)
  }
  
  if (config.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`)
  }
  
  if (config.mustRevalidate) {
    directives.push('must-revalidate')
  }
  
  if (config.immutable) {
    directives.push('immutable')
  }
  
  return directives.join(', ')
}

/**
 * Get cache headers for different content types
 */
export function getCacheHeaders(
  contentType: keyof typeof CACHE_STRATEGIES,
  customConfig?: Partial<CacheConfig>
): Record<string, string> {
  const baseConfig = CACHE_STRATEGIES[contentType] as any
  
  // Create a proper CacheConfig object with safe property access
  const config: CacheConfig = {
    maxAge: baseConfig.maxAge,
    sMaxAge: baseConfig.sMaxAge,
    staleWhileRevalidate: baseConfig.staleWhileRevalidate,
    immutable: baseConfig.immutable,
    mustRevalidate: baseConfig.mustRevalidate,
    noCache: baseConfig.noCache,
    noStore: baseConfig.noStore,
    private: baseConfig.private,
    etag: baseConfig.etag,
    // Convert readonly array to mutable array
    vary: baseConfig.vary ? [...baseConfig.vary] : undefined,
    // Override with custom config
    ...customConfig,
  }
  
  const headers: Record<string, string> = {
    'Cache-Control': generateCacheControl(config),
  }
  
  if (config.vary && config.vary.length > 0) {
    headers['Vary'] = config.vary.join(', ')
  }
  
  if (config.etag) {
    headers['ETag'] = `"${Date.now()}-${Math.random().toString(36).substring(2)}"`
  }
  
  return headers
}

/**
 * Content type detection for automatic cache strategy selection
 */
export function detectContentType(pathname: string): keyof typeof CACHE_STRATEGIES {
  // Static assets
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(pathname)) {
    return 'STATIC_ASSETS'
  }
  
  // Fonts
  if (/\.(woff2?|ttf|otf|eot)$/i.test(pathname)) {
    return 'FONTS'
  }
  
  // Service worker
  if (pathname === '/sw.js' || pathname === '/service-worker.js') {
    return 'SERVICE_WORKER'
  }
  
  // Metadata files
  if (/\.(xml|txt|json)$/i.test(pathname) && 
      (pathname.includes('sitemap') || pathname.includes('robots') || pathname.includes('manifest'))) {
    return 'METADATA_FILES'
  }
  
  // API routes
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('/health') || pathname.includes('/status')) {
      return 'HEALTH_CHECK'
    }
    return 'API_NO_CACHE'
  }
  
  // ISR content
  if (pathname.startsWith('/blog/') || pathname.startsWith('/platforms/')) {
    return 'ISR_CONTENT'
  }
  
  // Default to HTML pages
  return 'HTML_PAGES'
}

/**
 * Middleware helper to apply cache headers automatically
 */
export function applyCacheHeaders(
  headers: Headers,
  pathname: string,
  customStrategy?: keyof typeof CACHE_STRATEGIES
): void {
  const contentType = customStrategy || detectContentType(pathname)
  const cacheHeaders = getCacheHeaders(contentType)
  
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })
}

/**
 * CDN-specific headers for Cloudflare, Fastly, etc.
 */
export function getCDNHeaders(pathname: string): Record<string, string> {
  const headers: Record<string, string> = {}
  
  // Cloudflare Cache-Tag for purging
  const tags: string[] = ['all']
  
  if (pathname.startsWith('/blog/')) {
    tags.push('blog', 'content')
    const slug = pathname.split('/blog/')[1]?.split('/')[0]
    if (slug) tags.push(`blog-${slug}`)
  } else if (pathname.startsWith('/platforms/')) {
    tags.push('platforms', 'content')
    const platform = pathname.split('/platforms/')[1]?.split('/')[0]
    if (platform) tags.push(`platform-${platform}`)
  } else if (pathname.startsWith('/api/')) {
    tags.push('api')
  } else if (pathname === '/') {
    tags.push('homepage')
  }
  
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|eot|js|css)$/i.test(pathname)) {
    tags.push('static')
  }
  
  headers['Cache-Tag'] = tags.join(',')
  
  // Cloudflare specific edge cache TTL
  const contentType = detectContentType(pathname)
  const config = CACHE_STRATEGIES[contentType]
  
  if ('sMaxAge' in config && config.sMaxAge !== undefined) {
    headers['CDN-Cache-Control'] = `max-age=${config.sMaxAge}`
  } else if (config.maxAge !== undefined && config.maxAge > 0) {
    headers['CDN-Cache-Control'] = `max-age=${config.maxAge}`
  }
  
  return headers
}

/**
 * Browser cache optimization headers
 */
export function getBrowserOptimizationHeaders(): Record<string, string> {
  return {
    // Resource hints
    'Accept-CH': 'DPR, Width, Viewport-Width, Downlink, ECT, Save-Data',
    'Critical-CH': 'DPR, Width',
    
    // Compression preferences
    'Accept-Encoding': 'br, gzip, deflate',
    
    // Connection optimization
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=5, max=1000',
  }
}

/**
 * Security headers that don't interfere with caching
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
  }
}

/**
 * Performance monitoring headers
 */
export function getPerformanceHeaders(): Record<string, string> {
  return {
    'Server-Timing': [
      'cache;desc="Cache Status"',
      'render;desc="Render Time"',
      'db;desc="Database Time"',
    ].join(', '),
    'Timing-Allow-Origin': '*',
  }
}