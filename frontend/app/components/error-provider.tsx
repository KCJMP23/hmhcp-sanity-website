"use client"

import { useEffect } from 'react'
import { initializeClientErrorHandling } from '@/lib/error-handler'

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeClientErrorHandling()
  }, [])

  return <>{children}</>
}