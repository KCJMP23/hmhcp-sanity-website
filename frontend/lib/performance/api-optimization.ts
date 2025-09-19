/**
 * API Optimization System
 * Focuses on reducing TTI (Time to Interactive) through API call optimization
 */

// API optimization configuration
const API_OPTIMIZATION_CONFIG = {
  // TTI reduction targets
  ttiTarget: 3800, // 3.8s target
  
  // API optimization strategies
  strategies: {
    // 1. Request batching
    requestBatching: {
      enabled: true,
      batchSize: 5,
      batchDelay: 50, // 50ms delay
      maxWaitTime: 200 // 200ms max wait
    },
    
    // 2. Response caching
    responseCaching: {
      enabled: true,
      defaultTTL: 30000, // 30 seconds
      maxCacheSize: 100,
      cacheStrategies: {
        'api/blog/posts': 60000, // 1 minute
        'api/cms/content': 300000, // 5 minutes
        'api/auth/csrf-token': 300000, // 5 minutes
        'api/analytics/web-vitals': 0, // No cache
        'api/track/duration': 0 // No cache
      }
    },
    
    // 3. Request prioritization
    requestPrioritization: {
      enabled: true,
      priorities: {
        critical: ['api/auth/csrf-token', 'api/cms/content'],
        high: ['api/blog/posts'],
        normal: ['api/analytics/web-vitals'],
        low: ['api/track/duration']
      }
    },
    
    // 4. Connection optimization
    connectionOptimization: {
      enabled: true,
      maxConcurrentRequests: 6,
      keepAlive: true,
      compression: true
    }
  }
}

// Request queue item
interface QueuedRequest {
  id: string
  url: string
  options: RequestInit
  priority: number
  resolve: Function
  reject: Function
  timestamp: number
  retries: number
}

// Cached response
interface CachedResponse {
  data: any
  timestamp: number
  ttl: number
  headers: Headers
}

class APIOptimizer {
  private isInitialized = false
  private requestQueue: QueuedRequest[] = []
  private responseCache: Map<string, CachedResponse> = new Map()
  private isProcessing = false
  private processingTimer: NodeJS.Timeout | null = null
  private performanceMetrics = {
    totalRequests: 0,
    cachedRequests: 0,
    batchedRequests: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  }

  constructor() {
    this.initializeOptimizations()
  }

  private initializeOptimizations() {
    if (this.isInitialized) return

    // Initialize all optimization strategies
    this.initializeRequestBatching()
    this.initializeResponseCaching()
    this.initializeRequestPrioritization()
    this.initializeConnectionOptimization()

    this.isInitialized = true
    console.log('🚀 API optimization initialized')
  }

  // 1. Request batching
  private initializeRequestBatching() {
    if (!API_OPTIMIZATION_CONFIG.strategies.requestBatching.enabled) return

    // Override fetch to use batching
    const originalFetch = window.fetch
    window.fetch = this.optimizedFetch.bind(this)
  }

  private async optimizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString()
    
    // Check cache first
    if (this.isCached(url)) {
      return this.getCachedResponse(url)
    }

    // Check if request should be batched
    if (this.shouldBatch(url)) {
      return this.batchRequest(url, init)
    }

