"use client"

import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { Typography } from "@/components/ui/apple-typography"
import Link from "next/link"

interface EnhancedHeroProps {
  title: string
  subtitle: string
  videoSrc?: string
  imageSrc?: string
  height?: string
  overlayColor?: string
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

export function EnhancedHero({
  title,
  subtitle,
  videoSrc,
  imageSrc,
  height = "h-[70vh]",
  overlayColor = "from-blue-600/80 via-blue-700/80 to-blue-800/80",
  buttons,
}: EnhancedHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Parallax effect for video/image
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0])

  // Parallax effect for text
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 200])

  // Handle video playback
  useEffect(() => {
    if (!videoSrc || !videoRef.current) return

    const video = videoRef.current
    video.addEventListener("loadeddata", () => {
      video.play().catch(() => {})
    })

    return () => {
      if (video) {
        video.removeEventListener("loadeddata", () => {})
      }
    }
  }, [videoSrc])

  // Haptic feedback function (will only work on supported devices)
  const triggerHapticFeedback = () => {
    if (typeof window !== "undefined" && "navigator" in window) {
      if (navigator.vibrate) {
        navigator.vibrate(10) // 10ms vibration
      }
    }
  }

  return (
    <section ref={containerRef} className={`relative w-full overflow-hidden ${height}`}>
      {/* Video or Image Background with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          scale,
          opacity,
        }}
      >
        {videoSrc ? (
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
        ) : imageSrc ? (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" />
        )}
      </motion.div>

      {/* Gradient Overlay with updated styling */}
      <div className={`absolute inset-0 bg-gradient-to-r ${overlayColor} backdrop-blur-sm`}></div>

      {/* Content - FIXED: Improved responsive typography */}
      <div className="relative h-full flex flex-col justify-center">
        <div className="container mx-auto px-6">
          <motion.div
            style={{ y: titleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.42, 0, 0.58, 1] }}
          >
            <Typography
              as="h1"
              variant="heading1"
              className="text-white mb-4 md:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {title}
            </Typography>
          </motion.div>

          <motion.div
            style={{ y: subtitleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.42, 0, 0.58, 1] }}
          >
            <Typography
              as="p"
              variant="heading3"
              className="text-white/90 font-light max-w-2xl mb-6 md:mb-10 text-base sm:text-lg md:text-xl"
            >
              {subtitle}
            </Typography>
          </motion.div>

          {buttons && (
            <motion.div
              style={{ y: contentY }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.42, 0, 0.58, 1] }}
              className="flex flex-wrap gap-4 md:gap-6"
            >
              {buttons.primary && (
                <Link href={buttons.primary.href}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={triggerHapticFeedback}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {buttons.primary.text}
                  </motion.button>
                </Link>
              )}
              {buttons.secondary && (
                <Link href={buttons.secondary.href}>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={triggerHapticFeedback}
                    className="border-white/30 dark:border-white/40 bg-white/15 dark:bg-white/10 backdrop-blur-md text-white hover:bg-white/25 dark:hover:bg-white/20 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light transition-all duration-300"
                  >
                    {buttons.secondary.text}
                  </motion.button>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll Indicator with enhanced animation */}
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
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.42, 0, 0.58, 1],
          }}
        >
          <ArrowDown className="w-6 h-6 md:w-8 md:h-8 text-white/80" />
        </motion.div>
      </motion.div>
    </section>
  )
}
