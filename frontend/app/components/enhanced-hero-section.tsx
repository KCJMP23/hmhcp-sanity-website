"use client"

import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { Typography } from "@/components/ui/apple-typography"
import { AppleStyleButton } from "@/components/apple-style-button"
import Link from "next/link"

interface EnhancedHeroProps {
  title: string
  subtitle: string
  videoSrc: string
  backgroundOverlay?: string
  height?: "full" | "large" | "medium"
  buttons?: {
    primary?: {
      text: string
      href: string
    }
    secondary?: {
      text: string
      href: string
    }
  }
}

export function EnhancedHeroSection({
  title,
  subtitle,
  videoSrc,
  backgroundOverlay = "from-blue-900/80 to-blue-700/80",
  height = "full",
  buttons,
}: EnhancedHeroProps) {
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
    <section ref={containerRef} className={`relative w-full overflow-hidden ${heightClass}`}>
      {/* Video Background with Parallax */}
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

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${backgroundOverlay}`}></div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center">
        <div className="container mx-auto px-6">
          <motion.div
            style={{ y: titleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.42, 0, 0.58, 1] }}
          >
            <Typography as="h1" variant="display" className="text-white mb-6">
              {title}
            </Typography>
          </motion.div>

          <motion.div
            style={{ y: subtitleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.42, 0, 0.58, 1] }}
          >
            <Typography as="p" variant="heading3" className="text-white/90 font-light max-w-2xl mb-8">
              {subtitle}
            </Typography>
          </motion.div>

          {buttons && (
            <motion.div
              style={{ y: contentY }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.42, 0, 0.58, 1] }}
              className="flex flex-wrap gap-4"
            >
              {buttons.primary && (
                <Link href={buttons.primary.href}>
                  <AppleStyleButton variant="primary" size="large">
                    {buttons.primary.text}
                  </AppleStyleButton>
                </Link>
              )}
              {buttons.secondary && (
                <Link href={buttons.secondary.href}>
                  <AppleStyleButton variant="secondary" size="large">
                    {buttons.secondary.text}
                  </AppleStyleButton>
                </Link>
              )}
            </motion.div>
          )}
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
          ease: [0.42, 0, 0.58, 1],
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
