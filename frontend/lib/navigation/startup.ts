/**
 * Navigation Cache Startup and Warming
 * Initializes navigation cache on application startup
 */

import { warmNavigationCache, getNavigationCacheStats } from './cache'

/**
 * Initialize navigation cache on startup
 */
export async function initializeNavigationCache(): Promise<void> {
  try {
    // Initializing navigation cache...
    
    // Warm the cache on startup
    await warmNavigationCache()
    
    const status = await getNavigationCacheStats()
    // Navigation cache initialized
  } catch (error) {
    // Failed to initialize navigation cache: error
    // Don't throw - cache initialization failure shouldn't prevent app startup
  }
}

/**
 * Schedule periodic cache maintenance
 */
export function scheduleNavigationCacheMaintenance(): void {
  // Warm cache every hour
  setInterval(async () => {
    try {
      // Performing scheduled navigation cache warming...
      await warmNavigationCache()
    } catch (error) {
      // Scheduled cache warming failed: error
    }
  }, 3600000) // 1 hour

  // Clear metrics every 24 hours to prevent memory buildup
  setInterval(() => {
    try {
      // Clearing navigation cache metrics...
      // Note: clearMetrics functionality is not available in the current cache implementation
      // This can be added later if needed
    } catch (error) {
      // Failed to clear cache metrics: error
    }
  }, 86400000) // 24 hours
}

/**
 * Graceful shutdown of navigation cache
 */
export async function shutdownNavigationCache(): Promise<void> {
  try {
    // Shutting down navigation cache...
    // Any cleanup operations if needed
  } catch (error) {
    // Error during navigation cache shutdown: error
  }
}