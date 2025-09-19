// components/ui/optimized-image.tsx
// Optimized Image component for better LCP performance
// This doesn't change the design system, just optimizes loading

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' }
    )

    const imgElement = document.querySelector(`[data-src="${src}"]`)
    if (imgElement) {
      observer.observe(imgElement)
    }

    return () => observer.disconnect()
  }, [src, priority])

  // Generate optimized src for better performance
  const getOptimizedSrc = (originalSrc: string) => {
    // If it's already optimized, return as is
    if (originalSrc.includes('_optimized') || originalSrc.startsWith('data:')) {
      return originalSrc
    }

    // For local images, add optimization parameters
    if (originalSrc.startsWith('/')) {
      return originalSrc
    }

    return originalSrc
  }

  const optimizedSrc = getOptimizedSrc(src)

  // Generate blur placeholder if not provided
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL
    
    // Create a simple blur placeholder
    const canvas = document.createElement('canvas')
    canvas.width = 20
    canvas.height = 20
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, 20, 20)
    }
    return canvas.toDataURL()
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  if (!isInView && !priority) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
        data-src={src}
      />
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || generateBlurDataURL()}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

export default OptimizedImage
