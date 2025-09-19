'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  quality?: number
  className?: string
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fill?: boolean
  style?: React.CSSProperties
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
  className = '',
  sizes = '100vw',
  placeholder = 'blur',
  blurDataURL,
  fill = false,
  style
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    )

    const element = document.getElementById(`img-${src.replace(/[^a-zA-Z0-9]/g, '')}`)
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [src, priority, isInView])

  // Generate responsive srcSet for better performance
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [640, 750, 828, 1080, 1200, 1920]
    return sizes
      .map(size => `${baseSrc}?w=${size} ${size}w`)
      .join(', ')
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">Image failed to load</span>
      </div>
    )
  }

  return (
    <div 
      id={`img-${src.replace(/[^a-zA-Z0-9]/g, '')}`}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          sizes={sizes}
          placeholder={placeholder}
          blurDataURL={blurDataURL || defaultBlurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            ...style
          }}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  )
}

// Hook for image optimization utilities
export function useImageOptimization() {
  const [isWebPSupported, setIsWebPSupported] = useState(false)
  const [isAVIFSupported, setIsAVIFSupported] = useState(false)

  useEffect(() => {
    // Check WebP support
    const webpCanvas = document.createElement('canvas')
    webpCanvas.width = 1
    webpCanvas.height = 1
    const webpDataURL = webpCanvas.toDataURL('image/webp')
    setIsWebPSupported(webpDataURL.indexOf('data:image/webp') === 0)

    // Check AVIF support
    const avifCanvas = document.createElement('canvas')
    avifCanvas.width = 1
    avifCanvas.height = 1
    const avifDataURL = avifCanvas.toDataURL('image/avif')
    setIsAVIFSupported(avifDataURL.indexOf('data:image/avif') === 0)
  }, [])

  const getOptimalFormat = (originalSrc: string) => {
    if (isAVIFSupported) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.avif')
    } else if (isWebPSupported) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    }
    return originalSrc
  }

  const preloadImage = (src: string) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  }

  return {
    isWebPSupported,
    isAVIFSupported,
    getOptimalFormat,
    preloadImage
  }
}
