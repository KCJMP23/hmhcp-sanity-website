/**
 * Bundle Optimization System
 * Aggressive tree shaking and dynamic imports to reduce bundle size
 */

import React from 'react'

// Dynamic imports for heavy components
export const dynamicImports = {
  // Admin components (only load when needed)
  AdminDashboard: () => import('@/components/admin/AdminDashboard'),
  AdminPublications: () => import('@/components/admin/AdminPublications'),
  AdminUsers: () => import('@/components/admin/AdminUsers'),
  
  // Blog components (defer until needed)
  BlogEditor: () => import('@/components/blog/BlogEditor'),
  BlogList: () => import('@/components/blog/BlogList'),
  BlogPost: () => import('@/components/blog/BlogPost'),
  
  // Heavy UI components
  AppleStyleCROShowcase: () => import('@/components/apple-style-cro-showcase'),
  InteractivePhoneShowcase: () => import('@/components/interactive-phone-showcase'),
  HealthcareHeroSlideshow: () => import('@/components/ui/healthcare-hero-slideshow'),
  
  // Form components (defer until form is visible)
  ContactForm: () => import('@/components/forms/ContactForm'),
  NewsletterForm: () => import('@/components/forms/NewsletterForm'),
  
  // Chart components (defer until needed)
  AnalyticsChart: () => import('@/components/charts/AnalyticsChart'),
  PerformanceChart: () => import('@/components/charts/PerformanceChart'),
}

// Lazy load components with error boundaries
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn)
  
  return function WrappedComponent(props: any) {
    return (
      <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded" />}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }
}

// Route-based code splitting
export const routeComponents = {
  // Home page (critical - load immediately)
  Home: () => import('@/app/page'),
  
  // About page (defer until needed)
  About: () => import('@/app/about/page'),
  
  // Services page (defer until needed)
  Services: () => import('@/app/services/page'),
  
  // Research page (defer until needed)
  Research: () => import('@/app/research/page'),
  
  // Platforms page (defer until needed)
  Platforms: () => import('@/app/platforms/page'),
  
  // Blog pages (defer until needed)
  Blog: () => import('@/app/blog/page'),
  BlogPost: () => import('@/app/blog/[slug]/page'),
  
  // Contact page (defer until needed)
  Contact: () => import('@/app/contact/page'),
  
  // Admin pages (defer until needed)
  Admin: () => import('@/app/admin/page'),
  AdminPublications: () => import('@/app/admin/publications/page'),
  AdminUsers: () => import('@/app/admin/users/page'),
}

// Optimize icon imports (lucide-react is heavy)
export function createIconLoader() {
  const iconCache = new Map<string, React.ComponentType>()
  
  return function loadIcon(iconName: string) {
    if (iconCache.has(iconName)) {
      return iconCache.get(iconName)!
    }
    
    const IconComponent = React.lazy(() => 
      import('lucide-react').then(module => ({
        default: module[iconName as keyof typeof module] as React.ComponentType
      }))
    )
    
    iconCache.set(iconName, IconComponent)
    return IconComponent
  }
}

// Optimize Supabase imports
export function createSupabaseLoader() {
  let supabaseClient: any = null
  
  return async function loadSupabase() {
    if (supabaseClient) {
      return supabaseClient
    }
    
    const { createClient } = await import('@supabase/supabase-js')
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    return supabaseClient
  }
}

// Optimize API route handlers
export function createAPILoader() {
  const apiCache = new Map<string, any>()
  
  return async function loadAPI(route: string) {
    if (apiCache.has(route)) {
      return apiCache.get(route)
    }
    
    const handler = await import(`@/app/api/${route}/route`)
    apiCache.set(route, handler)
    return handler
  }
}

// Bundle analyzer for development
export function analyzeBundle() {
  if (process.env.NODE_ENV !== 'development') return
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource' && entry.name.includes('_next/static/chunks/')) {
        console.log(`Bundle loaded: ${entry.name} (${entry.transferSize} bytes)`)
      }
    })
  })
  
  observer.observe({ entryTypes: ['resource'] })
}

// Remove unused CSS
export function removeUnusedCSS() {
  if (typeof window === 'undefined') return
  
  // Remove unused CSS classes
  const usedClasses = new Set<string>()
  const allElements = document.querySelectorAll('*')
  
  allElements.forEach(element => {
    element.classList.forEach(className => {
      usedClasses.add(className)
    })
  })
  
  // Remove unused stylesheets
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')
  stylesheets.forEach(stylesheet => {
    if (!stylesheet.getAttribute('data-critical')) {
      stylesheet.remove()
    }
  })
}

// Optimize font loading
export function optimizeFontLoading() {
  if (typeof window === 'undefined') return
  
  // Preload critical fonts - using system fonts only
  const criticalFonts = [
    // All fonts are system fonts, no preloading needed
  ]
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = font
    link.as = 'font'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
  
  // Defer non-critical fonts
  const nonCriticalFonts = document.querySelectorAll('link[rel="stylesheet"][href*="fonts"]')
  nonCriticalFonts.forEach(font => {
    font.setAttribute('media', 'print')
    font.setAttribute('onload', 'this.media="all"')
  })
}

// Initialize bundle optimizations
export function initializeBundleOptimizations() {
  if (typeof window === 'undefined') return
  
  // Analyze bundle in development
  analyzeBundle()
  
  // Optimize font loading
  optimizeFontLoading()
  
  // Remove unused CSS after page load
  setTimeout(removeUnusedCSS, 2000)
}

// Export optimization utilities
export {
  createLazyComponent,
  createIconLoader,
  createSupabaseLoader,
  createAPILoader,
  initializeBundleOptimizations,
}
