"use client"

import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/apple-typography"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Parallax effect for video
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const videoOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0])

  // Parallax effect for text
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 200])

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Play video when it's loaded
    video.addEventListener("loadeddata", () => {
      video.play().catch(() => {})
    })

    // Cleanup
    return () => {
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
      {/* Background Media with Parallax */}
      {videoSrc ? (
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{
            scale: videoScale,
            opacity: videoOpacity,
          }}
        >
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
        </motion.div>
      ) : backgroundImage ? (
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{
            scale: videoScale,
            opacity: videoOpacity,
          }}
        >
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            aria-hidden="true"
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900 via-blue-900 to-blue-900" />
      )}

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${overlayColor}`}></div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center">
        <div className="container mx-auto px-6">
          <motion.div
            style={{ y: titleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Typography variant="display" className="text-white mb-6">
              {title}
            </Typography>
          </motion.div>

          <motion.div
            style={{ y: subtitleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Typography variant="heading3" className="text-white/90 max-w-2xl mb-8">
              {subtitle}
            </Typography>
          </motion.div>

          <motion.div
            style={{ y: contentY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-wrap gap-4"
          >
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
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 1,
          ease: [0.25, 0.1, 0.25, 1],
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          repeatDelay: 0.5,
        }}
      >
        <ArrowDown className="w-6 h-6 text-white/80" />
      </motion.div>
    </section>
  )
}
