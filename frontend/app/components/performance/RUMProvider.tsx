'use client'

/**
 * Real User Monitoring Provider
 * Initializes RUM tracking for the application
 */

import { useEffect } from 'react'
import { initializeRUM, destroyRUM } from '@/lib/rum/real-user-monitoring'

export function RUMProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize RUM in production
    if (process.env.NODE_ENV === 'production') {
      const rum = initializeRUM()
      
      // Clean up on unmount
      return () => {
        destroyRUM()
      }
    }
  }, [])

  return <>{children}</>
}