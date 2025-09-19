"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { OptimizedImage } from "@/components/optimized-image"
import { LazySection } from "@/components/lazy-section"
import { Typography } from "@/components/ui/apple-typography"
import { PlatformDetail } from "@/data/platforms"

interface PlatformScreenshotsProps {
  platform: PlatformDetail
}

export function PlatformScreenshots({ platform }: PlatformScreenshotsProps) {
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(0)

  if (!platform.screenshots || platform.screenshots.length === 0) {
    return null
  }

  return (
    <LazySection className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4"
          >
            Visual Tour
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Typography as="h2" variant="heading2" className="mb-4">
              Platform Screenshots
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              See the platform in action with these interactive screenshots
            </Typography>
          </motion.div>
        </div>

        <div className="relative">
          {/* Screenshot display */}
          <div className="relative mb-8">
            <motion.div
              className="relative w-full h-[500px] overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              {platform.screenshots[activeScreenshotIndex]?.image ? (
                <OptimizedImage
                  src={platform.screenshots[activeScreenshotIndex].image}
                  alt={platform.screenshots[activeScreenshotIndex].title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Screenshot Preview</span>
                </div>
              )}

              {/* Caption overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-xl font-medium text-white">
                  {platform.screenshots[activeScreenshotIndex]?.title}
                </h3>
              </div>
            </motion.div>
          </div>

          {/* Thumbnail navigation */}
          <div className="flex space-x-4 overflow-x-hidden pb-4 hide-scrollbar">
            {platform.screenshots.map((screenshot, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveScreenshotIndex(index)}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex-shrink-0 w-32 h-24  overflow-hidden transition-all ${
                  activeScreenshotIndex === index ? "ring-4 ring-blue-500" : "ring-0 opacity-70"
                }`}
              >
                {screenshot.image ? (
                  <OptimizedImage src={screenshot.image} alt={screenshot.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Thumbnail</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </LazySection>
  )
}