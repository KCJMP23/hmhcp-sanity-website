interface PerformanceMetrics {
  timeToFirstByte: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  interactionToNextPaint?: number
  totalBlockingTime?: number
  memoryUsage?: number
  connectionType?: string
  navigationTiming?: PerformanceNavigationTiming
}

interface PerformanceReport {
  metrics: PerformanceMetrics
  timestamp: string
  page: string
  userAgent: string
  viewport: {
    width: number
    height: number
  }
  score: {
    overall: number
    fcp: number
    lcp: number
    cls: number
    fid: number
  }
}

export function measurePerformance(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({
        timeToFirstByte: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0
      })
      return
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const metrics: Partial<PerformanceMetrics> = {}

      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime
            }
            break
          case 'largest-contentful-paint':
            metrics.largestContentfulPaint = entry.startTime
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.cumulativeLayoutShift = (metrics.cumulativeLayoutShift || 0) + (entry as any).value
            }
            break
          case 'first-input':
            metrics.firstInputDelay = (entry as any).processingStart - entry.startTime
            break
        }
      })

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.timeToFirstByte = navigation.responseStart - navigation.requestStart
      }

      if (Object.keys(metrics).length >= 2) {
        resolve({
          timeToFirstByte: metrics.timeToFirstByte || 0,
          firstContentfulPaint: metrics.firstContentfulPaint || 0,
          largestContentfulPaint: metrics.largestContentfulPaint || 0,
          cumulativeLayoutShift: metrics.cumulativeLayoutShift || 0,
          firstInputDelay: metrics.firstInputDelay || 0
        })
      }
    })

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] })

    setTimeout(() => {
      observer.disconnect()
      resolve({
        timeToFirstByte: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0
      })
    }, 5000)
  })
}

export function optimizeImages(src: string, width?: number, quality: number = 75): string {
  if (!src) return ''
  
  if (src.includes('sanity')) {
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    params.set('q', quality.toString())
    params.set('auto', 'format')
    params.set('fit', 'max')
    
    return `${src}?${params.toString()}`
  }
  
  return src
}

export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  const criticalImages = [
    '/hmhcp-logo-white-clean.svg',
    '/hmhcp-logo-dark.svg',
    '/intellic-platform-dashboard.png'
  ]

  criticalImages.forEach((src) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })
}

export function enableServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Enhanced performance monitoring with real-time tracking
export function startRealTimeMonitoring(): () => void {
  if (typeof window === 'undefined') return () => {}

  let isMonitoring = true
  const monitoringInterval = 5000 // Check every 5 seconds

  const monitor = async () => {
    if (!isMonitoring) return

    try {
      const metrics = await measurePerformance()
      const report = await generatePerformanceReport(metrics)
      
      // Send to analytics endpoint
      await sendPerformanceData(report)
      
      // Store locally for dashboard
      storePerformanceData(report)
      
      // Check for performance issues
      checkPerformanceThresholds(report)
      
    } catch (error) {
      console.warn('Performance monitoring error:', error)
    }

    if (isMonitoring) {
      setTimeout(monitor, monitoringInterval)
    }
  }

  // Start monitoring
  monitor()

  // Return cleanup function
  return () => {
    isMonitoring = false
  }
}

// Generate comprehensive performance report
export async function generatePerformanceReport(metrics: PerformanceMetrics): Promise<PerformanceReport> {
  const report: PerformanceReport = {
    metrics,
    timestamp: new Date().toISOString(),
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0
    },
    score: calculatePerformanceScore(metrics)
  }

  return report
}

// Calculate performance scores based on Core Web Vitals thresholds
function calculatePerformanceScore(metrics: PerformanceMetrics): PerformanceReport['score'] {
  const fcpScore = metrics.firstContentfulPaint <= 1800 ? 100 : 
                   metrics.firstContentfulPaint <= 3000 ? 75 : 50

  const lcpScore = metrics.largestContentfulPaint <= 2500 ? 100 :
                   metrics.largestContentfulPaint <= 4000 ? 75 : 50

  const clsScore = metrics.cumulativeLayoutShift <= 0.1 ? 100 :
                   metrics.cumulativeLayoutShift <= 0.25 ? 75 : 50

  const fidScore = metrics.firstInputDelay <= 100 ? 100 :
                   metrics.firstInputDelay <= 300 ? 75 : 50

  const overall = Math.round((fcpScore + lcpScore + clsScore + fidScore) / 4)

  return {
    overall,
    fcp: fcpScore,
    lcp: lcpScore,
    cls: clsScore,
    fid: fidScore
  }
}

// Send performance data to analytics endpoint
async function sendPerformanceData(report: PerformanceReport): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report)
    })
  } catch (error) {
    // Silently handle network errors
  }
}

// Store performance data locally for dashboard
function storePerformanceData(report: PerformanceReport): void {
  if (typeof window === 'undefined') return

  try {
    const existingData = localStorage.getItem('hmhcp_performance_data')
    const data = existingData ? JSON.parse(existingData) : []
    
    data.push(report)
    
    // Keep only last 50 reports
    if (data.length > 50) {
      data.splice(0, data.length - 50)
    }
    
    localStorage.setItem('hmhcp_performance_data', JSON.stringify(data))
  } catch (error) {
    // Handle storage errors silently
  }
}

// Check performance thresholds and warn if needed
function checkPerformanceThresholds(report: PerformanceReport): void {
  const { metrics, score } = report

  if (score.overall < 75) {
    console.warn('Performance Warning: Overall score below threshold', {
      score: score.overall,
      page: report.page,
      metrics: {
        FCP: metrics.firstContentfulPaint,
        LCP: metrics.largestContentfulPaint,
        CLS: metrics.cumulativeLayoutShift,
        FID: metrics.firstInputDelay
      }
    })
  }

  // Specific metric warnings
  if (metrics.largestContentfulPaint > 4000) {
    console.warn('LCP Warning: Largest Contentful Paint > 4s')
  }

  if (metrics.cumulativeLayoutShift > 0.25) {
    console.warn('CLS Warning: Cumulative Layout Shift > 0.25')
  }

  if (metrics.firstInputDelay > 300) {
    console.warn('FID Warning: First Input Delay > 300ms')
  }
}

// Get stored performance data for dashboard
export function getStoredPerformanceData(): PerformanceReport[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem('hmhcp_performance_data')
    return data ? JSON.parse(data) : []
  } catch (error) {
    return []
  }
}

// Enhanced image optimization with performance considerations
export function optimizeImageWithMetrics(
  src: string, 
  width?: number, 
  quality: number = 75,
  format: 'webp' | 'avif' | 'auto' = 'auto'
): string {
  if (!src) return ''
  
  if (src.includes('sanity')) {
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    params.set('q', quality.toString())
    params.set('auto', format)
    params.set('fit', 'max')
    
    // Add responsive sizing for better performance
    if (width && width <= 640) {
      params.set('dpr', '2') // High DPI for mobile
    }
    
    return `${src}?${params.toString()}`
  }
  
  return src
}

// Memory usage monitoring
export function getMemoryUsage(): number {
  if (typeof window === 'undefined' || !('memory' in performance)) return 0
  
  const memory = (performance as any).memory
  return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0 // Convert to MB
}

// Network information
export function getConnectionInfo(): string {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return 'unknown'
  
  const connection = (navigator as any).connection
  return connection ? connection.effectiveType : 'unknown'
}