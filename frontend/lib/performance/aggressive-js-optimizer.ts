/**
 * Aggressive JavaScript Optimizer
 * Implements extreme JavaScript deferral to fix TBT and TTI regressions
 */

// JavaScript optimization configuration
const JS_OPTIMIZATION_CONFIG = {
  // Critical JavaScript that must load immediately
  critical: [
    'react',
    'react-dom',
    'next',
    'next/router',
    'next/link',
    'next/image',
    'next/head'
  ],
  
  // JavaScript that can be deferred
  deferrable: [
    'lucide-react',
    '@radix-ui',
    'framer-motion',
    'react-hook-form',
    'zod',
    'analytics',
    'tracking',
    'gtag',
    'ga'
  ],
  
  // JavaScript that can be lazy loaded
  lazyLoadable: [
    'admin',
    'dashboard',
    'blog',
    'testimonials',
    'footer',
    'widgets'
  ],
  
  // Maximum execution time per chunk (ms)
  maxChunkTime: 5,
  
  // Deferral delays (ms)
  delays: {
    immediate: 0,
    fast: 100,
    normal: 500,
    slow: 1000,
    lazy: 2000
  }
}

// JavaScript execution queue
class JSExecutionQueue {
  private queue: Array<() => void> = []
  private isProcessing = false
  private maxChunkTime = JS_OPTIMIZATION_CONFIG.maxChunkTime
  
  add(execution: () => void, priority: 'high' | 'normal' | 'low' = 'normal') {
    if (priority === 'high') {
      this.queue.unshift(execution)
    } else {
      this.queue.push(execution)
    }
    
    this.processQueue()
  }
  
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return
    
    this.isProcessing = true
    
    while (this.queue.length > 0) {
      const startTime = performance.now()
      
      // Process chunks until max time is reached
      while (this.queue.length > 0 && (performance.now() - startTime) < this.maxChunkTime) {
        const execution = this.queue.shift()
        if (execution) {
          try {
            execution()
          } catch (error) {
            console.error('JavaScript execution error:', error)
          }
        }
      }
      
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    this.isProcessing = false
  }
}

// Singleton execution queue
const executionQueue = new JSExecutionQueue()

// Defer JavaScript execution
export function deferJavaScript(execution: () => void, delay: number = 0) {
  if (delay === 0) {
    executionQueue.add(execution, 'high')
  } else {
    setTimeout(() => {
      executionQueue.add(execution, 'normal')
    }, delay)
  }
}

// Defer all non-critical JavaScript
export function deferAllNonCriticalJS() {
  if (typeof window === 'undefined') return
  
  // Defer all scripts except critical ones
  const scripts = document.querySelectorAll('script[src]')
  
  scripts.forEach(script => {
    const src = script.getAttribute('src') || ''
    const isCritical = JS_OPTIMIZATION_CONFIG.critical.some(critical => 
      src.includes(critical)
    )
    
    if (!isCritical) {
      // Move script to end of body and defer
      script.setAttribute('defer', '')
      script.setAttribute('data-deferred', 'true')
    }
  })
  
  // Defer analytics and tracking scripts
  const analyticsScripts = document.querySelectorAll('script[src*="analytics"], script[src*="gtag"], script[src*="ga"]')
  analyticsScripts.forEach(script => {
    script.setAttribute('defer', '')
    script.setAttribute('data-deferred', 'true')
  })
  
  // Defer third-party widgets
  const widgetScripts = document.querySelectorAll('script[src*="widget"], script[src*="embed"]')
  widgetScripts.forEach(script => {
    script.setAttribute('defer', '')
    script.setAttribute('data-deferred', 'true')
  })
}

// Implement aggressive micro-chunking
export function implementMicroChunking() {
  if (typeof window === 'undefined') return
  
  // Override setTimeout to use micro-chunking
  const originalSetTimeout = window.setTimeout
  window.setTimeout = (callback: Function, delay: number) => {
    if (delay === 0) {
      // Use micro-chunking for immediate execution
      executionQueue.add(() => callback(), 'normal')
      return 0
    }
    return originalSetTimeout(callback, delay)
  }
  
  // Override setInterval to use micro-chunking
  const originalSetInterval = window.setInterval
  window.setInterval = (callback: Function, delay: number) => {
    if (delay === 0) {
      // Use micro-chunking for immediate execution
      executionQueue.add(() => callback(), 'normal')
      return 0
    }
    return originalSetInterval(callback, delay)
  }
}

// Defer heavy computations
export function deferHeavyComputations() {
  if (typeof window === 'undefined') return
  
  // Defer data processing
  const processData = (data: any[], processor: (item: any) => any) => {
    const chunkSize = 10
    let index = 0
    
    const processChunk = () => {
      const chunk = data.slice(index, index + chunkSize)
      chunk.forEach(processor)
      index += chunkSize
      
      if (index < data.length) {
        executionQueue.add(processChunk, 'normal')
      }
    }
    
    processChunk()
  }
  
  // Expose globally
  ;(window as any).processData = processData
}

// Optimize event listeners
export function optimizeEventListeners() {
  if (typeof window === 'undefined') return
  
  // Use passive event listeners where possible
  const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel', 'resize']
  
  passiveEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {}, { passive: true })
  })
  
  // Debounce scroll events aggressively
  let scrollTimeout: NodeJS.Timeout
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      // Handle scroll events here
    }, 16) // ~60fps
  }, { passive: true })
  
  // Debounce resize events
  let resizeTimeout: NodeJS.Timeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      // Handle resize events here
    }, 250)
  }, { passive: true })
}

