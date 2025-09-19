/**
 * Speed Index Optimizer
 * Addresses Speed Index regression and improves visual completeness
 */

// Speed Index optimization configuration
const SPEED_INDEX_CONFIG = {
  // Critical rendering path optimization
  criticalPath: {
    // Above-the-fold content that must render first
    aboveFold: [
      'header',
      'nav',
      '.hero-section',
      '.hero-slideshow',
      '.hero-content',
      '.hero-title',
      '.hero-subtitle',
      '.hero-cta'
    ],
    
    // Below-the-fold content that can be deferred
    belowFold: [
      '.blog-section',
      '.testimonials',
      '.footer',
      '.admin-dashboard',
      '.performance-dashboard'
    ]
  },
  
  // Progressive loading thresholds
  loadingThresholds: {
    immediate: 0,      // Load immediately
    fast: 100,         // Load within 100ms
    normal: 500,       // Load within 500ms
    slow: 1000,        // Load within 1000ms
    lazy: 2000         // Load after 2000ms
  },
  
  // Visual completeness targets
  completenessTargets: {
    '25%': 500,        // 25% complete within 500ms
    '50%': 1000,       // 50% complete within 1000ms
    '75%': 2000,       // 75% complete within 2000ms
    '100%': 3000       // 100% complete within 3000ms
  }
}

// Speed Index monitoring
class SpeedIndexMonitor {
  private startTime: number = 0
  private renderTimes: Map<string, number> = new Map()
  private completenessChecks: number[] = []
  
  constructor() {
    this.startTime = performance.now()
    this.startMonitoring()
  }
  
  private startMonitoring(): void {
    if (typeof window === 'undefined') return
    
    // Monitor DOM mutations
    this.observeDOMMutations()
    
    // Monitor visual completeness
    this.observeVisualCompleteness()
    
    // Monitor resource loading
    this.observeResourceLoading()
  }
  
  private observeDOMMutations(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              const selector = this.getElementSelector(element)
              if (selector) {
                this.recordRenderTime(selector)
              }
            }
          })
        }
      })
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
  
  private observeVisualCompleteness(): void {
    // Check visual completeness at regular intervals
    const checkInterval = 100 // Check every 100ms
    
    const checkCompleteness = () => {
      const completeness = this.calculateVisualCompleteness()
      this.completenessChecks.push(completeness)
      
      // Log progress
      if (completeness >= 0.25 && !this.renderTimes.has('25%')) {
        this.recordRenderTime('25%')
      }
      if (completeness >= 0.5 && !this.renderTimes.has('50%')) {
        this.recordRenderTime('50%')
      }
      if (completeness >= 0.75 && !this.renderTimes.has('75%')) {
        this.recordRenderTime('75%')
      }
      if (completeness >= 1.0 && !this.renderTimes.has('100%')) {
        this.recordRenderTime('100%')
      }
    }
    
    const interval = setInterval(checkCompleteness, checkInterval)
    
    // Stop monitoring after 10 seconds
    setTimeout(() => {
      clearInterval(interval)
      this.generateSpeedIndexReport()
    }, 10000)
  }
  
  private observeResourceLoading(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming
          this.recordResourceLoadTime(resource.name, resource.responseEnd - resource.startTime)
        }
      })
    })
    
    observer.observe({ entryTypes: ['resource'] })
  }
  
  private getElementSelector(element: Element): string | null {
    // Generate a simple selector for the element
    if (element.id) {
      return `#${element.id}`
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0)
      if (classes.length > 0) {
        return `.${classes[0]}`
      }
    }
    
    return element.tagName.toLowerCase()
  }
  
  private recordRenderTime(selector: string): void {
    const currentTime = performance.now()
    const renderTime = currentTime - this.startTime
    
    if (!this.renderTimes.has(selector)) {
      this.renderTimes.set(selector, renderTime)
      console.log(`Rendered ${selector} at ${renderTime.toFixed(2)}ms`)
    }
  }
  
  private recordResourceLoadTime(resource: string, loadTime: number): void {
    console.log(`Resource ${resource} loaded in ${loadTime.toFixed(2)}ms`)
  }
  
  private calculateVisualCompleteness(): number {
    if (typeof window === 'undefined') return 0
    
    const viewportHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // Calculate how much of the page is visually complete
    let completePixels = 0
    let totalPixels = viewportHeight
    
    // Check above-the-fold elements
    for (const selector of SPEED_INDEX_CONFIG.criticalPath.aboveFold) {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        const rect = element.getBoundingClientRect()
        if (rect.top < viewportHeight && rect.bottom > 0) {
          completePixels += Math.min(rect.height, viewportHeight - rect.top)
        }
      })
    }
    
    return Math.min(completePixels / totalPixels, 1.0)
  }
  
  private generateSpeedIndexReport(): void {
    const report = {
      totalTime: performance.now() - this.startTime,
      renderTimes: Object.fromEntries(this.renderTimes),
      completenessChecks: this.completenessChecks,
      speedIndex: this.calculateSpeedIndex()
    }
    
    console.log('Speed Index Report:', report)
    
    // Send to analytics
    this.sendToAnalytics(report)
  }
  
  private calculateSpeedIndex(): number {
    // Calculate Speed Index based on visual completeness over time
    let speedIndex = 0
    const interval = 100 // 100ms intervals
    
    for (let i = 0; i < this.completenessChecks.length; i++) {
      const time = i * interval
      const completeness = this.completenessChecks[i]
      speedIndex += (1 - completeness) * interval
    }
    
    return speedIndex
  }
  
  private sendToAnalytics(report: any): void {
    if (typeof window === 'undefined') return
    
    // Send to Web Vitals API
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metric: 'SPEED_INDEX',
        value: report.speedIndex,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        report
      })
    }).catch(console.error)
  }
}

