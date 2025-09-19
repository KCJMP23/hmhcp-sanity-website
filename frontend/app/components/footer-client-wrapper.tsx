'use client'

import { usePathname } from 'next/navigation'

interface FooterClientWrapperProps {
  children: React.ReactNode
}

export default function FooterClientWrapper({ children }: FooterClientWrapperProps) {
  const pathname = usePathname()
  
  // Don't render footer on admin pages or studio
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/studio')) {
    return null
  }
  
  // Render footer for all other pages
  return <>{children}</>
}