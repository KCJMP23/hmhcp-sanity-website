"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}

export function FadeIn({ children, className, delay = 0, duration = 0.5, direction = "up" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = ref.current
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const directionClasses = {
    up: "translate-y-5",
    down: "-translate-y-5",
    left: "translate-x-5",
    right: "-translate-x-5",
    none: "",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;",
        !isVisible && `opacity-0 ${directionClasses[direction]}`,
        isVisible && "opacity-100 translate-x-0 translate-y-0",
        className
      )}
      style={{
        transitionDuration: `${duration * 1000}ms`,
        transitionDelay: `${delay * 1000}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return <div className={className}>{children}</div>
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  index?: number
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return <div className={cn("h-full", className)}>{children}</div>
}