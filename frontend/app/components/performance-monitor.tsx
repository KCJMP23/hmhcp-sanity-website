'use client'

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Try to import web-vitals dynamically, with graceful fallback
    const webVitalsModuleName = 'web-vitals'
    import(webVitalsModuleName).then((webVitals: any) => {
      if (webVitals?.getCLS) {
        webVitals.getCLS(console.log)
        webVitals.getFID?.(console.log)
        webVitals.getFCP?.(console.log)
        webVitals.getLCP?.(console.log)
        webVitals.getTTFB?.(console.log)
      }
    }).catch(() => {
      // Silently fail if web-vitals is not available
      if (process.env.NODE_ENV === 'development') {
        console.log('web-vitals not available, skipping performance monitoring')
      }
    })
  }, [])

  return null // This component doesn't render anything
}