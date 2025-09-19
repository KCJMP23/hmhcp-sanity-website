"use client"

import { useState, useEffect } from "react"
import { OptimizedImage, type OptimizedImageProps } from "./optimized-image"
import { supportsWebp, supportsAvif } from "@/utils/performance"

interface WebPImageProps extends OptimizedImageProps {
  fallbackSrc?: string
}

export function WebPImage({ src, fallbackSrc, ...props }: WebPImageProps) {
  const [bestSrc, setBestSrc] = useState<string | typeof src | null>(null)

  useEffect(() => {
    if (!src) {
      setBestSrc(fallbackSrc || null)
      return
    }

    // Check for modern format support
    // For StaticImport, we can't modify the src, so just use it as is
    if (typeof src !== 'string') {
      setBestSrc(src)
      return
    }
    
    const srcString = src
    
    const checkFormats = async () => {
      const avifSupported = await supportsAvif()
      
      if (avifSupported && srcString.includes(".")) {
        // Try to use AVIF version if available
        const avifSrc = srcString.replace(/\.(jpe?g|png)$/i, ".avif")
        setBestSrc(avifSrc)
      } else if (supportsWebp() && srcString.includes(".")) {
        // Fall back to WebP
        const webpSrc = srcString.replace(/\.(jpe?g|png)$/i, ".webp")
        setBestSrc(webpSrc)
      } else {
        // Use original or fallback
        setBestSrc(srcString || fallbackSrc || null)
      }
    }
    
    checkFormats()
  }, [src, fallbackSrc])

  if (!bestSrc) return null

  return <OptimizedImage src={bestSrc} {...props} />
}
