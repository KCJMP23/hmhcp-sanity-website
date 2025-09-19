"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { OptimizedImage } from "@/components/optimized-image"
import { ButtonStandard } from "@/components/ui/button-standard"
import { Typography } from "@/components/ui/apple-typography"
import { PlatformDetail } from "@/data/platforms"

interface PlatformHeroProps {
  platform: PlatformDetail
  heroImage: string | null
}

export function PlatformHero({ platform, heroImage }: PlatformHeroProps) {
  return (
    <section className="relative h-[80vh] overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/90 z-10 dark:from-blue-950/90 dark:to-blue-900/90 backdrop-blur-sm"></div>
        {heroImage ? (
          <OptimizedImage 
            src={heroImage} 
            alt={platform.name} 
            fill 
            className="object-cover" 
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-blue-800 dark:bg-blue-900"></div>
        )}
      </motion.div>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-block px-3 py-1 bg-blue-500/20 text-blue-100 text-sm font-medium mb-4"
              >
                Healthcare Platform
              </motion.span>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Typography as="h1" variant="display" className="text-white mb-6">
                  {platform.name}
                </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Typography as="p" variant="heading3" className="text-blue-100 mb-8 max-w-2xl font-light">
                  {platform.description}
                </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap gap-6"
              >
                <ButtonStandard href="/contact" size="lg" variant="primary">
                  Request a Demo
                </ButtonStandard>
                <ButtonStandard size="lg" variant="secondary">
                  Watch Video
                </ButtonStandard>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="flex flex-col items-center"
        >
          <span className="text-white/80 text-sm mb-2">Scroll to explore</span>
          <ChevronRight className="w-6 h-6 text-white/80 transform rotate-90" />
        </motion.div>
      </div>
    </section>
  )
}