// Optimize critical rendering path
export function optimizeCriticalRenderingPath(): void {
  if (typeof window === 'undefined') return
  
  // Ensure critical CSS is loaded first
  loadCriticalCSS()
  
  // Optimize above-the-fold content
  optimizeAboveFoldContent()
  
  // Defer below-the-fold content
  deferBelowFoldContent()
  
  // Optimize font loading
  optimizeFontLoading()
  
  // Optimize image loading
  optimizeImageLoading()
}

// Load critical CSS immediately
function loadCriticalCSS(): void {
  // Critical CSS should already be inlined in the HTML
  // This function ensures it's applied correctly
  const criticalCSS = document.querySelector('style[data-critical]')
  if (criticalCSS) {
    criticalCSS.setAttribute('media', 'all')
  }
}

// Optimize above-the-fold content
function optimizeAboveFoldContent(): void {
  const aboveFoldSelectors = SPEED_INDEX_CONFIG.criticalPath.aboveFold
  
  aboveFoldSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      // Ensure elements are visible immediately
      element.setAttribute('data-priority', 'high')
      
      // Remove any lazy loading attributes
      element.removeAttribute('loading')
      element.removeAttribute('data-lazy')
    })
  })
}

// Defer below-the-fold content
function deferBelowFoldContent(): void {
  const belowFoldSelectors = SPEED_INDEX_CONFIG.criticalPath.belowFold
  
  belowFoldSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      // Mark for lazy loading
      element.setAttribute('data-defer', 'true')
      
      // Use intersection observer for lazy loading
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load content when it comes into view
            loadDeferredContent(entry.target as Element)
            observer.unobserve(entry.target)
          }
        })
      })
      
      observer.observe(element)
    })
  })
}

// Load deferred content
function loadDeferredContent(element: Element): void {
  // Remove defer attribute
  element.removeAttribute('data-defer')
  
  // Load any lazy-loaded images
  const images = element.querySelectorAll('img[data-src]')
  images.forEach(img => {
    const src = img.getAttribute('data-src')
    if (src) {
      img.setAttribute('src', src)
      img.removeAttribute('data-src')
    }
  })
  
  // Load any lazy-loaded scripts
  const scripts = element.querySelectorAll('script[data-src]')
  scripts.forEach(script => {
    const src = script.getAttribute('data-src')
    if (src) {
      const newScript = document.createElement('script')
      newScript.src = src
      newScript.async = true
      script.parentNode?.replaceChild(newScript, script)
    }
  })
}

// Optimize font loading
function optimizeFontLoading(): void {
  // Use font-display: swap for better performance
  const fontLinks = document.querySelectorAll('link[href*="fonts"]')
  fontLinks.forEach(link => {
    link.setAttribute('media', 'print')
    link.setAttribute('onload', 'this.media="all"')
  })
}

// Optimize image loading
function optimizeImageLoading(): void {
  const images = document.querySelectorAll('img')
  
  images.forEach(img => {
    const rect = img.getBoundingClientRect()
    const isAboveFold = rect.top < window.innerHeight
    
    if (isAboveFold) {
      // Load immediately
      img.setAttribute('loading', 'eager')
      img.setAttribute('fetchpriority', 'high')
    } else {
      // Lazy load
      img.setAttribute('loading', 'lazy')
    }
  })
}

// Implement progressive loading
export function implementProgressiveLoading(): void {
  if (typeof window === 'undefined') return
  
  // Load content in stages based on priority
  const stages = [
    { threshold: SPEED_INDEX_CONFIG.loadingThresholds.immediate, priority: 'critical' },
    { threshold: SPEED_INDEX_CONFIG.loadingThresholds.fast, priority: 'high' },
    { threshold: SPEED_INDEX_CONFIG.loadingThresholds.normal, priority: 'normal' },
    { threshold: SPEED_INDEX_CONFIG.loadingThresholds.slow, priority: 'low' },
    { threshold: SPEED_INDEX_CONFIG.loadingThresholds.lazy, priority: 'lazy' }
  ]
  
  stages.forEach(stage => {
    setTimeout(() => {
      loadContentByPriority(stage.priority)
    }, stage.threshold)
  })
}

// Load content by priority
function loadContentByPriority(priority: string): void {
  const elements = document.querySelectorAll(`[data-priority="${priority}"]`)
  
  elements.forEach(element => {
    // Load the element
    element.removeAttribute('data-priority')
    
    // Trigger any lazy loading
    const event = new CustomEvent('load', { detail: { priority } })
    element.dispatchEvent(event)
  })
}

// Initialize Speed Index optimizer
export function initializeSpeedIndexOptimizer(): void {
  if (typeof window === 'undefined') return
  
  // Start monitoring
  new SpeedIndexMonitor()
  
  // Optimize critical rendering path
  optimizeCriticalRenderingPath()
  
  // Implement progressive loading
  implementProgressiveLoading()
  
  console.log('Speed Index optimizer initialized')
}

// Export for debugging
export function getSpeedIndexMetrics(): any {
  if (typeof window === 'undefined') return null
  
  return {
    renderTimes: performance.getEntriesByType('measure'),
    resourceTimes: performance.getEntriesByType('resource'),
    navigation: performance.getEntriesByType('navigation')[0]
  }
}
