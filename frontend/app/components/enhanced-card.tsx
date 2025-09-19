"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/apple-typography"
import type { ReactNode } from "react"

interface EnhancedCardProps {
  title?: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
  className?: string
  onClick?: () => void
  hoverEffect?: boolean
  borderHighlight?: boolean
  frostedGlass?: boolean
  intensity?: "light" | "medium" | "strong"
}

export function EnhancedCard({
  title,
  description,
  icon,
  children,
  className,
  onClick,
  hoverEffect = true,
  borderHighlight = false,
  frostedGlass = true,
  intensity = "medium",
}: EnhancedCardProps) {
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
      whileHover={
        hoverEffect
          ? {
              y: -5,
              boxShadow: "0 15px 30px rgba(0, 0, 0, 0.07), 0 5px 15px rgba(0, 0, 0, 0.04)",
              borderColor: borderHighlight ? "rgba(0, 102, 204, 0.3)" : "rgba(255, 255, 255, 0.3)",
            }
          : undefined
      }
      transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
      className={cn(
        // Base styles
        "p-6 overflow-hidden",
        // MANDATORY: Rounded borders per Apple-inspired design system
        "rounded-2xl",
        // Border
        "border border-white/20 dark:border-white/10",
        // Conditional frosted glass effect
        frostedGlass ? getBackdropIntensity() : "bg-white dark:bg-gray-900",
        // Shadow
        "shadow-md hover:shadow-xl",
        // Transition
        "transition-all duration-300",
        className,
      )}
      onClick={onClick}
    >
      {children ? (
        children
      ) : (
        <>
          {icon && <div className="mb-4">{icon}</div>}
          {title && (
            <Typography as="h3" variant="heading3" className="mb-2">
              {title}
            </Typography>
          )}
          {description && (
            <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-300">
              {description}
            </Typography>
          )}
        </>
      )}
    </motion.div>
  )
}
