'use client'

import { useAnalyticsTracking } from '@/hooks/use-analytics-tracking'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface AnalyticsProviderProps {
  children: React.ReactNode
  enabled?: boolean
}

export function AnalyticsProvider({ children, enabled = true }: AnalyticsProviderProps) {
  const pathname = usePathname()
  const { trackPageView } = useAnalyticsTracking({ enabled })

  // Track page views on route changes
  useEffect(() => {
    if (enabled && pathname) {
      // Small delay to ensure page title is updated
      const timeout = setTimeout(() => {
        trackPageView(pathname)
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [pathname, enabled, trackPageView])

  return <>{children}</>
}