"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface FrostedGlassCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  intensity?: "light" | "medium" | "strong"
  onClick?: () => void
  rotate3d?: boolean
}

export function FrostedGlassCard({
  children,
  className,
  hoverEffect = false,
  intensity = "medium",
  onClick,
  rotate3d = false,
}: FrostedGlassCardProps) {
  // Get backdrop blur intensity
  const getBackdropIntensity = () => {
    switch (intensity) {
      case "light":
        return "backdrop-blur-sm bg-white/60 dark:bg-gray-900/60"
      case "strong":
        return "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80"
      case "medium":
      default:
        return "backdrop-blur-md bg-white/70 dark:bg-gray-900/70"
    }
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={
        hoverEffect
          ? rotate3d
            ? {
                rotateX: 5,
                rotateY: 5,
                y: -5,
                transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
              }
            : {
                y: -5,
                transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
              }
          : undefined
      }
      className={cn(
        // Base styles
        "overflow-hidden ",
        // Frosted glass effect
        getBackdropIntensity(),
        // Border
        "border border-white/20 dark:border-white/10",
        // Shadow
        "shadow-lg",
        // Transition
        "transition-all duration-300 ease-in-out",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

interface FrostedGlassCardContentProps {
  children: ReactNode
  className?: string
}

export function FrostedGlassCardContent({ children, className }: FrostedGlassCardContentProps) {
  return <div className={cn("p-6", className)}>{children}</div>
}
