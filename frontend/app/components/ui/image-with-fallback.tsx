"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageWithFallbackProps {
  src: string
  fallbackSrc?: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  containerClassName?: string
  quality?: number
  sizes?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
}

export function ImageWithFallback({
  src,
  fallbackSrc = "/placeholder.svg",
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  quality = 75,
  sizes,
  style,
  onLoad,
  onError,
  objectFit = "cover",
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [svgFallbackTried, setSvgFallbackTried] = useState(false)

  const handleError = () => {
    // First try: If PNG/JPG fails, try SVG version
    if (!svgFallbackTried && (imgSrc.endsWith('.png') || imgSrc.endsWith('.jpg') || imgSrc.endsWith('.jpeg'))) {
      const svgVersion = imgSrc.replace(/\.(png|jpg|jpeg)$/i, '.svg')
      setImgSrc(svgVersion)
      setSvgFallbackTried(true)
    }
    // Second try: Use the fallback source
    else if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", containerClassName)}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )}
        <Image
          src={imgSrc}
          alt={alt}
          fill
          priority={priority}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          quality={quality}
          sizes={sizes || (fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined)}
          style={{ objectFit, ...style }}
          onError={handleError}
          onLoad={handleLoad}
        />
      </div>
    )
  }

  return (
    <div className={cn("relative inline-block", containerClassName)}>
      {isLoading && width && height && (
        <div 
          className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width || 500}
        height={height || 500}
        priority={priority}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        quality={quality}
        sizes={sizes}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}