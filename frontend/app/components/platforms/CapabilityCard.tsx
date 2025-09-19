"use client"

import { motion } from "framer-motion"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { Typography } from "@/components/ui/apple-typography"

interface CapabilityCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function CapabilityCard({ icon, title, description }: CapabilityCardProps) {
  return (
    <GlassmorphismCard className="text-center p-8 h-full" hoverEffect>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center mb-6"
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