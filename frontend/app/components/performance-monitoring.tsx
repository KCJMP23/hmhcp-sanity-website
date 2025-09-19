"use client"

import { useEffect } from "react"

export function PerformanceMonitoring() {
  useEffect(() => {
    if (typeof window !== "undefined" && "performance" in window) {
      // Polyfill for browsers that don't support PerformanceObserver
      if (!("PerformanceObserver" in window)) return

      try {
        // Monitor LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          console.log("LCP:", lastEntry.startTime / 1000, "seconds")
        })
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })

        // Monitor FID (First Input Delay)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry: any) => {
            console.log("FID:", entry.processingStart - entry.startTime, "ms")
          })
        })
        fidObserver.observe({ type: "first-input", buffered: true })

        // Monitor CLS (Cumulative Layout Shift)
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0
          const entries = entryList.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          console.log("CLS:", clsValue)
        })
        clsObserver.observe({ type: "layout-shift", buffered: true })

        return () => {
          lcpObserver.disconnect()
          fidObserver.disconnect()
          clsObserver.disconnect()
        }
      } catch (e) {
        console.error("Performance monitoring error:", e)
      }
    }
  }, [])

  return null
}
