"use client"

import type React from "react"

import { scrollToSection } from "@/utils/scroll-utils"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface ScrollToSectionButtonProps {
  targetId: string
  className?: string
  children?: React.ReactNode
}

export function ScrollToSectionButton({ targetId, className = "", children }: ScrollToSectionButtonProps) {
  return (
    <motion.button
      whileHover={{ y: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => scrollToSection(targetId)}
      className={`flex items-center justify-center p-2  ${className}`}
      aria-label={`Scroll to ${targetId}`}
    >
      {children || <ChevronDown className="h-6 w-6" />}
    </motion.button>
  )
}
