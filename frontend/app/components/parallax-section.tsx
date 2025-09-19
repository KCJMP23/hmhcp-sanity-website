"use client"

import type React from "react"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { validateImageSrc } from "@/utils/image-debug"
import { Typography } from "@/components/ui/apple-typography"
import { cn } from "@/lib/utils"

interface ParallaxHeroProps {
  title: string
  subtitle?: string
  backgroundSrc: string
  foregroundSrc: string | null
  height?: string
  overlayColor?: string
  isVideo?: boolean
  children?: React.ReactNode
}

export function ParallaxHero({
  title,
  subtitle,
  backgroundSrc,
  foregroundSrc,
  height = "h-[80vh]",
  overlayColor = "bg-gradient-to-r from-blue-600/80 via-blue-700/80 to-blue-800/80",
  isVideo = false,
  children,
}: ParallaxHeroProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  // Use useTransform instead of interpolate
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0])
  const foregroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])

  // Validate image sources
  const validBackgroundSrc = validateImageSrc(backgroundSrc)
  const validForegroundSrc = validateImageSrc(foregroundSrc ?? undefined)

  return (
    <section ref={ref} className={cn("relative w-full overflow-hidden", height)}>
      {/* Background Layer with Parallax Effect */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 w-full h-full">
        {isVideo ? (
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={backgroundSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image src={validBackgroundSrc || "/placeholder.svg"} alt="Background" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className={`absolute inset-0 ${overlayColor}`}></div>
      </motion.div>

      {/* Foreground Layer (Optional) */}
      {validForegroundSrc && (
        <motion.div style={{ y: foregroundY }} className="absolute inset-0 w-full h-full z-10">
          <Image src={validForegroundSrc || "/placeholder.svg"} alt="Foreground" fill sizes="100vw" className="object-contain" />
        </motion.div>
      )}

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Typography as="h1" variant="display" className="text-white mb-6 max-w-4xl mx-auto">
            {title}
          </Typography>
          {subtitle && (
            <Typography as="p" variant="body" className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {subtitle}
            </Typography>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  )
}
