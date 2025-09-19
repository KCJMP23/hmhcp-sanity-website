/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and performance metrics
 */

export interface WebVitalsMetric {
  name: string
  value: number
  delta: number
  id: string
  navigationType: string
}

export interface PerformanceData {
  lcp: number | null
  fid: number | null
  cls: number | null
  fcp: number | null
  ttfb: number | null
  tti: number | null
  fmp: number | null
}

class PerformanceMonitor {
  private metrics: PerformanceData = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    tti: null,
    fmp: null
  }

  private observers: PerformanceObserver[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
      this.measureTTFB()
    }
  }

  private initializeObservers() {
    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.metrics.lcp = lastEntry.startTime
          this.reportMetric('LCP', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // FID Observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
            this.reportMetric('FID', this.metrics.fid)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // CLS Observer
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              this.metrics.cls = clsValue
              this.reportMetric('CLS', clsValue)
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }

      // FCP Observer
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fcp = entry.startTime
            this.reportMetric('FCP', entry.startTime)
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (e) {
        console.warn('FCP observer not supported')
      }
    }
  }

  private measureTTFB() {
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing
      const ttfb = timing.responseStart - timing.navigationStart
      this.metrics.ttfb = ttfb
      this.reportMetric('TTFB', ttfb)
    }
  }

  private reportMetric(name: string, value: number) {
    // Send to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: name,
        non_interaction: true
      })
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${name}:`, value)
    }

    // Send to custom analytics endpoint
    this.sendToAnalytics(name, value)
  }

  private async sendToAnalytics(name: string, value: number) {
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value: value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      })
    } catch (error) {
      console.warn('Failed to send Web Vitals data:', error)
    }
  }

  public getMetrics(): PerformanceData {
    return { ...this.metrics }
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function initializePerformanceMonitoring(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor!
}

export function getPerformanceMetrics(): PerformanceData {
  return performanceMonitor?.getMetrics() || {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    tti: null,
    fmp: null
  }
}

// Performance optimization utilities
export function optimizeImages() {
  if (typeof window === 'undefined') return

  const images = document.querySelectorAll('img[data-src]')
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        img.src = img.dataset.src!
        img.removeAttribute('data-src')
        imageObserver.unobserve(img)
      }
    })
  })

  images.forEach(img => imageObserver.observe(img))
}

export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  const criticalResources = [
    '/hero-research.jpg',
    '/hero-technology.jpg',
    '/hmhcp-logo-white-real.svg'
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = resource
    document.head.appendChild(link)
  })
}

export function optimizeThirdPartyScripts() {
  if (typeof window === 'undefined') return

  // Defer non-critical scripts
  const scripts = document.querySelectorAll('script[data-defer]')
  scripts.forEach(script => {
    script.setAttribute('defer', '')
  })

  // Load analytics after page load
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Load Google Analytics or other tracking scripts here
      console.log('Loading analytics scripts...')
    })
  }
}