// Defer API calls
export function deferAPICalls() {
  if (typeof window === 'undefined') return
  
  // Override fetch to defer non-critical API calls
  const originalFetch = window.fetch
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    
    // Check if API call is critical
    const isCritical = url.includes('/api/auth/') || 
                      url.includes('/api/cms/content') ||
                      url.includes('/api/blog/posts')
    
    if (isCritical) {
      return originalFetch(input, init)
    }
    
    // Defer non-critical API calls
    return new Promise((resolve, reject) => {
      executionQueue.add(() => {
        originalFetch(input, init)
          .then(resolve)
          .catch(reject)
      }, 'normal')
    })
  }
}

// Implement progressive loading
export function implementProgressiveLoading() {
  if (typeof window === 'undefined') return
  
  // Load content in stages
  const stages = [
    { delay: JS_OPTIMIZATION_CONFIG.delays.immediate, priority: 'critical' },
    { delay: JS_OPTIMIZATION_CONFIG.delays.fast, priority: 'high' },
    { delay: JS_OPTIMIZATION_CONFIG.delays.normal, priority: 'normal' },
    { delay: JS_OPTIMIZATION_CONFIG.delays.slow, priority: 'low' },
    { delay: JS_OPTIMIZATION_CONFIG.delays.lazy, priority: 'lazy' }
  ]
  
  stages.forEach(stage => {
    setTimeout(() => {
      loadContentByPriority(stage.priority)
    }, stage.delay)
  })
}

// Load content by priority
function loadContentByPriority(priority: string) {
  const elements = document.querySelectorAll(`[data-priority="${priority}"]`)
  
  elements.forEach(element => {
    executionQueue.add(() => {
      element.removeAttribute('data-priority')
      
      // Trigger any lazy loading
      const event = new CustomEvent('load', { detail: { priority } })
      element.dispatchEvent(event)
    }, 'normal')
  })
}

// Remove unused JavaScript
export function removeUnusedJavaScript() {
  if (typeof window === 'undefined') return
  
  // Remove unused modules
  const unusedModules = document.querySelectorAll('script[data-unused]')
  unusedModules.forEach(script => {
    script.remove()
  })
  
  // Remove unused CSS
  const unusedStyles = document.querySelectorAll('link[rel="stylesheet"][data-unused]')
  unusedStyles.forEach(style => {
    style.remove()
  })
  
  // Remove console statements in production
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {}
    window.console = {
      ...window.console,
      log: noop,
      warn: noop,
      error: noop,
      debug: noop,
      info: noop
    }
  }
}

// Monitor JavaScript performance
export function monitorJSPerformance() {
  if (typeof window === 'undefined') return
  
  let totalExecutionTime = 0
  let longTasks = 0
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (entry.entryType === 'longtask') {
        totalExecutionTime += entry.duration
        longTasks++
        
        // If too many long tasks, apply more aggressive optimizations
        if (longTasks > 10) {
          console.warn('Too many long tasks detected, applying aggressive optimizations')
          applyAggressiveOptimizations()
        }
      }
    })
  })
  
  observer.observe({ entryTypes: ['longtask'] })
  
  // Report performance metrics
  setTimeout(() => {
    console.log('JavaScript Performance:', {
      totalExecutionTime: totalExecutionTime.toFixed(2) + 'ms',
      longTasks,
      averageTaskTime: longTasks > 0 ? (totalExecutionTime / longTasks).toFixed(2) + 'ms' : '0ms'
    })
  }, 5000)
}

// Apply aggressive optimizations
function applyAggressiveOptimizations() {
  // Reduce chunk time
  executionQueue['maxChunkTime'] = 2
  
  // Defer more JavaScript
  const scripts = document.querySelectorAll('script:not([defer]):not([async])')
  scripts.forEach(script => {
    if (!script.src.includes('critical') && !script.src.includes('main')) {
      script.setAttribute('defer', '')
    }
  })
  
  // Reduce animation complexity
  const animatedElements = document.querySelectorAll('[style*="animation"], [style*="transition"]')
  animatedElements.forEach(element => {
    const style = (element as HTMLElement).style
    style.animationDuration = '0.05s'
    style.transitionDuration = '0.05s'
  })
}

// Initialize aggressive JavaScript optimization
export function initializeAggressiveJSOptimization() {
  if (typeof window === 'undefined') return
  
  // Defer all non-critical JavaScript
  deferAllNonCriticalJS()
  
  // Implement micro-chunking
  implementMicroChunking()
  
  // Defer heavy computations
  deferHeavyComputations()
  
  // Optimize event listeners
  optimizeEventListeners()
  
  // Defer API calls
  deferAPICalls()
  
  // Implement progressive loading
  implementProgressiveLoading()
  
  // Remove unused JavaScript
  removeUnusedJavaScript()
  
  // Monitor performance
  monitorJSPerformance()
  
  console.log('Aggressive JavaScript optimization initialized')
}

// Export for debugging
export function getJSPerformanceMetrics() {
  if (typeof window === 'undefined') return null
  
  return {
    executionQueue: executionQueue['queue'].length,
    longTasks: performance.getEntriesByType('longtask').length,
    totalExecutionTime: performance.getEntriesByType('longtask')
      .reduce((total, entry) => total + entry.duration, 0)
  }
}
