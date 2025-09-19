/**
 * Image Optimization Pipeline
 * 
 * Comprehensive image optimization for marketing website
 * Includes lazy loading, responsive images, and CDN integration
 */

import { cacheManager, CacheNamespace } from '../cache/redis-cache-manager'

export interface ImageOptimizationConfig {
  quality?: number
  formats?: Array<'webp' | 'avif' | 'jpeg' | 'png'>
  sizes?: string
  deviceSizes?: number[]
  imageSizes?: number[]
  minimumCacheTTL?: number
  dangerouslyAllowSVG?: boolean
  contentSecurityPolicy?: string
  domains?: string[]
  loader?: 'default' | 'cloudinary' | 'imgix' | 'akamai' | 'custom'
}

export interface OptimizedImage {
  src: string
  srcSet: string
  webpSrcSet?: string
  avifSrcSet?: string
  sizes: string
  width: number
  height: number
  blurDataURL?: string
  placeholder?: 'blur' | 'empty'
  priority?: boolean
  loading?: 'lazy' | 'eager'
}

/**
 * Default image optimization settings
 */
export const defaultImageConfig: ImageOptimizationConfig = {
  quality: 85,
  formats: ['webp', 'jpeg'],
  deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2560, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 31536000, // 1 year
  dangerouslyAllowSVG: false,
  domains: [
    'hmhcp.com',
    'cdn.hmhcp.com',
    'images.unsplash.com',
    'res.cloudinary.com'
  ],
  loader: 'default'
}

/**
 * Image optimization pipeline
 */
