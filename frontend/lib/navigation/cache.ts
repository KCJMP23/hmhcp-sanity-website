import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger';

const CACHE_TTL = 3600 // 1 hour in seconds
const CACHE_PREFIX = 'nav:'

// Get Redis instance
const redis = getRedis()

interface CachedNavigation {
  id: string
  name: string
  location: string
  status: string
  items: any[]
  cached_at: number
}

export async function getCachedNavigation(navigationId: string): Promise<CachedNavigation | null> {
  try {
    if (!redis) return null
    
    const cached = await redis.get(`${CACHE_PREFIX}${navigationId}`)
    if (!cached) return null
    
    const parsed = JSON.parse(cached) as CachedNavigation
    
    // Check if cache is still valid (within TTL)
    const now = Date.now()
    if (now - parsed.cached_at > CACHE_TTL * 1000) {
      await redis.del(`${CACHE_PREFIX}${navigationId}`)
      return null
    }
    
    return parsed
  } catch (error) {
    logger.error('Failed to get cached navigation:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    return null
  }
}

export async function setCachedNavigation(
  navigationId: string, 
  navigation: Omit<CachedNavigation, 'cached_at'>
): Promise<void> {
  try {
    if (!redis) return
    
    const toCache: CachedNavigation = {
      ...navigation,
      cached_at: Date.now()
    }
    
    await redis.set(
      `${CACHE_PREFIX}${navigationId}`,
      JSON.stringify(toCache),
      { ttl: CACHE_TTL }
    )
  } catch (error) {
    logger.error('Failed to cache navigation:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
  }
}

export async function invalidateNavigationCache(navigationId: string): Promise<void> {
  try {
    if (!redis) return
    
    await redis.del(`${CACHE_PREFIX}${navigationId}`)
    
    // Also invalidate location-based cache
    await invalidateLocationCache()
  } catch (error) {
    logger.error('Failed to invalidate navigation cache:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
  }
}

export async function getCachedNavigationByLocation(location: string): Promise<CachedNavigation | null> {
  try {
    if (!redis) return null
    
    const cached = await redis.get(`${CACHE_PREFIX}location:${location}`)
    if (!cached) return null
    
    const parsed = JSON.parse(cached) as CachedNavigation
    
    // Check if cache is still valid
    const now = Date.now()
    if (now - parsed.cached_at > CACHE_TTL * 1000) {
      await redis.del(`${CACHE_PREFIX}location:${location}`)
      return null
    }
    
    return parsed
  } catch (error) {
    logger.error('Failed to get cached navigation by location:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    return null
  }
}

export async function setCachedNavigationByLocation(
  location: string,
  navigation: Omit<CachedNavigation, 'cached_at'>
): Promise<void> {
  try {
    if (!redis) return
    
    const toCache: CachedNavigation = {
      ...navigation,
      cached_at: Date.now()
    }
    
    await redis.set(
      `${CACHE_PREFIX}location:${location}`,
      JSON.stringify(toCache),
      { ttl: CACHE_TTL }
    )
  } catch (error) {
    logger.error('Failed to cache navigation by location:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
  }
}

export async function invalidateLocationCache(): Promise<void> {
  try {
    if (!redis) return
    
    const locations = ['header', 'footer', 'mobile', 'sidebar']
    const keys = locations.map(loc => `${CACHE_PREFIX}location:${loc}`)
    
    if (keys.length > 0) {
      for (const key of keys) {
        await redis.del(key)
      }
    }
  } catch (error) {
    logger.error('Failed to invalidate location cache:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
  }
}

export async function warmNavigationCache(): Promise<void> {
  try {
    if (!redis) return
    
    // This would be called during deployment or on a schedule
    // to pre-populate frequently accessed navigation data
    logger.info('Navigation cache warming initiated', { action: 'info_logged' })
    
    // Implementation would fetch and cache all active navigations
    // This is a placeholder for the actual implementation
  } catch (error) {
    logger.error('Failed to warm navigation cache:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
  }
}

export async function getNavigationCacheStats(): Promise<{
  totalKeys: number
  memoryUsage: string
  hitRate?: number
}> {
  try {
    if (!redis) {
      return { totalKeys: 0, memoryUsage: '0B' }
    }
    
    // Since this is a mock Redis service, provide fallback values
    const keys: string[] = [] // await redis.keys(`${CACHE_PREFIX}*`)
    const memoryUsage = '0B' // Mock memory usage
    
    return {
      totalKeys: keys.length,
      memoryUsage
    }
  } catch (error) {
    logger.error('Failed to get cache stats:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    return { totalKeys: 0, memoryUsage: '0B' }
  }
}