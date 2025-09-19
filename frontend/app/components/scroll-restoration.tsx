"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function ScrollRestorationInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Scroll to top on page navigation
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [pathname, searchParams])

  return null
}

export function ScrollRestoration() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationInner />
    </Suspense>
  )
}
