/**
 * Advanced Service Worker for Performance Optimization
 * Implements aggressive caching strategies to improve Speed Index and overall performance
 */

const CACHE_NAME = 'hmhcp-v1.0.0'
const STATIC_CACHE = 'hmhcp-static-v1.0.0'
const DYNAMIC_CACHE = 'hmhcp-dynamic-v1.0.0'
const API_CACHE = 'hmhcp-api-v1.0.0'

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/,
    strategy: 'cacheFirst',
    maxAge: 31536000, // 1 year
  },
  
  // API responses - stale while revalidate
  api: {
    pattern: /^\/api\//,
    strategy: 'staleWhileRevalidate',
    maxAge: 300, // 5 minutes
  },
  
  // HTML pages - network first
  html: {
    pattern: /\.html$|\/$/,
    strategy: 'networkFirst',
    maxAge: 3600, // 1 hour
  },
  
  // Images - cache first with fallback
  images: {
    pattern: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
    strategy: 'cacheFirst',
    maxAge: 86400, // 1 day
  }
}

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/hero-research.jpg',
  '/hero-technology.jpg',
  '/hero-consultation.jpg',
  '/hmhcp-logo-white-real.svg',
  '/hmhcp-logo-black.svg'
]

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching critical resources...')
        return cache.addAll(CRITICAL_RESOURCES)
      })
      .then(() => {
        console.log('Critical resources cached successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Failed to cache critical resources:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Determine cache strategy based on URL pattern
  const strategy = getCacheStrategy(url.pathname)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Get cache strategy for a given path
function getCacheStrategy(pathname) {
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(pathname)) {
      return { name, ...config }
    }
  }
  
  // Default strategy for unknown resources
  return {
    name: 'default',
    strategy: 'networkFirst',
    maxAge: 3600
  }
}

// Handle request based on cache strategy
async function handleRequest(request, strategy) {
  const cacheName = getCacheName(strategy.name)
  
  try {
    switch (strategy.strategy) {
      case 'cacheFirst':
        return await cacheFirst(request, cacheName, strategy.maxAge)
      
      case 'networkFirst':
        return await networkFirst(request, cacheName, strategy.maxAge)
      
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request, cacheName, strategy.maxAge)
      
      default:
        return await networkFirst(request, cacheName, strategy.maxAge)
    }
  } catch (error) {
    console.error('Cache strategy failed:', error)
    return fetch(request)
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Check if cache is still valid
    if (isCacheValid(cachedResponse, maxAge)) {
      return cachedResponse
    }
  }
  
  // Cache miss or expired - fetch from network
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone()
      cache.put(request, responseToCache)
    }
    
    return networkResponse
  } catch (error) {
    // Return cached response if network fails
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Network first strategy
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone()
      cache.put(request, responseToCache)
    }
    
    return networkResponse
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse && isCacheValid(cachedResponse, maxAge)) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Always try to update cache in background
  const networkPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone()
      cache.put(request, responseToCache)
    }
    return networkResponse
  }).catch(() => null)
  
  // Return cached response immediately if available and valid
  if (cachedResponse && isCacheValid(cachedResponse, maxAge)) {
    // Update cache in background
    networkPromise.catch(() => {})
    return cachedResponse
  }
  
  // No valid cache - wait for network
  return networkPromise || cachedResponse || new Response('Not found', { status: 404 })
}

// Get cache name based on strategy
function getCacheName(strategyName) {
  switch (strategyName) {
    case 'static':
      return STATIC_CACHE
    case 'api':
      return API_CACHE
    case 'images':
      return STATIC_CACHE
    default:
      return DYNAMIC_CACHE
  }
}

// Check if cached response is still valid
function isCacheValid(response, maxAge) {
  if (!response) return false
  
  const cachedDate = response.headers.get('sw-cached-date')
  if (!cachedDate) return true // Assume valid if no date
  
  const age = Date.now() - parseInt(cachedDate)
  return age < maxAge * 1000
}

// Add cache date to response headers
function addCacheDate(response) {
  const headers = new Headers(response.headers)
  headers.set('sw-cached-date', Date.now().toString())
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Background sync implementation
async function doBackgroundSync() {
  console.log('Performing background sync...')
  
  // Sync any pending requests
  const cache = await caches.open(DYNAMIC_CACHE)
  const requests = await cache.keys()
  
  for (const request of requests) {
    try {
      await fetch(request)
      console.log('Synced request:', request.url)
    } catch (error) {
      console.error('Failed to sync request:', request.url, error)
    }
  }
}

// Push notifications (if needed)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'hmhcp-notification'
      })
    )
  }
})

// Message handling for cache management
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches())
  }
})

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  
  console.log('All caches cleared')
}

console.log('Service Worker loaded successfully')