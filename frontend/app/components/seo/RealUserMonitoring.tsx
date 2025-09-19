'use client'

import { useEffect } from 'react'
import { AdvancedSEOService, type CoreWebVitals } from '@/lib/seo/advanced-seo-service'

export function RealUserMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let vitals: Partial<CoreWebVitals> = {}

    // Function to send metrics to API
    const sendMetrics = async (metrics: CoreWebVitals) => {
      try {
        await fetch('/api/seo/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: window.location.pathname,
            vitals: metrics,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        console.error('Failed to send performance metrics:', error)
      }
    }

    // Track Core Web Vitals
    AdvancedSEOService.trackCoreWebVitals((newVitals) => {
      // Merge with existing vitals
      vitals = {
        ...vitals,
        ...Object.entries(newVitals).reduce((acc, [key, value]) => {
          if (value !== 0) acc[key as keyof CoreWebVitals] = value
          return acc
        }, {} as Partial<CoreWebVitals>)
      }

      // Check if we have all vitals collected
      const hasAllVitals = ['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'inp'].every(
        key => vitals[key as keyof CoreWebVitals] !== undefined
      )

      // Send metrics after collecting sufficient data
      if (hasAllVitals) {
        sendMetrics(vitals as CoreWebVitals)
      }
    })

    // Also track using web-vitals library if available
    if ('PerformanceObserver' in window) {
      // Track LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            vitals.lcp = lastEntry.renderTime || lastEntry.loadTime
          }
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      } catch (e) {
        console.debug('LCP observer not supported')
      }

      // Track FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const firstInput = entries[0] as any
          if (firstInput) {
            vitals.fid = firstInput.processingStart - firstInput.startTime
          }
        })
        fidObserver.observe({ type: 'first-input', buffered: true })
      } catch (e) {
        console.debug('FID observer not supported')
      }

      // Track CLS
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              vitals.cls = clsValue
            }
          }
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
      } catch (e) {
        console.debug('CLS observer not supported')
      }

      // Track paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime
            }
          }
        })
        paintObserver.observe({ type: 'paint', buffered: true })
      } catch (e) {
        console.debug('Paint observer not supported')
      }
    }

    // Track TTFB using Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        const navigationEntry = navigationEntries[0]
        vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
      }
    }

    // Send metrics on page unload
    const handleUnload = () => {
      if (Object.keys(vitals).length > 0) {
        // Use sendBeacon for reliability
        const data = JSON.stringify({
          url: window.location.pathname,
          vitals,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
        navigator.sendBeacon('/api/seo/performance', data)
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    
    // Send metrics after 10 seconds if not already sent
    const timeout = setTimeout(() => {
      if (Object.keys(vitals).length >= 3) {
        sendMetrics({
          lcp: vitals.lcp || 0,
          fid: vitals.fid || 0,
          cls: vitals.cls || 0,
          fcp: vitals.fcp || 0,
          ttfb: vitals.ttfb || 0,
          inp: vitals.inp || 0
        })
      }
    }, 10000)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      clearTimeout(timeout)
    }
  }, [])

  return null // This component doesn't render anything
}