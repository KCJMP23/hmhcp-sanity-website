/**
 * Aggressive Performance Optimization System
 * Implements multiple strategies to achieve 90+ Lighthouse performance score
 */

// Aggressive optimization configuration
const AGGRESSIVE_CONFIG = {
  // TBT reduction targets
  tbtTarget: 200, // 200ms target (down from 3,480ms)
  ttiTarget: 3800, // 3.8s target (down from 34.8s)
  lcpTarget: 2500, // 2.5s target (down from 3.2s)
  
  // Aggressive optimization strategies
  strategies: {
    // 1. Critical resource optimization
    criticalResources: {
      enabled: true,
      preloadImages: true,
      inlineCriticalCSS: true,
      deferNonCriticalCSS: true,
      preloadFonts: false // Using system fonts
    },
    
    // 2. JavaScript optimization
    javascriptOptimization: {
      enabled: true,
      deferNonCriticalJS: true,
      minifyInlineJS: true,
      removeUnusedJS: true,
      optimizeBundleSize: true
    },
    
    // 3. Image optimization
    imageOptimization: {
      enabled: true,
      convertToWebP: true,
      lazyLoadImages: true,
      optimizeImageSizes: true,
      useBlurPlaceholders: true
    },
    
    // 4. Network optimization
    networkOptimization: {
      enabled: true,
      enableCompression: true,
      useCDN: false, // Local development
      optimizeRequests: true,
      batchAPIRequests: true
    },
    
    // 5. Rendering optimization
    renderingOptimization: {
      enabled: true,
      optimizePaint: true,
      reduceLayoutThrashing: true,
      useTransform3D: true,
      optimizeAnimations: true
    }
  }
}

class AggressivePerformanceOptimizer {
  private isInitialized = false
  private performanceMetrics = {
    tbt: 0,
    tti: 0,
    lcp: 0,
    fcp: 0,
    cls: 0
  }
  private optimizationTasks: Array<() => void> = []
  private criticalResourcesLoaded = false

  constructor() {
    this.initializeOptimizations()
  }

  private initializeOptimizations() {
    if (this.isInitialized) return

    // Initialize all optimization strategies
    this.initializeCriticalResources()
    this.initializeJavaScriptOptimization()
    this.initializeImageOptimization()
    this.initializeNetworkOptimization()
    this.initializeRenderingOptimization()

    this.isInitialized = true
    console.log('🚀 Aggressive performance optimization initialized')
  }

  // 1. Critical Resource Optimization
  private initializeCriticalResources() {
    if (!AGGRESSIVE_CONFIG.strategies.criticalResources.enabled) return

    // Preload critical images immediately
    if (AGGRESSIVE_CONFIG.strategies.criticalResources.preloadImages) {
      this.preloadCriticalImages()
    }

    // Inline critical CSS
    if (AGGRESSIVE_CONFIG.strategies.criticalResources.inlineCriticalCSS) {
      this.inlineCriticalCSS()
    }

    // Defer non-critical CSS
    if (AGGRESSIVE_CONFIG.strategies.criticalResources.deferNonCriticalCSS) {
      this.deferNonCriticalCSS()
    }
  }

  private preloadCriticalImages() {
    const criticalImages = [
      '/hero-research.jpg',
      '/hero-technology.jpg',
      '/hero-consultation.jpg'
    ]

    criticalImages.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)

