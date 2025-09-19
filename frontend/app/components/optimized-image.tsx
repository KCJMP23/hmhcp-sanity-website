"use client"

import Image, { type ImageProps } from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string
  fetchPriority?: 'high' | 'low' | 'auto'
}

// Generate shimmer placeholder
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

const dataUrl = (w: number, h: number) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = "/abstract-healthcare-technology.png",
  fetchPriority,
  priority,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState(src)

  // Don't render if src is empty string
  if (src === "") {
    return null
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
    setImgSrc(fallbackSrc)
  }
  
  // Preload priority images
  useEffect(() => {
    if (priority && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = typeof src === 'string' ? src : ''
      link.setAttribute('fetchpriority', fetchPriority || 'high')
      document.head.appendChild(link)
    }
  }, [src, priority, fetchPriority])

  return (
    <>
      {isLoading && (
        <div
          className={cn("animate-pulse bg-gray-200 dark:bg-gray-800", className)}
          style={{
            width: props.width,
            height: props.height,
            position: props.fill ? "absolute" : "relative",
            inset: props.fill ? 0 : undefined,
          }}
        />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        className={cn("transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100", className)}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        placeholder={props.width && props.height ? 'blur' : undefined}
        blurDataURL={props.width && props.height ? dataUrl(Number(props.width), Number(props.height)) : undefined}
        sizes={props.fill ? '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, (max-width: 1280px) 60vw, 50vw' : undefined}
        quality={85}
        {...props}
      />
    </>
  )
}

// Hero Image Component with maximum optimizations
export function HeroImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  useEffect(() => {
    // Preload the hero image immediately
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)
    }
  }, [src])
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      fetchPriority="high"
      quality={85}
      sizes="100vw"
      className={className}
    />
  )
}

export type { OptimizedImageProps }
