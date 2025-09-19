/**
 * JavaScript Optimization Utilities
 * Implements aggressive JavaScript deferral and main thread optimization
 */

// Defer non-critical JavaScript execution
export function deferExecution(callback: () => void, priority: 'high' | 'medium' | 'low' = 'low') {
  const timeout = priority === 'high' ? 0 : priority === 'medium' ? 100 : 500
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, timeout)
  }
}

// Defer heavy computations to avoid blocking main thread
export function deferHeavyComputation<T>(
  computation: () => T,
  onComplete: (result: T) => void,
  priority: 'high' | 'medium' | 'low' = 'low'
) {
  deferExecution(() => {
    const result = computation()
    onComplete(result)
  }, priority)
}

// Lazy load components with intersection observer
export function createLazyLoader(
  loadComponent: () => Promise<any>,
  options: IntersectionObserverInit = { rootMargin: '50px' }
) {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          loadComponent().then(resolve)
        }
      })
    }, options)
    
    // Start observing when element is available
    const startObserving = () => {
      const element = document.querySelector('[data-lazy-load]')
      if (element) {
        observer.observe(element)
      } else {
        // Fallback: load immediately if no element found
        loadComponent().then(resolve)
      }
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserving)
    } else {
      startObserving()
    }
  })
}

// Optimize bundle loading with dynamic imports
export function createDynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Use requestIdleCallback for non-critical imports
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        try {
          const module = await importFn()
          resolve(module)
        } catch (error) {
          if (fallback) {
            resolve(fallback)
          } else {
            reject(error)
          }
        }
      }, { timeout: 2000 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(async () => {
        try {
          const module = await importFn()
          resolve(module)
        } catch (error) {
          if (fallback) {
            resolve(fallback)
          } else {
            reject(error)
          }
        }
      }, 100)
    }
  })
}

// Preload critical resources
export function preloadResource(href: string, as: string, priority: 'high' | 'low' = 'low') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  
  if (priority === 'high') {
    link.setAttribute('fetchpriority', 'high')
  }
  
  document.head.appendChild(link)
}

// Optimize API calls with intelligent batching
export class APIOptimizer {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async fetch<T>(
    url: string,
    options: RequestInit = {},
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data
      }
    }
    
    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }
    
    // Make new request
    const request = fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Cache successful responses
      if (useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        })
      }
      
      return data
    }).finally(() => {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey)
    })
    
    this.pendingRequests.set(cacheKey, request)
    return request
  }
  
  // Batch multiple API calls
  async batchFetch<T>(requests: Array<{ url: string; options?: RequestInit }>): Promise<T[]> {
    return Promise.all(
      requests.map(({ url, options }) => this.fetch<T>(url, options))
    )
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

// Optimize image loading
export function optimizeImageLoading() {
  const images = document.querySelectorAll('img[data-src]')
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        img.src = img.dataset.src!
        img.removeAttribute('data-src')
        imageObserver.unobserve(img)
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  })
  
  images.forEach(img => imageObserver.observe(img))
}

// Defer third-party scripts
export function deferThirdPartyScripts() {
  const scripts = document.querySelectorAll('script[data-defer]')
  
  scripts.forEach(script => {
    script.setAttribute('defer', '')
    script.removeAttribute('data-defer')
  })
  
  // Load analytics after page load
  deferExecution(() => {
    // Load Google Analytics or other tracking scripts
    console.log('Loading analytics scripts...')
  }, 'low')
}

// Optimize scroll performance
export function optimizeScrollPerformance() {
  let ticking = false
  
  function updateScrollPosition() {
    // Update scroll-dependent elements
    ticking = false
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition)
      ticking = true
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true })
}

// Initialize all optimizations
export function initializeJSOptimizations() {
  if (typeof window === 'undefined') return
  
  // Defer non-critical JavaScript
  deferExecution(() => {
    optimizeImageLoading()
    deferThirdPartyScripts()
    optimizeScrollPerformance()
  }, 'medium')
  
  // Preload critical resources
  deferExecution(() => {
    preloadResource('/api/blog/posts', 'fetch')
    preloadResource('/api/cms/content', 'fetch')
  }, 'high')
}

// Export singleton API optimizer
export const apiOptimizer = new APIOptimizer()
