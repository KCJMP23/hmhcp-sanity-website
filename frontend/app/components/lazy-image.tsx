"use client"

import { useState, useEffect, useRef } from "react"
import { OptimizedImage, type OptimizedImageProps } from "./optimized-image"
import { cn } from "@/lib/utils"

interface LazyImageProps extends OptimizedImageProps {
  rootMargin?: string
  threshold?: number
  containerClassName?: string
  aspectRatio?: number
}

export function LazyImage({ rootMargin = "200px 0px", threshold = 0.1, containerClassName, ...props }: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = imageRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [rootMargin, threshold])

  return (
    <div ref={imageRef} className={cn(containerClassName)}>
      {isVisible ? (
        <OptimizedImage {...props} />
      ) : (
        <div
          className="animate-pulse bg-gray-100 dark:bg-gray-800"
          style={{
            width: props.width || "100%",
            height: props.height || "300px",
            aspectRatio: props.aspectRatio ? `${1 / props.aspectRatio}` : undefined,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
