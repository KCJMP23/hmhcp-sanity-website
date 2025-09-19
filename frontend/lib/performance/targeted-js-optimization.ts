/**
 * Targeted JavaScript Optimization System
 * Focuses on reducing TBT (Total Blocking Time) and TTI (Time to Interactive)
 */

// Targeted optimization configuration
const TARGETED_OPTIMIZATION_CONFIG = {
  // TBT reduction targets
  tbtTarget: 200, // 200ms target
  ttiTarget: 3800, // 3.8s target
  
  // JavaScript optimization strategies
  strategies: {
    // 1. Defer non-critical JavaScript
    deferNonCriticalJS: {
      enabled: true,
      maxDeferTime: 100, // 100ms max defer time
      criticalSelectors: ['[data-critical]', '.hero-section', '.navigation']
    },
    
    // 2. Optimize event listeners
    optimizeEventListeners: {
      enabled: true,
      usePassiveListeners: true,
      debounceScroll: 16, // 16ms debounce
      debounceResize: 100 // 100ms debounce
    },
    
    // 3. Optimize timers and intervals
    optimizeTimers: {
      enabled: true,
      maxTimeouts: 5,
      maxIntervals: 3,
      deferNonCritical: true
    },
    
    // 4. Optimize DOM operations
    optimizeDOM: {
      enabled: true,
      batchOperations: true,
      useDocumentFragment: true,
      minimizeReflows: true
    },
    
    // 5. Optimize API calls
    optimizeAPI: {
      enabled: true,
      batchRequests: true,
      cacheResponses: true,
      maxCacheTime: 30000 // 30 seconds
    }
  }
}

class TargetedJSOptimizer {
  private isInitialized = false
  private deferredScripts: Set<string> = new Set()
  private eventListeners: Map<string, Function> = new Map()
  private apiCache: Map<string, { data: any; timestamp: number }> = new Map()
  private domOperations: Array<() => void> = []
  private domTimer: NodeJS.Timeout | null = null
  private performanceMetrics = {
    tbt: 0,
    tti: 0,
    deferredScripts: 0,
    optimizedEvents: 0,
    cachedAPIs: 0
  }

  constructor() {
    this.initializeOptimizations()
  }

  private initializeOptimizations() {
    if (this.isInitialized) return

    // Initialize all optimization strategies
    this.initializeDeferNonCriticalJS()
    this.initializeEventOptimization()
    this.initializeTimerOptimization()
    this.initializeDOMOptimization()
    this.initializeAPIOptimization()
    this.initializePerformanceMonitoring()

    this.isInitialized = true
    console.log('🎯 Targeted JS optimization initialized')
  }

