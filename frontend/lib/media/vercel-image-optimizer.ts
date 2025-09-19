import { ImageProcessor } from './image-processor'

interface VercelOptimizationConfig {
  quality?: number
  width?: number
  height?: number
  format?: 'webp' | 'avif' | 'png' | 'jpeg'
}

export class VercelImageOptimizer {
  private processor: ImageProcessor
  private vercelUrl: string

  constructor() {
    this.processor = new ImageProcessor()
    this.vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || ''
  }

  /**
   * Generate Vercel-optimized image URL
   */
  getOptimizedUrl(
    originalUrl: string,
    config: VercelOptimizationConfig = {}
  ): string {
    const params = new URLSearchParams()
    
    if (config.width) params.append('w', config.width.toString())
    if (config.height) params.append('h', config.height.toString())
    if (config.quality) params.append('q', config.quality.toString())
    if (config.format) params.append('fm', config.format)

    // Use Vercel's Image Optimization API
    if (this.vercelUrl && originalUrl.startsWith('/')) {
      return `/_vercel/image?url=${encodeURIComponent(originalUrl)}&${params.toString()}`
    }

    // Fallback to Next.js Image Optimization
    return `/_next/image?url=${encodeURIComponent(originalUrl)}&${params.toString()}`
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet(
    originalUrl: string,
    widths: number[] = [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    format: 'webp' | 'avif' = 'webp'
  ): string {
    return widths
      .map(width => {
        const url = this.getOptimizedUrl(originalUrl, { width, format })
        return `${url} ${width}w`
      })
      .join(', ')
  }

  /**
   * Generate picture element with multiple formats
   */
  generatePictureData(originalUrl: string) {
    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    
    return {
      sources: [
        {
          type: 'image/avif',
          srcset: this.generateSrcSet(originalUrl, widths, 'avif')
        },
        {
          type: 'image/webp',
          srcset: this.generateSrcSet(originalUrl, widths, 'webp')
        }
      ],
      img: {
        src: this.getOptimizedUrl(originalUrl, { width: 1920 }),
        srcset: this.generateSrcSet(originalUrl, widths, 'webp')
      }
    }
  }

  /**
   * Batch optimize images using Vercel's API
   */
  async batchOptimize(
    imageUrls: string[],
    config: VercelOptimizationConfig = {}
  ): Promise<Map<string, string>> {
    const optimizedUrls = new Map<string, string>()

    for (const url of imageUrls) {
      optimizedUrls.set(url, this.getOptimizedUrl(url, config))
    }

    return optimizedUrls
  }

  /**
   * Preload critical images
   */
  generatePreloadLinks(
    criticalImages: Array<{ url: string; sizes?: string }>
  ): string[] {
    return criticalImages.map(({ url, sizes }) => {
      const webpUrl = this.getOptimizedUrl(url, { format: 'webp' })
      const avifUrl = this.getOptimizedUrl(url, { format: 'avif' })
      
      return [
        `<link rel="preload" as="image" type="image/avif" href="${avifUrl}" ${sizes ? `imagesizes="${sizes}"` : ''}>`,
        `<link rel="preload" as="image" type="image/webp" href="${webpUrl}" ${sizes ? `imagesizes="${sizes}"` : ''}>`
      ].join('\n')
    }).flat()
  }

  /**
   * Healthcare-specific optimization
   */
  async optimizeForHealthcare(
    imageUrl: string,
    options: {
      preserveMetadata?: boolean
      hipaaCompliant?: boolean
      diagnosticQuality?: boolean
    } = {}
  ) {
    const config: VercelOptimizationConfig = {
      quality: options.diagnosticQuality ? 100 : 85,
      format: options.diagnosticQuality ? 'png' : 'webp'
    }

    // Strip metadata for HIPAA compliance
    if (options.hipaaCompliant && !options.preserveMetadata) {
      // Metadata stripping happens server-side
      config.quality = 95 // Higher quality for medical images
    }

    return this.getOptimizedUrl(imageUrl, config)
  }
}