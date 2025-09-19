/**
 * Advanced Image Optimization System
 * Production-ready image processing utilities with CDN integration
 */

import { type ImageLoaderProps } from 'next/image'

// Performance-optimized image formats
export const SUPPORTED_FORMATS = {
  AVIF: 'image/avif',
  WEBP: 'image/webp',
  JPEG: 'image/jpeg',
  PNG: 'image/png'
} as const

// Responsive breakpoints optimized for Core Web Vitals
export const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  laptop: 1024,
  desktop: 1920,
  ultrawide: 2560
} as const

// Image quality settings for different use cases
export const QUALITY_SETTINGS = {
  hero: 85,
  gallery: 80,
  thumbnail: 75,
  avatar: 70,
  icon: 60
} as const

// CDN providers configuration
type CDNProvider = 'sanity' | 'supabase' | 'cloudflare' | 'custom'

interface ImageOptimizationConfig {
  provider: CDNProvider
  baseUrl?: string
  enableWebP: boolean
  enableAVIF: boolean
  quality: number
  progressive: boolean
  blur: boolean
}

/**
 * Generate optimized image URLs for different CDN providers
 */
export function generateOptimizedUrl(
  src: string,
  width: number,
  quality: number = 80,
  format?: string,
  provider: CDNProvider = 'sanity'
): string {
  if (!src) return ''

  // Handle relative URLs
  if (src.startsWith('/')) {
    return src
  }

  // Sanity CDN optimization
  if (provider === 'sanity' && src.includes('cdn.sanity.io')) {
    const url = new URL(src)
    const params = new URLSearchParams()
    
    params.set('w', width.toString())
    params.set('q', quality.toString())
    params.set('auto', 'format')
    params.set('fit', 'max')
    
    if (format) {
      params.set('fm', format)
    }
    
    url.search = params.toString()
    return url.toString()
  }

  // Supabase storage optimization
  if (provider === 'supabase' && src.includes('supabase.co')) {
    const url = new URL(src)
    const params = new URLSearchParams()
    
    params.set('width', width.toString())
    params.set('quality', quality.toString())
    
    if (format) {
      params.set('format', format)
    }
    
    url.search = params.toString()
    return url.toString()
  }

  // Cloudflare Images optimization
  if (provider === 'cloudflare') {
    const baseUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL
    if (!baseUrl) return src
    
    return `${baseUrl}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${encodeURIComponent(src)}`
  }

  return src
}

/**
 * Custom image loader for Next.js Image component
 */
export const optimizedImageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  const detectedQuality = quality || QUALITY_SETTINGS.gallery
  
  // Detect CDN provider from URL
  let provider: CDNProvider = 'custom'
  if (src.includes('cdn.sanity.io')) provider = 'sanity'
  else if (src.includes('supabase.co')) provider = 'supabase'
  else if (process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL) provider = 'cloudflare'
  
  return generateOptimizedUrl(src, width, detectedQuality, undefined, provider)
}

/**
 * Generate responsive image srcSet
 */
export function generateResponsiveSrcSet(
  src: string,
  sizes: number[],
  quality: number = 80,
  provider: CDNProvider = 'sanity'
): string {
  return sizes
    .map(size => `${generateOptimizedUrl(src, size, quality, undefined, provider)} ${size}w`)
    .join(', ')
}

/**
 * Get optimal image dimensions for different screen sizes
 */
export function getOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight }
  }
  
  const ratio = originalHeight / originalWidth
  return {
    width: maxWidth,
    height: Math.round(maxWidth * ratio)
  }
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)" />
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Preload critical images for faster LCP
 */
export function preloadCriticalImages(imageSources: string[]): void {
  if (typeof window === 'undefined') return
  
  imageSources.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
}

/**
 * Lazy load images with Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private images: Set<HTMLImageElement> = new Set()

  constructor(
    private options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    }
  ) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options)
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const dataSrc = img.dataset.src

        if (dataSrc) {
          img.src = dataSrc
          img.removeAttribute('data-src')
          this.observer?.unobserve(img)
          this.images.delete(img)
        }
      }
    })
  }

  observe(img: HTMLImageElement): void {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img)
      this.images.add(img)
    }
  }

  unobserve(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.unobserve(img)
      this.images.delete(img)
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.images.clear()
    }
  }
}

/**
 * Performance monitoring for images
 */
export interface ImagePerformanceMetrics {
  loadTime: number
  fileSize: number
  format: string
  dimensions: { width: number; height: number }
  cached: boolean
}

export function measureImagePerformance(
  img: HTMLImageElement,
  startTime: number
): ImagePerformanceMetrics {
  const loadTime = performance.now() - startTime
  const cached = img.complete && img.naturalHeight !== 0
  
  return {
    loadTime,
    fileSize: 0, // Would need additional API to get file size
    format: img.src.includes('.avif') ? 'AVIF' : 
           img.src.includes('.webp') ? 'WebP' : 
           img.src.includes('.png') ? 'PNG' : 'JPEG',
    dimensions: {
      width: img.naturalWidth,
      height: img.naturalHeight
    },
    cached
  }
}

/**
 * Image optimization configuration factory
 */
export function createImageConfig(overrides: Partial<ImageOptimizationConfig> = {}): ImageOptimizationConfig {
  return {
    provider: 'sanity',
    enableWebP: true,
    enableAVIF: true,
    quality: QUALITY_SETTINGS.gallery,
    progressive: true,
    blur: true,
    ...overrides
  }
}

/**
 * Validate image URL and format
 */
export function validateImageUrl(src: string): boolean {
  if (!src || typeof src !== 'string') return false
  
  try {
    new URL(src)
    return true
  } catch {
    // Check if it's a relative path
    return src.startsWith('/') || src.startsWith('./') || src.startsWith('../')
  }
}

/**
 * Calculate image aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * Convert aspect ratio to CSS aspect-ratio value
 */
export function aspectRatioToCSS(aspectRatio: number): string {
  return `${aspectRatio} / 1`
}