/**
 * Critical Resource Optimization
 * Ensures critical resources load in the correct order for optimal LCP
 */

// Critical resources that must load immediately
export const CRITICAL_RESOURCES = [
  // Critical CSS
  '/_next/static/css/app/layout.css',
  
  // Critical images for LCP
  '/hero-research.jpg',
  '/hero-technology.jpg',
  '/hero-consultation.jpg',
  
  // Critical fonts (using system fonts for better performance)
  // '/fonts/inter-var.woff2', // Font doesn't exist, using system fonts
  
  // Critical JavaScript
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
]

// Non-critical resources that can be deferred
export const DEFERRED_RESOURCES = [
  // API calls are handled by individual components, not preloaded
  // '/api/blog/posts', // Removed - handled by useLatestBlogPosts hook
  // '/api/cms/content', // Removed - handled by useHomepageHero hook
  
  // Analytics
  '/api/track/pageview',
  '/api/track/duration',
  
  // Admin components
  '/_next/static/chunks/pages/admin',
  
  // UI libraries
  '/_next/static/chunks/lucide-react',
  '/_next/static/chunks/@radix-ui',
]

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return
  
  CRITICAL_RESOURCES.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    
    if (resource.endsWith('.css')) {
      link.as = 'style'
    } else if (resource.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
      link.as = 'image'
    } else if (resource.endsWith('.woff2')) {
      link.as = 'font'
      link.crossOrigin = 'anonymous'
    } else {
      link.as = 'script'
    }
    
    link.href = resource
    document.head.appendChild(link)
  })
}

// Defer non-critical resources
export function deferNonCriticalResources() {
  if (typeof window === 'undefined') return
  
  // Defer API calls
  DEFERRED_RESOURCES.forEach(resource => {
    if (resource.startsWith('/api/')) {
      // Defer API calls until after initial render
      setTimeout(() => {
        fetch(resource, { method: 'HEAD' }).catch(() => {})
      }, 2000)
    }
  })
}

// Optimize image loading for LCP
export function optimizeLCPImages() {
  if (typeof window === 'undefined') return
  
  // Find the LCP image (usually the largest image above the fold)
  const images = document.querySelectorAll('img')
  let lcpImage: HTMLImageElement | null = null
  let maxSize = 0
  
  images.forEach(img => {
    const rect = img.getBoundingClientRect()
    const size = rect.width * rect.height
    
    // Check if image is above the fold and larger than current max
    if (rect.top < window.innerHeight && size > maxSize) {
      maxSize = size
      lcpImage = img
    }
  })
  
  if (lcpImage) {
    // Ensure LCP image loads with highest priority
    lcpImage.setAttribute('fetchpriority', 'high')
    lcpImage.setAttribute('loading', 'eager')
    
    // Preload the LCP image
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = lcpImage.src
    document.head.appendChild(link)
  }
}

// Optimize font loading for better LCP
export function optimizeFontLoading() {
  if (typeof window === 'undefined') return
  
  // Remove any references to missing fonts immediately
  const fontLinks = document.querySelectorAll('link[href*="inter-var"], link[href*="fonts/inter-var"]')
  fontLinks.forEach(link => {
    link.remove()
  })
  
  // Ensure system fonts are used with proper fallbacks
  const style = document.createElement('style')
  style.textContent = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    }
    body {
      font-display: swap;
    }
  `
  document.head.appendChild(style)
  
  // Preload critical fonts (using system fonts for better performance)
  const criticalFonts = [
    // No external fonts - using system fonts only
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
  const nonCriticalFonts = document.querySelectorAll('link[href*="fonts"]:not([rel="preload"])')
  nonCriticalFonts.forEach(font => {
    font.setAttribute('media', 'print')
    font.setAttribute('onload', 'this.media="all"')
  })
}

// Optimize CSS loading
export function optimizeCSSLoading() {
  if (typeof window === 'undefined') return
  
  // Ensure critical CSS loads first
  const criticalCSS = document.querySelector('style[data-critical]')
  if (criticalCSS) {
    criticalCSS.setAttribute('media', 'all')
  }
  
  // Defer non-critical CSS
  const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])')
  nonCriticalCSS.forEach(css => {
    css.setAttribute('media', 'print')
    css.setAttribute('onload', 'this.media="all"')
  })
}

// Initialize critical resource optimization
export function initializeCriticalResources() {
  if (typeof window === 'undefined') return
  
  // Run immediately for critical resources
  preloadCriticalResources()
  optimizeLCPImages()
  optimizeFontLoading()
  optimizeCSSLoading()
  
  // Defer non-critical resources
  setTimeout(deferNonCriticalResources, 100)
}

// Monitor LCP and optimize accordingly
export function monitorLCP() {
  if (typeof window === 'undefined') return
  
  let lcpValue = 0
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1] as any
    
    if (lastEntry.startTime > lcpValue) {
      lcpValue = lastEntry.startTime
      
      // If LCP is too high, apply more aggressive optimizations
      if (lcpValue > 2500) {
        console.warn('LCP is high:', lcpValue, 'ms - applying aggressive optimizations')
        applyAggressiveOptimizations()
      }
    }
  })
  
  observer.observe({ entryTypes: ['largest-contentful-paint'] })
}

// Apply aggressive optimizations when LCP is high
function applyAggressiveOptimizations() {
  // Remove non-critical images
  const nonCriticalImages = document.querySelectorAll('img[data-non-critical]')
  nonCriticalImages.forEach(img => {
    (img as HTMLImageElement).style.display = 'none'
  })
  
  // Defer more JavaScript
  const nonCriticalScripts = document.querySelectorAll('script[data-defer]')
  nonCriticalScripts.forEach(script => {
    script.setAttribute('defer', '')
  })
  
  // Reduce image quality for faster loading
  const images = document.querySelectorAll('img')
  images.forEach(img => {
    if (img.src.includes('?')) {
      img.src = img.src.split('?')[0] + '?q=50&w=800'
    }
  })
}
