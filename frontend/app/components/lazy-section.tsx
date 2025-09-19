"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface LazySectionProps {
  children: ReactNode
  className?: string
  height?: string | number
  rootMargin?: string
  threshold?: number
  placeholderClassName?: string
  onVisible?: () => void
}

export function LazySection({
  children,
  className,
  height = "300px",
  rootMargin = "200px 0px",
  threshold = 0.1,
  placeholderClassName,
  onVisible,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = sectionRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (onVisible) onVisible()
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [rootMargin, threshold, onVisible])

  return (
    <div ref={sectionRef} className={cn(className)}>
      {isVisible ? (
        children
      ) : (
        <div
          className={cn("animate-pulse bg-gray-100 dark:bg-gray-800", placeholderClassName)}
          style={{ height: typeof height === "number" ? `${height}px` : height }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