  // 1. Defer non-critical JavaScript
  private initializeDeferNonCriticalJS() {
    if (!TARGETED_OPTIMIZATION_CONFIG.strategies.deferNonCriticalJS.enabled) return

    // Defer all non-critical scripts
    const scripts = document.querySelectorAll('script:not([data-critical])')
    scripts.forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.setAttribute('defer', 'true')
        this.performanceMetrics.deferredScripts++
      }
    })

    // Defer non-critical inline scripts
    const inlineScripts = document.querySelectorAll('script:not([data-critical])')
    inlineScripts.forEach(script => {
      if (script.textContent && !script.hasAttribute('data-critical')) {
        this.deferInlineScript(script)
      }
    })
  }

  private deferInlineScript(script: HTMLScriptElement) {
    const content = script.textContent
    if (!content) return

    // Create a new script element with defer
    const newScript = document.createElement('script')
    newScript.setAttribute('defer', 'true')
    newScript.textContent = content
    
    // Replace the original script
    script.parentNode?.replaceChild(newScript, script)
    this.performanceMetrics.deferredScripts++
  }

  // 2. Optimize event listeners
  private initializeEventOptimization() {
    if (!TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeEventListeners.enabled) return

    // Optimize scroll events
    this.optimizeScrollEvents()
    
    // Optimize resize events
    this.optimizeResizeEvents()
    
    // Optimize click events
    this.optimizeClickEvents()
  }

  private optimizeScrollEvents() {
    let scrollTimer: NodeJS.Timeout | null = null
    const debounceTime = TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeEventListeners.debounceScroll

    const optimizedScrollHandler = () => {
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        // Handle scroll events
        this.performanceMetrics.optimizedEvents++
      }, debounceTime)
    }

    // Use passive listeners for better performance
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true })
    this.eventListeners.set('scroll', optimizedScrollHandler)
  }

  private optimizeResizeEvents() {
    let resizeTimer: NodeJS.Timeout | null = null
    const debounceTime = TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeEventListeners.debounceResize

    const optimizedResizeHandler = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        // Handle resize events
        this.performanceMetrics.optimizedEvents++
      }, debounceTime)
    }

    window.addEventListener('resize', optimizedResizeHandler, { passive: true })
    this.eventListeners.set('resize', optimizedResizeHandler)
  }

  private optimizeClickEvents() {
    // Use event delegation for better performance
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      
      // Handle different types of clicks
      if (target.matches('[data-optimize-click]')) {
        this.handleOptimizedClick(target, event)
      }
    }, { passive: true })
  }

  private handleOptimizedClick(element: HTMLElement, event: Event) {
    // Optimize click handling
    event.preventDefault()
    
    // Defer non-critical click actions
    setTimeout(() => {
      // Handle click action
      this.performanceMetrics.optimizedEvents++
    }, 0)
  }

  // 3. Optimize timers and intervals
  private initializeTimerOptimization() {
    if (!TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeTimers.enabled) return

    this.optimizeSetTimeout()
    this.optimizeSetInterval()
  }

  private optimizeSetTimeout() {
    const originalSetTimeout = window.setTimeout
    let timeoutCount = 0

    window.setTimeout = (fn: Function, delay: number) => {
      timeoutCount++
      
      if (timeoutCount > TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeTimers.maxTimeouts) {
        // Defer non-critical timeouts
        delay += 100
      }
      
      return originalSetTimeout(fn, delay)
    }
  }

  private optimizeSetInterval() {
    const originalSetInterval = window.setInterval
    let intervalCount = 0

    window.setInterval = (fn: Function, delay: number) => {
      intervalCount++
      
      if (intervalCount > TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeTimers.maxIntervals) {
        // Defer non-critical intervals
        delay += 100
      }
      
      return originalSetInterval(fn, delay)
    }
  }

  // 4. Optimize DOM operations
  private initializeDOMOptimization() {
    if (!TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeDOM.enabled) return

    this.optimizeDOMOperations()
  }

  private optimizeDOMOperations() {
    // Batch DOM operations
    const originalAppendChild = Node.prototype.appendChild
    const originalInsertBefore = Node.prototype.insertBefore

    Node.prototype.appendChild = function(child: Node) {
      if (TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeDOM.batchOperations) {
        this.batchDOMOperation(() => originalAppendChild.call(this, child))
      } else {
        return originalAppendChild.call(this, child)
      }
      return child
    }

    Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
      if (TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeDOM.batchOperations) {
        this.batchDOMOperation(() => originalInsertBefore.call(this, newNode, referenceNode))
      } else {
        return originalInsertBefore.call(this, newNode, referenceNode)
      }
      return newNode
    }
  }

  private batchDOMOperation(operation: () => void) {
    this.domOperations.push(operation)
    
    if (this.domTimer) clearTimeout(this.domTimer)
    this.domTimer = setTimeout(() => {
      this.processDOMOperations()
    }, 0)
  }

  private processDOMOperations() {
    if (this.domOperations.length === 0) return

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment()
    
    this.domOperations.forEach(operation => {
      try {
        operation()
      } catch (error) {
        console.error('DOM operation error:', error)
      }
    })
    
    this.domOperations = []
  }

  // 5. Optimize API calls
  private initializeAPIOptimization() {
    if (!TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeAPI.enabled) return

    this.optimizeFetch()
  }

  private optimizeFetch() {
    const originalFetch = window.fetch
    const cache = this.apiCache

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      
      // Check cache first
      if (cache.has(url)) {
        const cached = cache.get(url)!
        if (Date.now() - cached.timestamp < TARGETED_OPTIMIZATION_CONFIG.strategies.optimizeAPI.maxCacheTime) {
          this.performanceMetrics.cachedAPIs++
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

  // Performance monitoring
  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.performanceMetrics.tbt += entry.duration
            console.log(`Long task detected: ${entry.duration.toFixed(2)}ms`)
          }
        }
      })

      observer.observe({ type: 'longtask', buffered: true })
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error)
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }

  // Check if targets are met
  areTargetsMet() {
    return {
      tbt: this.performanceMetrics.tbt <= TARGETED_OPTIMIZATION_CONFIG.tbtTarget,
      tti: this.performanceMetrics.tti <= TARGETED_OPTIMIZATION_CONFIG.ttiTarget,
      deferredScripts: this.performanceMetrics.deferredScripts,
      optimizedEvents: this.performanceMetrics.optimizedEvents,
      cachedAPIs: this.performanceMetrics.cachedAPIs
    }
  }

  // Cleanup
  destroy() {
    // Remove event listeners
    this.eventListeners.forEach((handler, event) => {
      window.removeEventListener(event, handler as EventListener)
    })
    this.eventListeners.clear()

    // Clear timers
    if (this.domTimer) {
      clearTimeout(this.domTimer)
      this.domTimer = null
    }

    // Clear cache
    this.apiCache.clear()
    this.domOperations = []
  }
}

// Global targeted JS optimizer
let targetedOptimizer: TargetedJSOptimizer | null = null

// Initialize targeted JS optimization
export function initializeTargetedJSOptimization(): void {
  if (typeof window === 'undefined') return

  if (!targetedOptimizer) {
    targetedOptimizer = new TargetedJSOptimizer()
    console.log('🎯 Targeted JS optimization initialized')
  }
}

// Get performance metrics
export function getTargetedJSMetrics() {
  return targetedOptimizer ? targetedOptimizer.getPerformanceMetrics() : null
}

// Check if targets are met
export function areTargetedJSTargetsMet() {
  return targetedOptimizer ? targetedOptimizer.areTargetsMet() : null
}

// Cleanup targeted JS optimization
export function cleanupTargetedJSOptimization(): void {
  if (targetedOptimizer) {
    targetedOptimizer.destroy()
    targetedOptimizer = null
    console.log('🧹 Targeted JS optimization cleaned up')
  }
}
