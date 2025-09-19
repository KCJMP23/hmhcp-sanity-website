'use client'

/**
 * Performance Optimizer Component
 * 
 * Client-side performance monitoring and optimization
 */

import { useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { imageLazyLoader } from '@/lib/optimization/image-optimization-pipeline'
import { prefetchRouteChunks, preloadCriticalChunks } from '@/lib/optimization/bundle-optimization'

interface PerformanceOptimizerProps {
  children?: React.ReactNode
  enableMonitoring?: boolean
  enablePrefetch?: boolean
  enableLazyLoading?: boolean
  reportToAnalytics?: boolean
  sampleRate?: number
}

export function PerformanceOptimizer({
  children,
  enableMonitoring = true,
  enablePrefetch = true,
  enableLazyLoading = true,
  reportToAnalytics = true,
  sampleRate = 0.1 // Sample 10% of users
}: PerformanceOptimizerProps) {
  const pathname = usePathname()
  const metricsReported = useRef(false)
  const observer = useRef<PerformanceObserver | null>(null)

  /**
   * Collect and report Core Web Vitals
   */
  const collectWebVitals = useCallback(() => {
    if (!enableMonitoring || metricsReported.current) return
    
    // Check sample rate
    if (Math.random() > sampleRate) return

    const metrics: any = {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      metrics: {},
      device: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      }
    }

    // Collect navigation timing
    if (performance.timing) {
      const timing = performance.timing
      metrics.metrics.ttfb = timing.responseStart - timing.requestStart
      metrics.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
      metrics.metrics.loadComplete = timing.loadEventEnd - timing.navigationStart
    }

    // Collect resource timing
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource')
      metrics.metrics.resourceCount = resources.length
      metrics.metrics.resourceSize = resources.reduce((total: number, resource: any) => {
        return total + (resource.transferSize || 0)
      }, 0)
    }

    // Collect memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.metrics.memoryUsed = memory.usedJSHeapSize
      metrics.metrics.memoryLimit = memory.jsHeapSizeLimit
    }

    // Setup observers for Core Web Vitals
    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        metrics.metrics.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          const firstInput = entries[0] as any
          metrics.metrics.fid = firstInput.processingStart - firstInput.startTime
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // CLS Observer
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            metrics.metrics.cls = clsValue
          }
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // FCP Observer
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            metrics.metrics.fcp = entry.startTime
            break
          }
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })

      // Store observer reference for cleanup
      observer.current = lcpObserver
    } catch (e) {
      console.warn('Performance Observer not supported')
    }

    // Report metrics after page load
    const reportMetrics = () => {
      if (reportToAnalytics && !metricsReported.current) {
        // Send to our performance API
        fetch('/api/performance/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics)
        }).catch(error => {
          console.error('Failed to report performance metrics:', error)
        })

        metricsReported.current = true
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('Performance Metrics')
        console.table(metrics.metrics)
        console.groupEnd()
      }
    }

    // Wait for page to fully load before reporting
    if (document.readyState === 'complete') {
      setTimeout(reportMetrics, 2000)
    } else {
      window.addEventListener('load', () => {
        setTimeout(reportMetrics, 2000)
      })
    }
  }, [enableMonitoring, reportToAnalytics, sampleRate])

  /**
   * Prefetch routes for faster navigation
   */
  const prefetchNearbyRoutes = useCallback(() => {
    if (!enablePrefetch) return

    // Prefetch common routes based on current page
    const routesToPrefetch: string[] = []

    if (pathname === '/') {
      routesToPrefetch.push('/services', '/platforms', '/about')
    } else if (pathname.startsWith('/services')) {
      routesToPrefetch.push('/platforms', '/contact')
    } else if (pathname.startsWith('/platforms')) {
      routesToPrefetch.push('/services', '/research')
    } else if (pathname === '/blog') {
      // Don't prefetch individual blog posts (too many)
      routesToPrefetch.push('/')
    }

    // Prefetch routes
    if (routesToPrefetch.length > 0) {
      prefetchRouteChunks(routesToPrefetch)
    }

    // Prefetch links on hover
    const links = document.querySelectorAll('a[href^="/"]')
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href')
        if (href && !href.startsWith('/api') && !href.startsWith('/admin')) {
          prefetchRouteChunks([href])
        }
      }, { once: true, passive: true })
    })
  }, [pathname, enablePrefetch])

  /**
   * Setup lazy loading for images
   */
  const setupLazyLoading = useCallback(() => {
    if (!enableLazyLoading) return

    // Observe all images with data-src
    imageLazyLoader.observeAll()

    // Observe dynamically added images
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'IMG' && (node as HTMLImageElement).dataset.src) {
            imageLazyLoader.observe(node as HTMLImageElement)
          }
          
          // Check for images in added subtrees
          if (node.nodeType === 1) { // Element node
            const images = (node as Element).querySelectorAll<HTMLImageElement>('img[data-src]')
            images.forEach(img => imageLazyLoader.observe(img))
          }
        })
      })
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      mutationObserver.disconnect()
      imageLazyLoader.disconnect()
    }
  }, [enableLazyLoading])

  /**
   * Optimize third-party scripts
   */
  const optimizeThirdPartyScripts = useCallback(() => {
    // Defer non-critical third-party scripts
    const scripts = document.querySelectorAll('script[src*="googletagmanager"], script[src*="analytics"]')
    scripts.forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.setAttribute('defer', 'true')
      }
    })

    // Preconnect to third-party domains
    const preconnectDomains = [
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }, [])

  /**
   * Setup intersection observer for viewport-based optimizations
   */
  const setupViewportOptimizations = useCallback(() => {
    const viewportObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            
            // Add animation class when in viewport
            if (element.dataset.animate) {
              element.classList.add('animate-in')
            }
            
            // Load video when in viewport
            if (element.tagName === 'VIDEO' && element.dataset.src) {
              (element as HTMLVideoElement).src = element.dataset.src
              element.removeAttribute('data-src')
            }
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    // Observe elements with viewport-based optimizations
    document.querySelectorAll('[data-animate], video[data-src]').forEach(element => {
      viewportObserver.observe(element)
    })

    return () => viewportObserver.disconnect()
  }, [])

  // Initialize performance optimizations
  useEffect(() => {
    // Reset metrics reported flag on route change
    metricsReported.current = false

    // Collect web vitals
    collectWebVitals()

    // Preload critical chunks
    preloadCriticalChunks()

    // Prefetch nearby routes
    const prefetchTimer = setTimeout(prefetchNearbyRoutes, 1000)

    // Setup lazy loading
    const cleanupLazyLoading = setupLazyLoading()

    // Optimize third-party scripts
    optimizeThirdPartyScripts()

    // Setup viewport optimizations
    const cleanupViewport = setupViewportOptimizations()

    // Cleanup
    return () => {
      clearTimeout(prefetchTimer)
      if (cleanupLazyLoading) cleanupLazyLoading()
      if (cleanupViewport) cleanupViewport()
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [
    pathname,
    collectWebVitals,
    prefetchNearbyRoutes,
    setupLazyLoading,
    optimizeThirdPartyScripts,
    setupViewportOptimizations
  ])

  return <>{children}</>
}

/**
 * Performance metrics display component (for development)
 */
export function PerformanceMetricsDisplay() {
  const [metrics, setMetrics] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/performance/metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
      }
    }

    // Fetch initially
    fetchMetrics()

    // Refresh every 5 seconds
    const interval = setInterval(fetchMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development' || !metrics) return null

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-4 right-4 z-50 bg-black text-white px-3 py-1 rounded text-xs font-mono"
        aria-label="Toggle performance metrics"
      >
        PERF
      </button>

      {/* Metrics panel */}
      {visible && (
        <div className="fixed bottom-16 right-4 z-50 bg-black text-white p-4 rounded-lg text-xs font-mono max-w-sm">
          <h3 className="text-sm font-bold mb-2">Performance Metrics</h3>
          
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Cache Hit Ratio:</span>{' '}
              <span className={metrics.cache.hitRatio > 85 ? 'text-green-400' : 'text-yellow-400'}>
                {metrics.cache.hitRatio.toFixed(1)}%
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Cache Size:</span>{' '}
              <span>{metrics.cache.sizeFormatted}</span>
            </div>
            
            <div>
              <span className="text-gray-400">DB Connections:</span>{' '}
              <span>{metrics.database.total} ({metrics.database.idle} idle)</span>
            </div>
            
            {metrics.realTime.current && (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="text-gray-400">Core Web Vitals:</div>
                  {metrics.realTime.current.metrics.lcp && (
                    <div>LCP: {metrics.realTime.current.metrics.lcp.toFixed(0)}ms</div>
                  )}
                  {metrics.realTime.current.metrics.fid && (
                    <div>FID: {metrics.realTime.current.metrics.fid.toFixed(0)}ms</div>
                  )}
                  {metrics.realTime.current.metrics.cls && (
                    <div>CLS: {metrics.realTime.current.metrics.cls.toFixed(3)}</div>
                  )}
                </div>
              </>
            )}
            
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="text-gray-400">Trend:</div>
              <div className={
                metrics.realTime.trend === 'improving' ? 'text-green-400' :
                metrics.realTime.trend === 'degrading' ? 'text-red-400' :
                'text-yellow-400'
              }>
                {metrics.realTime.trend.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Add missing import
import { useState } from 'react'