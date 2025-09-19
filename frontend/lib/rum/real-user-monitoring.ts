import { logger } from '@/lib/logger';

/**
 * Real User Monitoring (RUM) System
 * Collects and reports performance metrics from real users
 */

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  inp?: number // Interaction to Next Paint
  
  // Navigation timing
  dns?: number
  tcp?: number
  ssl?: number
  requestTime?: number
  responseTime?: number
  domInteractive?: number
  domContentLoaded?: number
  domComplete?: number
  loadComplete?: number
  
  // Resource timing
  resources?: {
    name: string
    type: string
    duration: number
    size: number
    transferSize: number
  }[]
  
  // User context
  url: string
  referrer?: string
  userAgent: string
  screenResolution: string
  viewportSize: string
  connectionType?: string
  deviceMemory?: number
  hardwareConcurrency?: number
  
  // Session info
  sessionId: string
  timestamp: number
  pageLoadId: string
}

class RealUserMonitoring {
  private sessionId: string
  private pageLoadId: string
  private metrics: Partial<PerformanceMetrics> = {}
  private reportQueue: PerformanceMetrics[] = []
  private reportTimer: NodeJS.Timeout | null = null
  private observers: PerformanceObserver[] = []

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.pageLoadId = this.generateId()
    
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring() {
    // Basic metrics from navigation timing
    this.collectNavigationTiming()
    
    // Core Web Vitals
    this.observeWebVitals()
    
    // Resource timing
    this.observeResources()
    
    // User context
    this.collectUserContext()
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // Send metrics before unload
    window.addEventListener('beforeunload', this.sendMetrics.bind(this))
    
    // Schedule periodic reporting
    this.scheduleReport()
  }

  /**
   * Collect navigation timing metrics
   */
  private collectNavigationTiming() {
    if (!('performance' in window) || !performance.getEntriesByType) return
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return
    
    this.metrics.dns = navigation.domainLookupEnd - navigation.domainLookupStart
    this.metrics.tcp = navigation.connectEnd - navigation.connectStart
    this.metrics.ssl = navigation.secureConnectionStart > 0 
      ? navigation.connectEnd - navigation.secureConnectionStart 
      : 0
    this.metrics.ttfb = navigation.responseStart - navigation.requestStart
    this.metrics.responseTime = navigation.responseEnd - navigation.responseStart
    this.metrics.domInteractive = navigation.domInteractive - navigation.fetchStart
    this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
    this.metrics.domComplete = navigation.domComplete - navigation.fetchStart
    this.metrics.loadComplete = navigation.loadEventEnd - navigation.fetchStart
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals() {
    if (!('PerformanceObserver' in window)) return
    
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.push(lcpObserver)
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstInput = entries[0] as PerformanceEventTiming
        this.metrics.fid = firstInput.processingStart - firstInput.startTime
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
      this.observers.push(fidObserver)
      
      // Cumulative Layout Shift
      let clsValue = 0
      let clsEntries: LayoutShift[] = []
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as LayoutShift[]
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            clsEntries.push(entry)
          }
        })
        this.metrics.cls = clsValue
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      this.observers.push(clsObserver)
      
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcp) {
          this.metrics.fcp = fcp.startTime
        }
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
      this.observers.push(fcpObserver)
      
      // Interaction to Next Paint (INP)
      if ('PerformanceEventTiming' in window) {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceEventTiming[]
          entries.forEach((entry) => {
            const inp = entry.duration
            if (!this.metrics.inp || inp > this.metrics.inp) {
              this.metrics.inp = inp
            }
          })
        })
        inpObserver.observe({ type: 'event', buffered: true })
        this.observers.push(inpObserver)
      }
    } catch (error) {
      logger.error('Error setting up performance observers:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  /**
   * Observe resource loading
   */
  private observeResources() {
    if (!('PerformanceObserver' in window)) return
    
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        const resources = entries.map(entry => ({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          size: entry.decodedBodySize || 0,
          transferSize: entry.transferSize || 0
        }))
        
        this.metrics.resources = [...(this.metrics.resources || []), ...resources]
      })
      resourceObserver.observe({ type: 'resource', buffered: true })
      this.observers.push(resourceObserver)
    } catch (error) {
      logger.error('Error observing resources:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  /**
   * Collect user context information
   */
  private collectUserContext() {
    this.metrics.url = window.location.href
    this.metrics.referrer = document.referrer
    this.metrics.userAgent = navigator.userAgent
    this.metrics.screenResolution = `${window.screen.width}x${window.screen.height}`
    this.metrics.viewportSize = `${window.innerWidth}x${window.innerHeight}`
    
    // Connection information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      this.metrics.connectionType = connection.effectiveType
    }
    
    // Device capabilities
    if ('deviceMemory' in navigator) {
      this.metrics.deviceMemory = (navigator as any).deviceMemory
    }
    
    if ('hardwareConcurrency' in navigator) {
      this.metrics.hardwareConcurrency = navigator.hardwareConcurrency
    }
  }

  /**
   * Handle visibility changes
   */
  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.sendMetrics()
    }
  }

  /**
   * Schedule periodic reporting
   */
  private scheduleReport() {
    // Send metrics every 30 seconds or when queue reaches 10 items
    this.reportTimer = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.flushQueue()
      }
    }, 30000)
  }

  /**
   * Send collected metrics
   */
  private async sendMetrics() {
    const metrics: PerformanceMetrics = {
      ...this.metrics,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      pageLoadId: this.pageLoadId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    }
    
    this.reportQueue.push(metrics)
    
    if (this.reportQueue.length >= 10) {
      await this.flushQueue()
    }
  }

  /**
   * Flush the report queue
   */
  private async flushQueue() {
    if (this.reportQueue.length === 0) return
    
    const batch = [...this.reportQueue]
    this.reportQueue = []
    
    try {
      // Use sendBeacon for reliability
      if ('sendBeacon' in navigator) {
        const data = JSON.stringify({ metrics: batch })
        navigator.sendBeacon('/api/analytics/rum', data)
      } else {
        // Fallback to fetch
        await fetch('/api/analytics/rum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: batch }),
          keepalive: true
        })
      }
    } catch (error) {
      logger.error('Failed to send RUM metrics:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      // Re-add to queue on failure
      this.reportQueue.unshift(...batch)
    }
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    const key = 'rum_session_id'
    let sessionId = sessionStorage.getItem(key)
    
    if (!sessionId) {
      sessionId = this.generateId()
      sessionStorage.setItem(key, sessionId)
    }
    
    return sessionId
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up monitoring
   */
  public destroy() {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    
    // Clear timer
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = null
    }
    
    // Send any remaining metrics
    this.flushQueue()
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    window.removeEventListener('beforeunload', this.sendMetrics.bind(this))
  }
}

// Export singleton instance
let rumInstance: RealUserMonitoring | null = null

export function initializeRUM() {
  if (typeof window !== 'undefined' && !rumInstance) {
    rumInstance = new RealUserMonitoring()
  }
  return rumInstance
}

export function getRUM() {
  return rumInstance
}

export function destroyRUM() {
  if (rumInstance) {
    rumInstance.destroy()
    rumInstance = null
  }
}

// Type definitions for TypeScript
declare global {
  // PerformanceEventTiming is already defined in DOM types
  
  interface LayoutShift extends PerformanceEntry {
    value: number
    hadRecentInput: boolean
  }
}