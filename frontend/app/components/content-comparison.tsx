"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface BeforeAfterSliderProps {
  beforeImage: {
    src: string
    alt: string
  }
  afterImage: {
    src: string
    alt: string
  }
  className?: string
  beforeLabel?: string
  afterLabel?: string
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  className,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMouseDown = () => {
    isDragging.current = true
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.min(Math.max(x, 0), 100))
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    if (!containerRef.current) return

    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.min(Math.max(x, 0), 100))
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      handleTouchMove(e)
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("mousemove", handleGlobalMouseMove)
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: true })

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("touchmove", handleGlobalTouchMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden ", className)}
      style={{ aspectRatio: "16/9" }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Before Image (Full width) */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={beforeImage.src || "/placeholder.svg"}
          alt={beforeImage.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {beforeLabel && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-sm font-medium">
            {beforeLabel}
          </div>
        )}
      </div>

      {/* After Image (Clipped) */}
      <div className="absolute inset-0 h-full overflow-hidden" style={{ width: `${sliderPosition}%` }}>
        <div className="relative w-full h-full" style={{ width: `${100 / (sliderPosition / 100)}%` }}>
          <Image
            src={afterImage.src || "/placeholder.svg"}
            alt={afterImage.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        {afterLabel && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-sm font-medium">
            {afterLabel}
          </div>
        )}
      </div>

      {/* Slider Control */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

interface SideBySideComparisonProps {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
  leftLabel?: string
  rightLabel?: string
  className?: string
}

export function SideBySideComparison({
  leftContent,
  rightContent,
  leftLabel = "Before",
  rightLabel = "After",
  className,
}: SideBySideComparisonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8", className)}>
      <div className="relative premium-card overflow-hidden">
        {leftLabel && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-sm font-medium z-10">
            {leftLabel}
          </div>
        )}
        <div className="p-6">{leftContent}</div>
      </div>
      <div className="relative premium-card overflow-hidden">
        {rightLabel && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-sm font-medium z-10">
            {rightLabel}
          </div>
        )}
        <div className="p-6">{rightContent}</div>
      </div>
    </div>
  )
}

interface TabbedComparisonProps {
  tabs: {
    label: string
    content: React.ReactNode
  }[]
  className?: string
}

export function TabbedComparison({ tabs, className }: TabbedComparisonProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className={cn("premium-card overflow-hidden", className)}>
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2  transition-all ${
              activeTab === index
                ? "bg-blue-600 text-white dark:text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-6">
        {tabs.map((tab, index) => (
          <div key={index} className={cn(activeTab === index ? "block" : "hidden")}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
