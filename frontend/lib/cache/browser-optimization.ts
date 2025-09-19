/**
 * Browser caching optimization utilities
 * Enhances client-side caching and performance
 */

export interface BrowserCacheConfig {
  enableServiceWorker?: boolean
  enableLocalStorage?: boolean
  enableSessionStorage?: boolean
  enableIndexedDB?: boolean
  enableMemoryCache?: boolean
  maxCacheSize?: number
  cacheVersioning?: boolean
}

/**
 * Default browser cache configuration
 */
export const DEFAULT_BROWSER_CACHE_CONFIG: BrowserCacheConfig = {
  enableServiceWorker: true,
  enableLocalStorage: true,
  enableSessionStorage: true,
  enableIndexedDB: true,
  enableMemoryCache: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  cacheVersioning: true,
}

/**
 * Cache storage keys
 */
export const CACHE_KEYS = {
  STATIC_ASSETS: 'hm-static-assets-v1',
  API_RESPONSES: 'hm-api-responses-v1',
  USER_PREFERENCES: 'hm-user-preferences',
  NAVIGATION_CACHE: 'hm-navigation-cache',
  CONTENT_CACHE: 'hm-content-cache-v1',
  SEARCH_CACHE: 'hm-search-cache',
} as const

/**
 * Cache duration constants for browser storage
 */
export const BROWSER_CACHE_DURATIONS = {
  IMMEDIATE: 0,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const

/**
 * In-memory cache implementation
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  set(key: string, data: any, ttl = BROWSER_CACHE_DURATIONS.HOUR): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

/**
 * LocalStorage cache with expiration
 */
export class LocalStorageCache {
  private prefix: string

  constructor(prefix = 'hm-cache-') {
    this.prefix = prefix
  }

  set(key: string, data: any, ttl = BROWSER_CACHE_DURATIONS.DAY): void {
    if (typeof window === 'undefined') return

    try {
      const item = {
        data,
        expiry: Date.now() + ttl,
        version: 1,
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error)
    }
  }

  get(key: string): any | null {
    if (typeof window === 'undefined') return null

    try {
      const itemStr = localStorage.getItem(this.prefix + key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      if (Date.now() > item.expiry) {
        this.remove(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn('LocalStorage cache get failed:', error)
      return null
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.prefix + key)
  }

  clear(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }
}

/**
 * IndexedDB cache for large data
 */
export class IndexedDBCache {
  private dbName: string
  private version: number
  private db: IDBDatabase | null = null

  constructor(dbName = 'HMHealthcareCache', version = 1) {
    this.dbName = dbName
    this.version = version
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' })
          store.createIndex('expiry', 'expiry', { unique: false })
        }
      }
    })
  }

  async set(key: string, data: any, ttl = BROWSER_CACHE_DURATIONS.WEEK): Promise<void> {
    if (!this.db) await this.init()
    if (!this.db) return

    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')

    const item = {
      key,
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now(),
    }

    store.put(item)
  }

  async get(key: string): Promise<any | null> {
    if (!this.db) await this.init()
    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)

      request.onsuccess = () => {
        const item = request.result
        if (!item || Date.now() > item.expiry) {
          if (item) this.remove(key)
          resolve(null)
        } else {
          resolve(item.data)
        }
      }

      request.onerror = () => resolve(null)
    })
  }

  async remove(key: string): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')
    store.delete(key)
  }

  async clear(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')
    store.clear()
  }

  async cleanup(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')
    const index = store.index('expiry')
    const range = IDBKeyRange.upperBound(Date.now())
    
    index.openCursor(range).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
  }
}

/**
 * Cache manager that coordinates between different storage mechanisms
 */
export class CacheManager {
  private memoryCache: MemoryCache
  private localStorageCache: LocalStorageCache
  private indexedDBCache: IndexedDBCache
  private config: BrowserCacheConfig

  constructor(config: BrowserCacheConfig = DEFAULT_BROWSER_CACHE_CONFIG) {
    this.config = config
    this.memoryCache = new MemoryCache(100)
    this.localStorageCache = new LocalStorageCache()
    this.indexedDBCache = new IndexedDBCache()
  }

  async init(): Promise<void> {
    if (this.config.enableIndexedDB) {
      await this.indexedDBCache.init()
    }
  }

  /**
   * Smart caching - automatically chooses the best storage method
   */
  async set(
    key: string,
    data: any,
    options: {
      ttl?: number
      priority?: 'high' | 'medium' | 'low'
      size?: 'small' | 'medium' | 'large'
    } = {}
  ): Promise<void> {
    const { ttl = BROWSER_CACHE_DURATIONS.HOUR, priority = 'medium', size = 'small' } = options

    // Always cache in memory for fast access
    if (this.config.enableMemoryCache && priority === 'high') {
      this.memoryCache.set(key, data, ttl)
    }

    // Use appropriate storage based on data size and persistence needs
    if (size === 'large' && this.config.enableIndexedDB) {
      await this.indexedDBCache.set(key, data, ttl)
    } else if (this.config.enableLocalStorage) {
      this.localStorageCache.set(key, data, ttl)
    }
  }

  /**
   * Smart retrieval - checks fastest storage first
   */
  async get(key: string): Promise<any | null> {
    // Check memory cache first
    if (this.config.enableMemoryCache) {
      const memoryData = this.memoryCache.get(key)
      if (memoryData !== null) return memoryData
    }

    // Check localStorage
    if (this.config.enableLocalStorage) {
      const localData = this.localStorageCache.get(key)
      if (localData !== null) {
        // Promote to memory cache for next access
        this.memoryCache.set(key, localData)
        return localData
      }
    }

    // Check IndexedDB
    if (this.config.enableIndexedDB) {
      const idbData = await this.indexedDBCache.get(key)
      if (idbData !== null) {
        // Promote to faster storage
        this.memoryCache.set(key, idbData)
        this.localStorageCache.set(key, idbData)
        return idbData
      }
    }

    return null
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.clear() // Simple clear for memory cache
    this.localStorageCache.remove(key)
    await this.indexedDBCache.remove(key)
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()
    this.localStorageCache.clear()
    await this.indexedDBCache.clear()
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    await this.indexedDBCache.cleanup()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number
    localStorageSize: number
    indexedDBSupported: boolean
  } {
    return {
      memorySize: this.memoryCache['cache'].size,
      localStorageSize: typeof window !== 'undefined' ? 
        Object.keys(localStorage).filter(k => k.startsWith('hm-cache-')).length : 0,
      indexedDBSupported: typeof window !== 'undefined' && 'indexedDB' in window,
    }
  }
}

/**
 * Global cache manager instance
 */
export const cacheManager = new CacheManager()

/**
 * React hook for cache management
 */
export function useBrowserCache() {
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    cacheManager.init().then(() => setIsInitialized(true))
  }, [])

  return {
    cacheManager,
    isInitialized,
    set: cacheManager.set.bind(cacheManager),
    get: cacheManager.get.bind(cacheManager),
    remove: cacheManager.remove.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    stats: cacheManager.getStats(),
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(): void {
  if (typeof window === 'undefined') return

  const criticalResources = [
    // { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' }, // Font doesn't exist
    { href: '/_next/static/css/app.css', as: 'style' },
    { href: '/api/health', as: 'fetch' },
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource.href
    link.as = resource.as
    if (resource.type) {
      (link as any).type = resource.type
    }
    if (resource.as === 'font') {
      link.crossOrigin = 'anonymous'
    }
    document.head.appendChild(link)
  })
}

// Import React for the hook (this would normally be at the top)
import React from 'react'