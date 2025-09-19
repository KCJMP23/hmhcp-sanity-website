'use client'

import React, { useEffect } from 'react'
import { initializePWA } from '@/lib/pwa'

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      initializePWA({
        swUrl: '/sw.js',
        scope: '/',
        updateCheckInterval: 60 * 60 * 1000
      })
      console.log('[PWA] Provider initialized')
    } catch (error) {
      console.error('[PWA] Provider initialization failed:', error)
    }
  }, [])

  return <>{children}</>
}