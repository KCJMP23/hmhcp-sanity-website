'use client'

import { useEffect } from 'react'
import { performanceMonitor } from '@/lib/performance-monitor'

export function PerformanceMonitorWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Performance monitoring is automatically initialized when imported
    // This component just ensures it's loaded in the client
  }, [])

  return <>{children}</>
}