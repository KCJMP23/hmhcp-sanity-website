/**
 * Final Performance Optimizations
 * Targeted fixes for specific performance issues identified in logs
 */

// Final optimization configuration
const FINAL_OPTIMIZATION_CONFIG = {
  // API optimization
  apiOptimization: {
    enabled: true,
    cacheTime: 30000, // 30 seconds
    maxRetries: 3,
    timeout: 5000, // 5 seconds
    batchSize: 5
  },
  
  // Resource optimization
  resourceOptimization: {
    enabled: true,
    preloadCritical: true,
    deferNonCritical: true,
    optimizeImages: true
  },
  
  // JavaScript optimization
  jsOptimization: {
    enabled: true,
    deferNonCritical: true,
    optimizeChunks: true,
    removeUnused: true
  }
}

class FinalOptimizer {
  private isInitialized = false
  private apiCache: Map<string, { data: any; timestamp: number }> = new Map()
  private performanceMetrics = {
    apiCalls: 0,
    cachedResponses: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    errors: 0
  }

  constructor() {
    this.initializeOptimizations()
  }

  private initializeOptimizations() {
    if (this.isInitialized) return

    // Initialize all optimization strategies
    this.optimizeAPIResponses()
    this.optimizeResourceLoading()
    this.optimizeJavaScript()
    this.optimizeImages()
    this.optimizeFonts()

    this.isInitialized = true
    console.log('🎯 Final optimizations initialized')
  }

  // 1. Optimize API responses
  private optimizeAPIResponses() {
    if (!FINAL_OPTIMIZATION_CONFIG.apiOptimization.enabled) return

    const originalFetch = window.fetch
    const cache = this.apiCache

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      const startTime = performance.now()

      // Check cache first
      if (cache.has(url)) {
        const cached = cache.get(url)!
        if (Date.now() - cached.timestamp < FINAL_OPTIMIZATION_CONFIG.apiOptimization.cacheTime) {
          this.performanceMetrics.cachedResponses++
          return new Response(JSON.stringify(cached.data))
        }
      }

      try {
        // Make request with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FINAL_OPTIMIZATION_CONFIG.apiOptimization.timeout)

        const response = await originalFetch(input, {
          ...init,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const endTime = performance.now()
        const responseTime = endTime - startTime

        // Update metrics
        this.performanceMetrics.apiCalls++
        this.performanceMetrics.totalResponseTime += responseTime
        this.performanceMetrics.averageResponseTime = 
          this.performanceMetrics.totalResponseTime / this.performanceMetrics.apiCalls

        // Cache successful responses
        if (response.ok) {
          cache.set(url, {
            data,
            timestamp: Date.now()
          })
        }

        return new Response(JSON.stringify(data))
      } catch (error) {
        this.performanceMetrics.errors++
        console.error('API request failed:', error)
        throw error
      }
    }
  }

  // 2. Optimize resource loading
  private optimizeResourceLoading() {
    if (!FINAL_OPTIMIZATION_CONFIG.resourceOptimization.enabled) return

    // Preload critical resources
    if (FINAL_OPTIMIZATION_CONFIG.resourceOptimization.preloadCritical) {
      this.preloadCriticalResources()
    }

    // Defer non-critical resources
    if (FINAL_OPTIMIZATION_CONFIG.resourceOptimization.deferNonCritical) {
      this.deferNonCriticalResources()
    }
  }

  private preloadCriticalResources() {
    const criticalResources = [
      '/hero-research.jpg',
      '/hero-technology.jpg',
      '/hero-consultation.jpg',
      '/_next/static/css/app/layout.css'
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      
      if (resource.endsWith('.css')) {
        link.as = 'style'
      } else if (resource.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
        link.as = 'image'
      } else {
        link.as = 'script'
      }
      
      link.href = resource
      document.head.appendChild(link)
    })
  }

  private deferNonCriticalResources() {
    // Defer non-critical API calls
    const nonCriticalAPIs = [
      // '/api/blog/posts', // Removed - handled by component hooks
      '/api/cms/content',
      '/api/track/duration'
    ]

    nonCriticalAPIs.forEach(api => {
      setTimeout(() => {
        fetch(api, { method: 'HEAD' }).catch(() => {})
      }, 2000)
    })
  }

  // 3. Optimize JavaScript
  private optimizeJavaScript() {
    if (!FINAL_OPTIMIZATION_CONFIG.jsOptimization.enabled) return

    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script:not([data-critical])')
    scripts.forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.setAttribute('defer', 'true')
      }
    })

    // Optimize chunk loading
    this.optimizeChunkLoading()
  }

  private optimizeChunkLoading() {
    // Preload critical chunks
    const criticalChunks = [
      '/_next/static/chunks/webpack.js',
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/pages/_app.js'
    ]

    criticalChunks.forEach(chunk => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = chunk
      document.head.appendChild(link)
    })
  }

  // 4. Optimize images
  private optimizeImages() {
    if (!FINAL_OPTIMIZATION_CONFIG.resourceOptimization.optimizeImages) return

    // Add loading attributes to images
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy')
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async')
      }
    })

    // Optimize hero images for LCP
    const heroImages = document.querySelectorAll('img[src*="hero-"]')
    heroImages.forEach(img => {
      img.setAttribute('fetchpriority', 'high')
      img.setAttribute('loading', 'eager')
    })
  }

  // 5. Optimize fonts
  private optimizeFonts() {
    // Remove any references to missing fonts
    const fontLinks = document.querySelectorAll('link[href*="inter-var"]')
    fontLinks.forEach(link => {
      link.remove()
    })

    // Ensure system fonts are used
    const style = document.createElement('style')
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        font-display: swap;
      }
    `
    document.head.appendChild(style)
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }

  // Clear cache
  clearCache() {
    this.apiCache.clear()
  }
}

// Global final optimizer
let finalOptimizer: FinalOptimizer | null = null

// Initialize final optimizations
export function initializeFinalOptimizations(): void {
  if (typeof window === 'undefined') return

  if (!finalOptimizer) {
    finalOptimizer = new FinalOptimizer()
    console.log('🎯 Final optimizations initialized')
  }
}

// Get performance metrics
export function getFinalOptimizationMetrics() {
  return finalOptimizer ? finalOptimizer.getPerformanceMetrics() : null
}

// Clear cache
export function clearFinalOptimizationCache() {
  if (finalOptimizer) {
    finalOptimizer.clearCache()
  }
}

// Cleanup final optimizations
export function cleanupFinalOptimizations(): void {
  if (finalOptimizer) {
    finalOptimizer = null
    console.log('🧹 Final optimizations cleaned up')
  }
}