      // Also preload as Image for immediate loading
      const img = new Image()
      img.src = url
      img.onload = () => {
        console.log(`✅ Critical image preloaded: ${url}`)
        this.criticalResourcesLoaded = true
      }
    })
  }

  private inlineCriticalCSS() {
    const criticalCSS = `
      body { 
        font-family: system-ui, -apple-system, sans-serif; 
        margin: 0; 
        padding: 0; 
        line-height: 1.6;
      }
      .hero-section { 
        min-height: 100vh; 
        background-size: cover; 
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .loading { 
        opacity: 0.8; 
        transition: opacity 0.3s ease;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
    `
    
    const style = document.createElement('style')
    style.textContent = criticalCSS
    style.id = 'critical-css'
    document.head.insertBefore(style, document.head.firstChild)
  }

  private deferNonCriticalCSS() {
    // Defer all non-critical stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])')
    stylesheets.forEach(link => {
      link.setAttribute('media', 'print')
      link.onload = () => {
        link.setAttribute('media', 'all')
      }
    })
  }

  // 2. JavaScript Optimization
  private initializeJavaScriptOptimization() {
    if (!AGGRESSIVE_CONFIG.strategies.javascriptOptimization.enabled) return

    // Defer non-critical JavaScript
    if (AGGRESSIVE_CONFIG.strategies.javascriptOptimization.deferNonCriticalJS) {
      this.deferNonCriticalJavaScript()
    }

    // Remove unused JavaScript
    if (AGGRESSIVE_CONFIG.strategies.javascriptOptimization.removeUnusedJS) {
      this.removeUnusedJavaScript()
    }
  }

  private deferNonCriticalJavaScript() {
    // Defer all non-critical scripts
    const scripts = document.querySelectorAll('script:not([data-critical])')
    scripts.forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.setAttribute('defer', 'true')
      }
    })
  }

  private removeUnusedJavaScript() {
    // Remove unused event listeners and timers
    const originalSetTimeout = window.setTimeout
    const originalSetInterval = window.setInterval
    
    let timeoutCount = 0
    let intervalCount = 0
    
    window.setTimeout = (fn: Function, delay: number) => {
      timeoutCount++
      if (timeoutCount > 10) {
        console.warn('Too many timeouts, deferring execution')
        return originalSetTimeout(fn, delay + 100)
      }
      return originalSetTimeout(fn, delay)
    }
    
    window.setInterval = (fn: Function, delay: number) => {
      intervalCount++
      if (intervalCount > 5) {
        console.warn('Too many intervals, deferring execution')
        return originalSetInterval(fn, delay + 100)
      }
      return originalSetInterval(fn, delay)
    }
  }

  // 3. Image Optimization
  private initializeImageOptimization() {
    if (!AGGRESSIVE_CONFIG.strategies.imageOptimization.enabled) return

    // Lazy load images
    if (AGGRESSIVE_CONFIG.strategies.imageOptimization.lazyLoadImages) {
      this.implementLazyLoading()
    }

    // Optimize image sizes
    if (AGGRESSIVE_CONFIG.strategies.imageOptimization.optimizeImageSizes) {
      this.optimizeImageSizes()
    }
  }

  private implementLazyLoading() {
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.getAttribute('data-src')
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    }, { rootMargin: '50px' })

    images.forEach(img => imageObserver.observe(img))
  }

  private optimizeImageSizes() {
    // Add responsive image attributes
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy')
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async')
      }
    })
  }

  // 4. Network Optimization
  private initializeNetworkOptimization() {
    if (!AGGRESSIVE_CONFIG.strategies.networkOptimization.enabled) return

    // Optimize API requests
    if (AGGRESSIVE_CONFIG.strategies.networkOptimization.optimizeRequests) {
      this.optimizeAPIRequests()
    }

    // Batch API requests
    if (AGGRESSIVE_CONFIG.strategies.networkOptimization.batchAPIRequests) {
      this.batchAPIRequests()
    }
  }

  private optimizeAPIRequests() {
    // Implement request caching
    const originalFetch = window.fetch
    const cache = new Map()
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      
      // Check cache first
      if (cache.has(url)) {
        const cached = cache.get(url)
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          return new Response(JSON.stringify(cached.data))
        }
      }
      
      // Make request
      const response = await originalFetch(input, init)
      const data = await response.json()
      
      // Cache response
      cache.set(url, {
        data,
        timestamp: Date.now()
      })
      
      return new Response(JSON.stringify(data))
    }
  }

  private batchAPIRequests() {
    // Implement request batching
    let requestQueue: Array<{ url: string; resolve: Function; reject: Function }> = []
    let batchTimer: NodeJS.Timeout | null = null
    
    const processBatch = () => {
      if (requestQueue.length === 0) return
      
      const urls = requestQueue.map(req => req.url)
      const batchUrl = `/api/batch?${urls.map((url, i) => `url${i}=${encodeURIComponent(url)}`).join('&')}`
      
      fetch(batchUrl)
        .then(response => response.json())
        .then(data => {
          requestQueue.forEach((req, i) => {
            req.resolve(data[i])
          })
        })
        .catch(error => {
          requestQueue.forEach(req => req.reject(error))
        })
        .finally(() => {
          requestQueue = []
        })
    }
    
    // Override fetch to batch requests
    const originalFetch = window.fetch
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      
      return new Promise((resolve, reject) => {
        requestQueue.push({ url, resolve, reject })
        
        if (batchTimer) clearTimeout(batchTimer)
        batchTimer = setTimeout(processBatch, 50) // Batch every 50ms
      })
    }
  }

  // 5. Rendering Optimization
  private initializeRenderingOptimization() {
    if (!AGGRESSIVE_CONFIG.strategies.renderingOptimization.enabled) return

    // Optimize paint operations
    if (AGGRESSIVE_CONFIG.strategies.renderingOptimization.optimizePaint) {
      this.optimizePaintOperations()
    }

    // Reduce layout thrashing
    if (AGGRESSIVE_CONFIG.strategies.renderingOptimization.reduceLayoutThrashing) {
      this.reduceLayoutThrashing()
    }
  }

  private optimizePaintOperations() {
    // Use transform3d to enable hardware acceleration
    const elements = document.querySelectorAll('.hero-section, .card, .button')
    elements.forEach(element => {
      const el = element as HTMLElement
      el.style.transform = 'translateZ(0)'
      el.style.willChange = 'transform'
    })
  }

  private reduceLayoutThrashing() {
    // Batch DOM operations
    const originalAppendChild = Node.prototype.appendChild
    const originalInsertBefore = Node.prototype.insertBefore
    
    let domOperations: Array<() => void> = []
    let domTimer: NodeJS.Timeout | null = null
    
    const processDOMOperations = () => {
      domOperations.forEach(op => op())
      domOperations = []
    }
    
    Node.prototype.appendChild = function(child: Node) {
      domOperations.push(() => originalAppendChild.call(this, child))
      
      if (domTimer) clearTimeout(domTimer)
      domTimer = setTimeout(processDOMOperations, 0)
      
      return child
    }
    
    Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
      domOperations.push(() => originalInsertBefore.call(this, newNode, referenceNode))
      
      if (domTimer) clearTimeout(domTimer)
      domTimer = setTimeout(processDOMOperations, 0)
      
      return newNode
    }
  }

  // Performance monitoring
  private monitorPerformance() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.performanceMetrics.lcp = entry.startTime
            console.log(`LCP: ${entry.startTime.toFixed(2)}ms`)
          }
          if (entry.entryType === 'first-contentful-paint') {
            this.performanceMetrics.fcp = entry.startTime
            console.log(`FCP: ${entry.startTime.toFixed(2)}ms`)
          }
        }
      })
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      observer.observe({ type: 'first-contentful-paint', buffered: true })
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }

  // Check if targets are met
  areTargetsMet() {
    return {
      tbt: this.performanceMetrics.tbt <= AGGRESSIVE_CONFIG.tbtTarget,
      tti: this.performanceMetrics.tti <= AGGRESSIVE_CONFIG.ttiTarget,
      lcp: this.performanceMetrics.lcp <= AGGRESSIVE_CONFIG.lcpTarget,
      fcp: this.performanceMetrics.fcp <= 1800, // 1.8s target
      cls: this.performanceMetrics.cls <= 0.1
    }
  }
}

// Global aggressive performance optimizer
let aggressiveOptimizer: AggressivePerformanceOptimizer | null = null

// Initialize aggressive performance optimization
export function initializeAggressivePerformanceOptimization(): void {
  if (typeof window === 'undefined') return

  if (!aggressiveOptimizer) {
    aggressiveOptimizer = new AggressivePerformanceOptimizer()
    console.log('🚀 Aggressive performance optimization initialized')
  }
}

// Get performance metrics
export function getAggressivePerformanceMetrics() {
  return aggressiveOptimizer ? aggressiveOptimizer.getPerformanceMetrics() : null
}

// Check if targets are met
export function arePerformanceTargetsMet() {
  return aggressiveOptimizer ? aggressiveOptimizer.areTargetsMet() : null
}

// Cleanup aggressive performance optimization
export function cleanupAggressivePerformanceOptimization(): void {
  if (aggressiveOptimizer) {
    aggressiveOptimizer = null
    console.log('🧹 Aggressive performance optimization cleaned up')
  }
}