    // Make immediate request for critical endpoints
    return this.makeImmediateRequest(url, init)
  }

  private isCached(url: string): boolean {
    if (!API_OPTIMIZATION_CONFIG.strategies.responseCaching.enabled) return false
    
    const cached = this.responseCache.get(url)
    if (!cached) return false
    
    const now = Date.now()
    return now - cached.timestamp < cached.ttl
  }

  private getCachedResponse(url: string): Response {
    const cached = this.responseCache.get(url)!
    this.performanceMetrics.cachedRequests++
    
    return new Response(JSON.stringify(cached.data), {
      headers: cached.headers
    })
  }

  private shouldBatch(url: string): boolean {
    const priorities = API_OPTIMIZATION_CONFIG.strategies.requestPrioritization.priorities
    const isCritical = priorities.critical.some(prefix => url.includes(prefix))
    const isHigh = priorities.high.some(prefix => url.includes(prefix))
    
    return !isCritical && !isHigh
  }

  private async batchRequest(url: string, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substring(7),
        url,
        options: init || {},
        priority: this.getRequestPriority(url),
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0
      }

      this.requestQueue.push(request)
      this.scheduleProcessing()
    })
  }

  private getRequestPriority(url: string): number {
    const priorities = API_OPTIMIZATION_CONFIG.strategies.requestPrioritization.priorities
    
    if (priorities.critical.some(prefix => url.includes(prefix))) return 0
    if (priorities.high.some(prefix => url.includes(prefix))) return 1
    if (priorities.normal.some(prefix => url.includes(prefix))) return 2
    return 3
  }

  private scheduleProcessing() {
    if (this.isProcessing) return

    this.isProcessing = true
    this.processingTimer = setTimeout(() => {
      this.processRequestQueue()
    }, API_OPTIMIZATION_CONFIG.strategies.requestBatching.batchDelay)
  }

  private async processRequestQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessing = false
      return
    }

    // Sort by priority
    this.requestQueue.sort((a, b) => a.priority - b.priority)

    // Process batch
    const batchSize = Math.min(
      API_OPTIMIZATION_CONFIG.strategies.requestBatching.batchSize,
      this.requestQueue.length
    )

    const batch = this.requestQueue.splice(0, batchSize)
    this.performanceMetrics.batchedRequests += batch.length

    // Process batch requests
    const promises = batch.map(request => this.processRequest(request))
    await Promise.allSettled(promises)

    // Schedule next batch if there are more requests
    if (this.requestQueue.length > 0) {
      this.scheduleProcessing()
    } else {
      this.isProcessing = false
    }
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    try {
      const startTime = performance.now()
      const response = await this.makeImmediateRequest(request.url, request.options)
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      this.performanceMetrics.totalResponseTime += responseTime
      this.performanceMetrics.totalRequests++
      this.performanceMetrics.averageResponseTime = 
        this.performanceMetrics.totalResponseTime / this.performanceMetrics.totalRequests

      // Cache response if appropriate
      if (this.shouldCache(request.url)) {
        const data = await response.json()
        this.cacheResponse(request.url, data, response.headers)
      }

      request.resolve(response)
    } catch (error) {
      if (request.retries < 3) {
        request.retries++
        this.requestQueue.push(request)
      } else {
        request.reject(error)
      }
    }
  }

  private async makeImmediateRequest(url: string, init?: RequestInit): Promise<Response> {
    const startTime = performance.now()
    const response = await fetch(url, init)
    const endTime = performance.now()
    
    const responseTime = endTime - startTime
    this.performanceMetrics.totalResponseTime += responseTime
    this.performanceMetrics.totalRequests++
    this.performanceMetrics.averageResponseTime = 
      this.performanceMetrics.totalResponseTime / this.performanceMetrics.totalRequests

    return response
  }

  // 2. Response caching
  private initializeResponseCaching() {
    if (!API_OPTIMIZATION_CONFIG.strategies.responseCaching.enabled) return

    // Initialize cache cleanup
    setInterval(() => {
      this.cleanupCache()
    }, 60000) // Cleanup every minute
  }

  private shouldCache(url: string): boolean {
    if (!API_OPTIMIZATION_CONFIG.strategies.responseCaching.enabled) return false
    
    const strategies = API_OPTIMIZATION_CONFIG.strategies.responseCaching.cacheStrategies
    return Object.keys(strategies).some(prefix => url.includes(prefix))
  }

  private cacheResponse(url: string, data: any, headers: Headers): void {
    const strategies = API_OPTIMIZATION_CONFIG.strategies.responseCaching.cacheStrategies
    const ttl = Object.entries(strategies).find(([prefix]) => url.includes(prefix))?.[1] || 
                API_OPTIMIZATION_CONFIG.strategies.responseCaching.defaultTTL

    this.responseCache.set(url, {
      data,
      timestamp: Date.now(),
      ttl,
      headers
    })

    // Limit cache size
    if (this.responseCache.size > API_OPTIMIZATION_CONFIG.strategies.responseCaching.maxCacheSize) {
      const firstKey = this.responseCache.keys().next().value
      this.responseCache.delete(firstKey)
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [url, cached] of this.responseCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.responseCache.delete(url)
      }
    }
  }

  // 3. Request prioritization
  private initializeRequestPrioritization() {
    if (!API_OPTIMIZATION_CONFIG.strategies.requestPrioritization.enabled) return

    // Request prioritization is handled in the batching system
    console.log('Request prioritization initialized')
  }

  // 4. Connection optimization
  private initializeConnectionOptimization() {
    if (!API_OPTIMIZATION_CONFIG.strategies.connectionOptimization.enabled) return

    // Connection optimization is handled by the browser and server
    console.log('Connection optimization initialized')
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cacheSize: this.responseCache.size,
      maxCacheSize: API_OPTIMIZATION_CONFIG.strategies.responseCaching.maxCacheSize,
      hitRate: this.performanceMetrics.cachedRequests / Math.max(this.performanceMetrics.totalRequests, 1)
    }
  }

  // Clear cache
  clearCache() {
    this.responseCache.clear()
  }

  // Cleanup
  destroy() {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
      this.processingTimer = null
    }
    
    this.requestQueue = []
    this.responseCache.clear()
    this.isProcessing = false
  }
}

// Global API optimizer
let apiOptimizer: APIOptimizer | null = null

// Initialize API optimization
export function initializeAPIOptimization(): void {
  if (typeof window === 'undefined') return

  if (!apiOptimizer) {
    apiOptimizer = new APIOptimizer()
    console.log('🚀 API optimization initialized')
  }
}

// Get performance metrics
export function getAPIOptimizationMetrics() {
  return apiOptimizer ? apiOptimizer.getPerformanceMetrics() : null
}

// Get cache statistics
export function getAPICacheStats() {
  return apiOptimizer ? apiOptimizer.getCacheStats() : null
}

// Clear cache
export function clearAPICache() {
  if (apiOptimizer) {
    apiOptimizer.clearCache()
  }
}

// Cleanup API optimization
export function cleanupAPIOptimization(): void {
  if (apiOptimizer) {
    apiOptimizer.destroy()
    apiOptimizer = null
    console.log('🧹 API optimization cleaned up')
  }
}
