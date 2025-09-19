"use client"

import { motion } from "framer-motion"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { Typography } from "@/components/ui/apple-typography"

interface DeviceCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function DeviceCard({ icon, title, description }: DeviceCardProps) {
  return (
    <GlassmorphismCard className="text-center p-8 h-full" hoverEffect>
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center mb-6 text-blue-600 dark:text-blue-400"
      >
        {icon}
      </motion.div>
      <Typography as="h3" variant="heading3" className="mb-3">
        {title}
      </Typography>
      <Typography as="p" variant="body">
        {description}
      </Typography>
    </GlassmorphismCard>
  )
}