"use client"

import { usePathname } from "next/navigation"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Define pages with dark hero backgrounds that should have no top padding
  const darkBackgroundPages = [
    "/", 
    "/about",
    "/platforms",
    "/platforms/intellic-edc", 
    "/platforms/mybc-health",
    "/research",
    "/research/clinical-studies",
    "/research/publications", 
    "/research/qa-qi",
    "/services",
    "/education",
    "/blog",
    "/contact",
    "/case-studies",
    "/careers",
    "/leadership",
    "/partners",
    "/publications",
    "/webinars",
    "/faq",
    "/accessibility",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy"
  ]
  
  // Also check if it's a blog post page (starts with /blog/)
  const isBlogPost = pathname.startsWith('/blog/') && pathname !== '/blog/'
  const isDarkBackgroundPage = darkBackgroundPages.includes(pathname) || isBlogPost
  
  // Don't add padding on admin/studio pages, but DO add it for homepage and other dark background pages
  const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/studio')
  const isHomepage = pathname === '/'
  const shouldHavePadding = !isAdminPage && !isDarkBackgroundPage // Add padding only for pages without dark backgrounds
  
  return (
    <main 
      id="main-content" 
      className={`flex-1 ${shouldHavePadding ? 'pt-16 md:pt-20' : ''}`}
    >
      {children}
    </main>
  )
}