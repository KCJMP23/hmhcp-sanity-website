"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface FrostedCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  intensity?: "light" | "medium" | "strong"
  onClick?: () => void
  rotate3d?: boolean
}

export function FrostedCard({
  children,
  className,
  hoverEffect = false,
  intensity = "medium",
  onClick,
  rotate3d = false,
}: FrostedCardProps) {
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
                transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
              }
            : {
                y: -5,
                transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
              }
          : undefined
      }
      className={cn(
        // Base styles
        " overflow-hidden",
        // MANDATORY: Rounded borders per Apple-inspired design system
        "rounded-2xl",
        // Frosted glass effect
        getBackdropIntensity(),
        // Border
        "border border-white/20 dark:border-white/10",
        // Shadow
        "shadow-lg",
        // Transition
        "transition-all duration-300 ease-apple",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

interface FrostedCardContentProps {
  children: ReactNode
  className?: string
}

export function FrostedCardContent({ children, className }: FrostedCardContentProps) {
  return <div className={cn("p-6", className)}>{children}</div>
}
