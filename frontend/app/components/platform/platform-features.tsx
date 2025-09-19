"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { OptimizedImage } from "@/components/optimized-image"
import { LazySection } from "@/components/lazy-section"
import { Typography } from "@/components/ui/apple-typography"
import { PlatformDetail } from "@/data/platforms"
import { SoftBlueIconWrapper } from "@/components/ui/icon-wrapper"

interface PlatformFeaturesProps {
  platform: PlatformDetail
}

export function PlatformFeatures({ platform }: PlatformFeaturesProps) {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)

  return (
    <LazySection className="py-24 bg-gray-50 dark:bg-gray-800 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4"
          >
            Feature Spotlight
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Typography as="h2" variant="heading2" className="mb-4">
              Key Capabilities
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              Explore the powerful features that make our platform the choice of leading healthcare organizations
            </Typography>
          </motion.div>
        </div>

        <div className="relative">
          {/* Feature Spotlight */}
          <div className="max-w-4xl mx-auto">
            <GlassmorphismCard className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <motion.div
                    key={activeFeatureIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <SoftBlueIconWrapper size="lg" animate className="mb-6">
                      <svg
                        className="h-8 w-8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </SoftBlueIconWrapper>
                    <Typography as="h3" variant="heading3" className="mb-4">
                      {platform.features[activeFeatureIndex].title}
                    </Typography>
                    <Typography as="p" variant="body" className="mb-6">
                      {platform.features[activeFeatureIndex].description}
                    </Typography>
                  </motion.div>
                </div>
                <div className="relative h-64 md:h-80 overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-600/5 z-10"></div>
                  <OptimizedImage
                    src={platform.screenshots[0]?.image || "/platform-screenshot-1.png"}
                    alt={platform.features[activeFeatureIndex].title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Feature Navigation */}
              <div className="mt-8 flex justify-center space-x-2">
                {platform.features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeatureIndex(index)}
                    className={`w-3 h-3  transition-all ${
                      activeFeatureIndex === index ? "bg-blue-600 scale-125" : "bg-gray-300 dark:bg-gray-700"
                    }`}
                    aria-label={`View feature ${index + 1}`}
                  />
                ))}
              </div>
            </GlassmorphismCard>
          </div>
        </div>

        {/* All Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platform.features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <GlassmorphismCard hoverEffect={true} highlightBorder={true} coloredShadow={true} className="h-full">
                <div className="p-8">
                  <div className="w-12 h-12 bg-blue-500/20 flex items-center justify-center mb-6">
                    <svg
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <Typography as="h3" variant="heading4" className="mb-3">
                    {feature.title}
                  </Typography>
                  <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </Typography>
                </div>
              </GlassmorphismCard>
            </motion.div>
          ))}
        </div>
      </div>
    </LazySection>
  )
}