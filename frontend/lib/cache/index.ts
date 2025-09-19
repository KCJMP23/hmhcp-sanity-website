/**
 * Cache utilities index
 * Central export point for all caching functionality
 */

// Header utilities
export {
  CACHE_DURATIONS,
  CACHE_STRATEGIES,
  generateCacheControl,
  getCacheHeaders,
  detectContentType,
  applyCacheHeaders,
  getCDNHeaders,
  getBrowserOptimizationHeaders,
  getSecurityHeaders,
  getPerformanceHeaders,
} from './headers'

// API response utilities
export {
  createCachedResponse,
  createStaticDataResponse,
  createDynamicDataResponse,
  createPrivateDataResponse,
  createHealthCheckResponse,
  createConditionalResponse,
  createCompressedResponse,
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  generateContentETag,
  withCaching,
} from './api-response'

// ISR configuration
export {
  ISR_CONFIGS,
  API_ISR_CONFIGS,
  CACHE_WARMING_STRATEGY,
  generateISRExport,
  getDynamicISRConfig,
  generateCacheTags,
  getSmartRevalidation,
  generateISRMetadata,
  withISR,
  scheduleBackgroundRevalidation,
  trackISRPerformance,
} from './isr-config'

// Browser optimization
export {
  DEFAULT_BROWSER_CACHE_CONFIG,
  CACHE_KEYS,
  BROWSER_CACHE_DURATIONS,
  LocalStorageCache,
  IndexedDBCache,
  CacheManager,
  cacheManager,
  useBrowserCache,
  preloadCriticalResources,
} from './browser-optimization'

// Type definitions
export type { 
  CacheConfig,
} from './headers'

export type { ApiCacheConfig } from './api-response'
export type { ISRConfig, ISRAnalytics } from './isr-config'
export type { BrowserCacheConfig } from './browser-optimization'