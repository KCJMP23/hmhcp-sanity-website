'use client'

import { usePathname } from 'next/navigation'
import NavigationWrapperFixed from "@/components/navigation-wrapper-fixed"

export default function NavigationWrapper() {
  const pathname = usePathname()
  
  // Don't render navigation on admin pages or studio
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/studio')) {
    return null
  }
  
  // Render navigation for all other pages
  return <NavigationWrapperFixed />
}