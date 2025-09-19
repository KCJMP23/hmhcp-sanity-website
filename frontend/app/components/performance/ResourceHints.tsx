'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface ResourceHint {
  rel: 'dns-prefetch' | 'preconnect' | 'prefetch' | 'preload' | 'prerender'
  href: string
  as?: string
  type?: string
  crossOrigin?: string | boolean
}

// Define resource hints for different pages
const resourceHintsByPath: Record<string, ResourceHint[]> = {
  '/': [
    // Preload hero image
    { rel: 'preload', href: '/healthcare-partnership-meeting.png', as: 'image' },
    // Prefetch likely navigation
    { rel: 'prefetch', href: '/services' },
    { rel: 'prefetch', href: '/platforms' },
    { rel: 'prefetch', href: '/about' },
  ],
  '/blog': [
    // Prefetch blog assets
    // { rel: 'prefetch', href: '/api/blog/posts' }, // Removed - handled by component hooks
    // Preconnect to image CDN if using external images
    { rel: 'preconnect', href: 'https://images.hmhealthcare.com' },
  ],
  '/platforms': [
    // Preload platform images
    { rel: 'preload', href: '/intellic-platform-dashboard.png', as: 'image' },
    // Prefetch platform detail pages
    { rel: 'prefetch', href: '/platforms/intellic' },
    { rel: 'prefetch', href: '/platforms/precognitive-health' },
  ],
  '/contact': [
    // Preconnect to form submission endpoint
    { rel: 'preconnect', href: '/api/contact/submit' },
    // Preload reCAPTCHA if using it
    { rel: 'preconnect', href: 'https://www.google.com' },
    { rel: 'preconnect', href: 'https://www.gstatic.com' },
  ],
}

// Global resource hints applied to all pages
const globalResourceHints: ResourceHint[] = [
  // DNS prefetch for external domains
  { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
  { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
  { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
  
  // Preconnect to critical domains
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
]

export function ResourceHints() {
  const pathname = usePathname()

  useEffect(() => {
    // Clean up existing hints
    const existingHints = document.querySelectorAll('link[data-resource-hint="true"]')
    existingHints.forEach(hint => hint.remove())

    // Add global hints
    globalResourceHints.forEach(hint => {
      addResourceHint(hint)
    })

    // Add path-specific hints
    const pathHints = getResourceHintsForPath(pathname)
    pathHints.forEach(hint => {
      addResourceHint(hint)
    })

    // Add dynamic hints based on viewport
    addDynamicResourceHints()

  }, [pathname])

  return null
}

function getResourceHintsForPath(pathname: string): ResourceHint[] {
  // Exact match
  if (resourceHintsByPath[pathname]) {
    return resourceHintsByPath[pathname]
  }

  // Pattern matching for dynamic routes
  if (pathname.startsWith('/blog/')) {
    return [
      { rel: 'prefetch', href: '/blog' },
      { rel: 'preconnect', href: '/api/blog' },
    ]
  }

  if (pathname.startsWith('/platforms/')) {
    return [
      { rel: 'prefetch', href: '/platforms' },
      { rel: 'preconnect', href: '/api/platforms' },
    ]
  }

  return []
}

function addResourceHint(hint: ResourceHint) {
  // Check if hint already exists
  const selector = `link[rel="${hint.rel}"][href="${hint.href}"]`
  if (document.querySelector(selector)) {
    return
  }

  const link = document.createElement('link')
  link.rel = hint.rel
  link.href = hint.href
  link.setAttribute('data-resource-hint', 'true')

  if (hint.as) {
    link.as = hint.as
  }

  if (hint.type) {
    link.type = hint.type
  }

  if (hint.crossOrigin) {
    link.crossOrigin = hint.crossOrigin === true ? 'anonymous' : hint.crossOrigin
  }

  document.head.appendChild(link)
}

function addDynamicResourceHints() {
  // Prefetch visible links in viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement
          const href = link.href
          
          // Only prefetch internal links
          if (href && href.startsWith(window.location.origin)) {
            const url = new URL(href)
            addResourceHint({ rel: 'prefetch', href: url.pathname })
          }
          
          observer.unobserve(link)
        }
      })
    }, {
      rootMargin: '50px',
    })

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"]')
    links.forEach(link => observer.observe(link))
  }

  // Preload images about to enter viewport
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          
          // Add preload hint for next/image generated srcset
          const srcset = img.getAttribute('srcset')
          if (srcset) {
            const sources = srcset.split(',').map(s => s.trim().split(' ')[0])
            // Preload the largest image
            const largestSrc = sources[sources.length - 1]
            if (largestSrc) {
              addResourceHint({ rel: 'preload', href: largestSrc, as: 'image' })
            }
          }
          
          imageObserver.unobserve(img)
        }
      })
    }, {
      rootMargin: '250px',
    })

    // Observe all images
    const images = document.querySelectorAll('img[loading="lazy"]')
    images.forEach(img => imageObserver.observe(img))
  }
}

// Resource priority hints for critical resources
export function ResourcePriorityHints() {
  useEffect(() => {
    // Set fetchpriority for critical images
    const heroImages = document.querySelectorAll('img[data-hero="true"]')
    heroImages.forEach(img => {
      img.setAttribute('fetchpriority', 'high')
    })

    // Set fetchpriority for non-critical images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]')
    lazyImages.forEach(img => {
      img.setAttribute('fetchpriority', 'low')
    })

    // Defer non-critical scripts
    const deferScripts = document.querySelectorAll('script[data-defer="true"]')
    deferScripts.forEach(script => {
      (script as HTMLScriptElement).defer = true
    })

  }, [])

  return null
}

// Adaptive loading based on connection speed
export function useAdaptiveLoading() {
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      // Adjust based on connection type
      if (connection.effectiveType === '4g') {
        // High quality for fast connections
        document.documentElement.setAttribute('data-connection', 'fast')
      } else if (connection.effectiveType === '3g') {
        // Medium quality for moderate connections
        document.documentElement.setAttribute('data-connection', 'moderate')
      } else {
        // Low quality for slow connections
        document.documentElement.setAttribute('data-connection', 'slow')
      }

      // Listen for connection changes
      connection.addEventListener('change', () => {
        if (connection.effectiveType === '4g') {
          document.documentElement.setAttribute('data-connection', 'fast')
        } else if (connection.effectiveType === '3g') {
          document.documentElement.setAttribute('data-connection', 'moderate')
        } else {
          document.documentElement.setAttribute('data-connection', 'slow')
        }
      })
    }
  }, [])
}