export class ImageOptimizationPipeline {
  private config: ImageOptimizationConfig
  private cdnUrl: string

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = { ...defaultImageConfig, ...config }
    this.cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || ''
  }

  /**
   * Generate optimized image URLs
   */
  public generateOptimizedUrls(
    src: string,
    width: number,
    height: number,
    options?: {
      quality?: number
      format?: 'webp' | 'avif' | 'jpeg' | 'png'
    }
  ): string {
    const quality = options?.quality || this.config.quality
    const format = options?.format || 'webp'

    // Use CDN if available
    if (this.cdnUrl) {
      return this.generateCdnUrl(src, width, height, quality, format)
    }

    // Use Next.js Image Optimization API
    return this.generateNextImageUrl(src, width, height, quality)
  }

  /**
   * Generate CDN URL with transformations
   */
  private generateCdnUrl(
    src: string,
    width: number,
    height: number,
    quality: number = 85,
    format: string = 'webp'
  ): string {
    // Cloudinary example
    if (this.config.loader === 'cloudinary') {
      const cloudinaryUrl = this.cdnUrl
      const transformations = [
        `w_${width}`,
        `h_${height}`,
        `q_${quality}`,
        `f_${format}`,
        'c_fill',
        'g_auto'
      ].join(',')
      
      return `${cloudinaryUrl}/image/upload/${transformations}/${src}`
    }

    // Imgix example
    if (this.config.loader === 'imgix') {
      const params = new URLSearchParams({
        w: width.toString(),
        h: height.toString(),
        q: quality.toString(),
        auto: 'format,compress',
        fit: 'crop'
      })
      
      return `${this.cdnUrl}/${src}?${params.toString()}`
    }

    // Default CDN URL
    return `${this.cdnUrl}/${src}?w=${width}&h=${height}&q=${quality}&f=${format}`
  }

  /**
   * Generate Next.js Image Optimization URL
   */
  private generateNextImageUrl(
    src: string,
    width: number,
    height: number,
    quality: number = 85
  ): string {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: quality.toString()
    })
    
    return `/_next/image?${params.toString()}`
  }

  /**
   * Generate responsive srcSet
   */
  public generateSrcSet(
    src: string,
    sizes: number[],
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  ): string {
    return sizes
      .map(size => {
        const url = this.generateOptimizedUrls(src, size, 0, { format })
        return `${url} ${size}w`
      })
      .join(', ')
  }

  /**
   * Generate blur placeholder
   */
  public async generateBlurPlaceholder(src: string): Promise<string> {
    // Check cache first
    const cacheKey = `blur:${src}`
    const cached = await cacheManager.get<string>(cacheKey, {
      namespace: CacheNamespace.IMAGE
    })
    
    if (cached) {
      return cached
    }

    // Generate tiny blur image (10px wide)
    const blurUrl = this.generateOptimizedUrls(src, 10, 0, {
      quality: 10,
      format: 'jpeg'
    })

    // In production, you would fetch and base64 encode the image
    // For now, return a placeholder
    const blurDataURL = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...`

    // Cache the result
    await cacheManager.set(cacheKey, blurDataURL, {
      namespace: CacheNamespace.IMAGE,
      ttl: 86400 * 30 // 30 days
    })

    return blurDataURL
  }

  /**
   * Optimize image for marketing content
   */
  public async optimizeMarketingImage(
    src: string,
    options: {
      width: number
      height: number
      alt: string
      priority?: boolean
      className?: string
    }
  ): Promise<OptimizedImage> {
    const { width, height, priority = false } = options

    // Generate multiple formats
    const formats = this.config.formats || ['webp', 'jpeg']
    const sizes = this.config.deviceSizes || defaultImageConfig.deviceSizes!

    // Filter sizes to only those <= width
    const relevantSizes = sizes.filter(size => size <= width * 2)

    const srcSet = this.generateSrcSet(src, relevantSizes, 'jpeg')
    const webpSrcSet = formats.includes('webp') 
      ? this.generateSrcSet(src, relevantSizes, 'webp')
      : undefined
    const avifSrcSet = formats.includes('avif')
      ? this.generateSrcSet(src, relevantSizes, 'avif')
      : undefined

    // Generate blur placeholder for non-priority images
    const blurDataURL = !priority 
      ? await this.generateBlurPlaceholder(src)
      : undefined

    return {
      src: this.generateOptimizedUrls(src, width, height),
      srcSet,
      webpSrcSet,
      avifSrcSet,
      sizes: this.generateSizesAttribute(width),
      width,
      height,
      blurDataURL,
      placeholder: blurDataURL ? 'blur' : 'empty',
      priority,
      loading: priority ? 'eager' : 'lazy'
    }
  }

  /**
   * Generate sizes attribute for responsive images
   */
  private generateSizesAttribute(maxWidth: number): string {
    // Common breakpoints for marketing site
    const breakpoints = [
      { width: 640, vw: 100 },
      { width: 768, vw: 100 },
      { width: 1024, vw: 50 },
      { width: 1280, vw: 33 },
      { width: 1536, vw: 33 }
    ]

    const sizes = breakpoints
      .filter(bp => bp.width <= maxWidth)
      .map(bp => `(max-width: ${bp.width}px) ${bp.vw}vw`)
      .join(', ')

    return sizes + `, ${maxWidth}px`
  }

  /**
   * Preload critical images
   */
  public generatePreloadLinks(images: Array<{
    src: string
    width: number
    height: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  }>): string[] {
    return images.map(({ src, width, height, format = 'webp' }) => {
      const url = this.generateOptimizedUrls(src, width, height, { format })
      return `<link rel="preload" as="image" href="${url}" type="image/${format}">`
    })
  }

  /**
   * Generate picture element for maximum compatibility
   */
  public generatePictureElement(
    src: string,
    options: {
      width: number
      height: number
      alt: string
      className?: string
      sizes?: string
    }
  ): string {
    const { width, height, alt, className = '', sizes } = options
    const formats = this.config.formats || ['webp', 'jpeg']
    const deviceSizes = this.config.deviceSizes || defaultImageConfig.deviceSizes!

    let pictureHtml = '<picture>'

    // Add AVIF source if supported
    if (formats.includes('avif')) {
      const avifSrcSet = this.generateSrcSet(src, deviceSizes, 'avif')
      pictureHtml += `
        <source
          type="image/avif"
          srcset="${avifSrcSet}"
          ${sizes ? `sizes="${sizes}"` : ''}
        />`
    }

    // Add WebP source if supported
    if (formats.includes('webp')) {
      const webpSrcSet = this.generateSrcSet(src, deviceSizes, 'webp')
      pictureHtml += `
        <source
          type="image/webp"
          srcset="${webpSrcSet}"
          ${sizes ? `sizes="${sizes}"` : ''}
        />`
    }

    // Fallback img element
    const jpegSrcSet = this.generateSrcSet(src, deviceSizes, 'jpeg')
    pictureHtml += `
      <img
        src="${this.generateOptimizedUrls(src, width, height, { format: 'jpeg' })}"
        srcset="${jpegSrcSet}"
        ${sizes ? `sizes="${sizes}"` : ''}
        width="${width}"
        height="${height}"
        alt="${alt}"
        class="${className}"
        loading="lazy"
        decoding="async"
      />`

    pictureHtml += '</picture>'

    return pictureHtml
  }
}

/**
 * Lazy loading observer for images
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver | null = null
  private images: Set<HTMLImageElement> = new Set()

  constructor(options?: IntersectionObserverInit) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px',
          threshold: 0.01,
          ...options
        }
      )
    }
  }

  /**
   * Handle intersection events
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        this.loadImage(img)
        this.observer?.unobserve(img)
        this.images.delete(img)
      }
    })
  }

  /**
   * Load image
   */
  private loadImage(img: HTMLImageElement): void {
    // Set actual src from data-src
    const src = img.dataset.src
    const srcset = img.dataset.srcset
    
    if (src) {
      img.src = src
      img.removeAttribute('data-src')
    }
    
    if (srcset) {
      img.srcset = srcset
      img.removeAttribute('data-srcset')
    }

    // Add loaded class for CSS transitions
    img.classList.add('loaded')
    
    // Fire custom event
    img.dispatchEvent(new CustomEvent('lazyloaded'))
  }

  /**
   * Observe image for lazy loading
   */
  public observe(img: HTMLImageElement): void {
    if (this.observer && !this.images.has(img)) {
      this.images.add(img)
      this.observer.observe(img)
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img)
    }
  }

  /**
   * Observe all images with data-src
   */
  public observeAll(container: HTMLElement = document.body): void {
    const images = container.querySelectorAll<HTMLImageElement>('img[data-src]')
    images.forEach(img => this.observe(img))
  }

  /**
   * Disconnect observer
   */
  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.images.clear()
    }
  }
}

// Export singleton instances
export const imageOptimizer = new ImageOptimizationPipeline()
export const imageLazyLoader = new ImageLazyLoader()

/**
 * React hook for image optimization
 */
export function useOptimizedImage(
  src: string,
  options: {
    width: number
    height: number
    priority?: boolean
  }
) {
  const [optimized, setOptimized] = useState<OptimizedImage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const optimize = async () => {
      try {
        const result = await imageOptimizer.optimizeMarketingImage(src, {
          ...options,
          alt: '' // Alt should be passed separately
        })
        setOptimized(result)
      } catch (error) {
        console.error('Failed to optimize image:', error)
      } finally {
        setLoading(false)
      }
    }

    optimize()
  }, [src, options.width, options.height, options.priority])

  return { optimized, loading }
}

// Add missing import
import { useState, useEffect } from 'react'