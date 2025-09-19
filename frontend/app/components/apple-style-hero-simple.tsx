"use client"

import { useRef, useEffect } from "react"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/apple-typography"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
import { HeroImage } from "@/components/optimized-image"
import type { ReactNode } from "react"

interface AppleStyleHeroProps {
  title: string
  subtitle: string
  videoSrc?: string
  backgroundImage?: string
  className?: string
  children?: ReactNode
  overlayColor?: string
  height?: "full" | "large" | "medium"
  primaryCTA?: {
    text: string
    href: string
    onClick?: () => void
  }
  secondaryCTA?: {
    text: string
    href: string
    onClick?: () => void
  }
  setIsOpen?: (open: boolean) => void
  setActiveMegaMenu?: (menu: string | null) => void
}


export function AppleStyleHero({
  title,
  subtitle,
  videoSrc,
  backgroundImage,
  className,
  children,
  overlayColor = "from-blue-600/80 via-blue-700/80 to-blue-800/80",
  height = "full",
  primaryCTA,
  secondaryCTA,
  setIsOpen,
  setActiveMegaMenu,
}: AppleStyleHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Handle video playback and dark background class
  useEffect(() => {
    // Add dark background class for navigation transparency
    document.body.classList.add('has-dark-background')
    
    const video = videoRef.current
    if (video) {
      // Play video when it's loaded
      video.addEventListener("loadeddata", () => {
        video.play().catch(() => {})
      })
    }

    // Cleanup
    return () => {
      // Remove dark background class when component unmounts
      document.body.classList.remove('has-dark-background')
      
      if (video) {
        video.removeEventListener("loadeddata", () => {})
      }
    }
  }, [])

  const heightClass = {
    full: "h-screen",
    large: "h-[85vh]",
    medium: "h-[70vh]",
  }[height]

  return (
    <section ref={containerRef} className={cn("relative w-full overflow-hidden", heightClass, className)}>
      {/* Background Media - Fixed z-index layering */}
      {videoSrc ? (
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>
      ) : backgroundImage ? (
        <div 
          className="absolute inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-0" />
      )}

      {/* Gradient Overlay - Enhanced for better text visibility */}
      <div className={`absolute inset-0 bg-gradient-to-r ${overlayColor} z-10`}></div>

      {/* Content - Ensure it's above the overlay */}
      <div className="relative h-full flex flex-col justify-center z-20">
        <div className="container mx-auto px-6">
          <div className="animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <Typography variant="display" className="text-white mb-6">
              {title}
            </Typography>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <Typography variant="heading3" className="text-white/90 max-w-2xl mb-8">
              {subtitle}
            </Typography>
          </div>

          <div className="animate-fade-in flex flex-wrap gap-4" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            {primaryCTA && (
              <Link
                href={primaryCTA.href}
                onClick={() => {
                  if (setIsOpen) setIsOpen(false)
                  if (setActiveMegaMenu) setActiveMegaMenu(null)
                  if (primaryCTA.onClick) primaryCTA.onClick()
                }}
              >
                <LiquidGlassButton variant="primary" size="lg">
                  {primaryCTA.text}
                </LiquidGlassButton>
              </Link>
            )}

            {secondaryCTA && (
              <Link
                href={secondaryCTA.href}
                onClick={() => {
                  if (setIsOpen) setIsOpen(false)
                  if (setActiveMegaMenu) setActiveMegaMenu(null)
                  if (secondaryCTA.onClick) secondaryCTA.onClick()
                }}
              >
                <LiquidGlassButton
                  variant="secondary"
                  size="lg"
                >
                  {secondaryCTA.text}
                </LiquidGlassButton>
              </Link>
            )}

            {children}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-6 h-6 text-white/80" />
      </div>
    </section>
  )
}

