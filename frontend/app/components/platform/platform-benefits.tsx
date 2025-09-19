"use client"

import { motion } from "framer-motion"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { LazySection } from "@/components/lazy-section"
import { Typography } from "@/components/ui/apple-typography"
import { PlatformDetail } from "@/data/platforms"

interface PlatformBenefitsProps {
  platform: PlatformDetail
}

export function PlatformBenefits({ platform }: PlatformBenefitsProps) {
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
            Value Proposition
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Typography as="h2" variant="heading2" className="mb-4">
              Benefits
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              How our platform creates value for healthcare organizations
            </Typography>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {platform.benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassmorphismCard className="h-full">
                <div className="p-8 flex items-start">
                  <div className="p-3 bg-blue-500/20 mr-4 flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <Typography as="h3" variant="heading3" className="mb-3">
                      {benefit.title}
                    </Typography>
                    <Typography as="p" variant="body">
                      {benefit.description}
                    </Typography>
                  </div>
                </div>
              </GlassmorphismCard>
            </motion.div>
          ))}
        </div>
      </div>
    </LazySection>
  )
}