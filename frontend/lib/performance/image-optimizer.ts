/**
 * Image Optimization Pipeline
 * Implements aggressive image optimization for better performance
 */

// Image optimization configuration
export const IMAGE_CONFIG = {
  // Quality settings
  quality: {
    critical: 85,    // Above-the-fold images
    normal: 75,      // Regular images
    background: 60,  // Background images
  },
  
  // Size breakpoints for responsive images
  breakpoints: [640, 750, 828, 1080, 1200, 1920],
  
  // Format preferences (in order of preference)
  formats: ['avif', 'webp', 'jpeg', 'png'],
  
  // Lazy loading threshold
  lazyThreshold: 50, // pixels
}

// Check if browser supports modern image formats
export function getSupportedFormats(): string[] {
  if (typeof window === 'undefined') return ['jpeg']
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  const supportedFormats = ['jpeg'] // Always supported
  
  // Check WebP support
  try {
    const webpDataURL = canvas.toDataURL('image/webp')
    if (webpDataURL.indexOf('data:image/webp') === 0) {
      supportedFormats.unshift('webp')
    }
  } catch (e) {
    // WebP not supported
  }
  
  // Check AVIF support
  try {
    const avifDataURL = canvas.toDataURL('image/avif')
    if (avifDataURL.indexOf('data:image/avif') === 0) {
      supportedFormats.unshift('avif')
    }
  } catch (e) {
    // AVIF not supported
  }
  
  return supportedFormats
}

// Generate optimized image URL
export function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: 'critical' | 'normal' | 'background' = 'normal'
): string {
  if (!src) return ''
  
  // If it's already an optimized URL, return as-is
  if (src.includes('?')) return src
  
  const supportedFormats = getSupportedFormats()
  const preferredFormat = supportedFormats[0]
  const qualityValue = IMAGE_CONFIG.quality[quality]
  
  // For Next.js Image component, use built-in optimization
  if (src.startsWith('/') && !src.includes('_next/image')) {
    // Check if the image exists first
    if (src.endsWith('.svg')) {
      // SVGs don't need Next.js optimization
      return src
    }
    
    const params = new URLSearchParams()
    
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('q', qualityValue.toString())
    params.set('f', preferredFormat)
    
    return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`
  }
  
  // For external images, add optimization parameters
  if (src.startsWith('http')) {
    const url = new URL(src)
    url.searchParams.set('q', qualityValue.toString())
    url.searchParams.set('f', preferredFormat)
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    return url.toString()
  }
  
  return src
}

// Generate responsive image srcSet
export function generateResponsiveSrcSet(
  src: string,
  quality: 'critical' | 'normal' | 'background' = 'normal'
): string {
  const supportedFormats = getSupportedFormats()
  const preferredFormat = supportedFormats[0]
  const qualityValue = IMAGE_CONFIG.quality[quality]
  
  return IMAGE_CONFIG.breakpoints
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(src, width, undefined, quality)
      return `${optimizedUrl} ${width}w`
    })
    .join(', ')
}

// Lazy load images with intersection observer
export function lazyLoadImages() {
  if (typeof window === 'undefined') return
  
  const images = document.querySelectorAll('img[data-src]')
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src!
        
        // Load optimized image
        img.src = getOptimizedImageUrl(src, undefined, undefined, 'normal')
        img.removeAttribute('data-src')
        
        // Add loading animation
        img.style.opacity = '0'
        img.style.transition = 'opacity 0.3s ease'
        
        img.onload = () => {
          img.style.opacity = '1'
        }
        
        imageObserver.unobserve(img)
      }
    })
  }, {
    rootMargin: `${IMAGE_CONFIG.lazyThreshold}px 0px`,
    threshold: 0.1
  })
  
  images.forEach(img => imageObserver.observe(img))
}

// Preload critical images
export function preloadCriticalImages() {
  if (typeof window === 'undefined') return
  
  const criticalImages = [
    '/hero-research.jpg',
    '/hero-technology.jpg',
    '/hero-consultation.jpg',
    '/hmhcp-logo-white-real.svg',
    '/hmhcp-logo-black.svg'
  ]
  
  criticalImages.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getOptimizedImageUrl(src, undefined, undefined, 'critical')
    document.head.appendChild(link)
  })
}

// Optimize existing images on the page
export function optimizeExistingImages() {
  if (typeof window === 'undefined') return
  
  const images = document.querySelectorAll('img:not([data-optimized])')
  
  images.forEach(img => {
    const imgElement = img as HTMLImageElement
    const src = imgElement.src
    if (!src) return
    
    // Skip SVGs - they don't need Next.js optimization
    if (src.endsWith('.svg')) {
      imgElement.setAttribute('data-optimized', 'true')
      return
    }
    
    // Determine quality based on image position
    const rect = imgElement.getBoundingClientRect()
    const isAboveFold = rect.top < window.innerHeight
    const isBackground = imgElement.style.position === 'absolute' || 
                        imgElement.classList.contains('background')
    
    let quality: 'critical' | 'normal' | 'background' = 'normal'
    if (isAboveFold) quality = 'critical'
    if (isBackground) quality = 'background'
    
    // Generate optimized URL
    const optimizedUrl = getOptimizedImageUrl(src, undefined, undefined, quality)
    
    if (optimizedUrl !== src) {
      imgElement.src = optimizedUrl
      imgElement.setAttribute('data-optimized', 'true')
    }
  })
}

// Generate blur placeholder for images
export function generateBlurPlaceholder(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f0f0f0')
  gradient.addColorStop(1, '#e0e0e0')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

// Optimize image loading for LCP
export function optimizeLCPImages() {
  if (typeof window === 'undefined') return
  
  // Find the largest image above the fold
  const images = document.querySelectorAll('img')
  let lcpImage: HTMLImageElement | null = null
  let maxSize = 0
  
  images.forEach(img => {
    const rect = img.getBoundingClientRect()
    const size = rect.width * rect.height
    
    if (rect.top < window.innerHeight && size > maxSize) {
      maxSize = size
      lcpImage = img
    }
  })
  
  if (lcpImage) {
    // Optimize LCP image with highest quality
    const optimizedSrc = getOptimizedImageUrl(lcpImage.src, undefined, undefined, 'critical')
    lcpImage.src = optimizedSrc
    
    // Set high priority
    lcpImage.setAttribute('fetchpriority', 'high')
    lcpImage.setAttribute('loading', 'eager')
    
    // Preload the optimized image
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = optimizedSrc
    document.head.appendChild(link)
  }
}

// Initialize image optimizations
export function initializeImageOptimizations() {
  if (typeof window === 'undefined') return
  
  // Preload critical images
  preloadCriticalImages()
  
  // Optimize LCP images
  optimizeLCPImages()
  
  // Lazy load non-critical images
  lazyLoadImages()
  
  // Optimize existing images
  setTimeout(optimizeExistingImages, 100)
}

// Monitor image loading performance
export function monitorImagePerformance() {
  if (typeof window === 'undefined') return
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
        const resourceEntry = entry as PerformanceResourceTiming
        const loadTime = resourceEntry.responseEnd - resourceEntry.startTime
        
        if (loadTime > 1000) {
          console.warn('Slow image load detected:', entry.name, loadTime, 'ms')
        }
      }
    })
  })
  
  observer.observe({ entryTypes: ['resource'] })
}
