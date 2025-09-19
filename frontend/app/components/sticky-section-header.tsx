"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface StickySectionHeaderProps {
  children: React.ReactNode
  className?: string
  stickyClassName?: string
  threshold?: number
  stickyOffset?: number
  onStick?: (isSticky: boolean) => void
}

export function StickySectionHeader({
  children,
  className,
  stickyClassName,
  threshold = 0.1,
  stickyOffset = 0,
  onStick,
}: StickySectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const header = ref.current
    if (!header) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldStick = entry.intersectionRatio < threshold
        setIsSticky(shouldStick)
        onStick?.(shouldStick)
      },
      {
        threshold: [threshold],
        rootMargin: `-${stickyOffset}px 0px 0px 0px`,
      },
    )

    observer.observe(header)
    return () => observer.disconnect()
  }, [threshold, stickyOffset, onStick])

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        className={cn(
          "transition-all duration-300",
          isSticky && "fixed top-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md",
          isSticky && stickyClassName,
        )}
        style={{ top: isSticky ? stickyOffset : 0 }}
      >
        {children}
      </div>
      {isSticky && <div className="w-full invisible" style={{ height: ref.current?.offsetHeight }}></div>}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  isSticky?: boolean
}

export function SectionHeader({ title, subtitle, className, isSticky }: SectionHeaderProps) {
  return (
    <div className={cn("py-6 px-4 sm:px-6 lg:px-8 transition-all duration-300", isSticky ? "py-3" : "py-6", className)}>
      <div className="max-w-7xl mx-auto">
        <h2 className={cn("text-2xl font-medium transition-all duration-300", isSticky ? "text-xl" : "text-2xl")}>
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              "text-gray-600 dark:text-gray-300 transition-all duration-300",
              isSticky ? "text-sm mt-0.5" : "text-base mt-1",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export function StickyProgressHeader({
  title,
  subtitle,
  className,
  sectionId,
}: {
  title: string
  subtitle?: string
  className?: string
  sectionId: string
}) {
  const [isSticky, setIsSticky] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  useEffect(() => {
    const section = document.getElementById(sectionId)
    if (!section) return

    targetRef.current = section as HTMLDivElement
  }, [sectionId])

  return (
    <StickySectionHeader className={className} onStick={setIsSticky} stickyOffset={0}>
      <div className="relative">
        <SectionHeader title={title} subtitle={subtitle} isSticky={isSticky} />
        {isSticky && (
          <motion.div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400" style={{ width }} />
        )}
      </div>
    </StickySectionHeader>
  )
}
