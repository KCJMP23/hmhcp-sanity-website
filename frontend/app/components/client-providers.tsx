'use client'

import type { ReactNode } from 'react'
import { ScrollRestoration } from '@/components/scroll-restoration'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { VisitorAnalyticsProvider } from '@/components/analytics/VisitorAnalyticsProvider'
import { PerformanceProvider } from '@/components/performance/PerformanceProvider'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AnalyticsProvider>
      <VisitorAnalyticsProvider>
        <PerformanceProvider>
          {children}
          <ScrollRestoration />
        </PerformanceProvider>
      </VisitorAnalyticsProvider>
    </AnalyticsProvider>
  )
}