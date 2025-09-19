"use client"

import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/apple-typography"
import { AppleButton } from "@/components/ui/apple-button"
import Link from "next/link"
import type { ReactNode } from "react"

interface AppleStyleHeroV2Props {
  title: string
  subtitle: string
  videoSrc?: string
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

export function AppleStyleHeroV2({
  title,
  subtitle,
  videoSrc,
  className,
  children,
  overlayColor = "from-blue-600/80 via-blue-700/80 to-blue-800/80",
  height = "full",
  primaryCTA,
  secondaryCTA,
  setIsOpen,
  setActiveMegaMenu,
}: AppleStyleHeroV2Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Smooth Apple-style parallax effects
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const videoOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0])
  
  // Text parallax with Apple's signature movement
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 200])

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener("loadeddata", () => {
      video.play().catch(() => {})
    })

    return () => {
      if (video) {
        video.removeEventListener("loadeddata", () => {})
      }
    }
  }, [])

  const heightClass = {
    full: "min-h-screen h-screen",
    large: "min-h-[600px] h-[85vh]",
    medium: "min-h-[500px] h-[70vh]",
  }[height]

  return (
    <section 
      ref={containerRef} 
      className={cn("relative w-full overflow-hidden", heightClass, className)}
    >
      {/* Enhanced Background */}
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
      ) : (
        <div className="absolute inset-0 w-full h-full">
          {/* Apple-inspired multi-layer gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-950 to-blue-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-transparent to-blue-900/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        </div>
      )}

      {/* Refined overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${overlayColor}`} />
      
      {/* Subtle texture for depth */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(rectangle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Typography with Apple spacing */}
          <motion.div
            style={{ y: titleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-6"
          >
            <Typography 
              variant="display" 
              className="text-white leading-[0.9] tracking-tight"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {title}
            </Typography>
          </motion.div>

          <motion.div
            style={{ y: subtitleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8"
          >
            <Typography 
              variant="heading3" 
              className="text-white/95 max-w-2xl leading-relaxed"
              style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.5,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {subtitle}
            </Typography>
          </motion.div>

          <motion.div
            style={{ y: contentY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col sm:flex-row gap-4"
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
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <AppleButton 
                    variant="primary" 
                    size="lg"
                    className="px-8 py-4 text-base font-medium bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {primaryCTA.text}
                  </AppleButton>
                </motion.div>
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
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <AppleButton
                    variant="outline"
                    size="lg"
                    className="px-8 py-4 text-base font-medium bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-lg transition-all duration-300"
                  >
                    {secondaryCTA.text}
                  </AppleButton>
                </motion.div>
              </Link>
            )}

            {children}
          </motion.div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 1,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-px h-6 bg-gradient-to-b from-transparent to-white/60" />
          <ArrowDown className="w-4 h-4 text-white/80" />
        </motion.div>
      </motion.div>
    </section>
  )
}