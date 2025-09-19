'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Log page view (you can integrate with your analytics provider here)
    if (typeof window !== 'undefined') {
      console.log('Page view:', url)
    }
  }, [pathname, searchParams])

  return null
}