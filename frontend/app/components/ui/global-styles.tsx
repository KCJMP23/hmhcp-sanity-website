"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface GlobalStylesProps {
  children: ReactNode
}

export function GlobalStyles({ children }: GlobalStylesProps) {
  return <div className="min-h-screen">{children}</div>
}

// Glassmorphism Card Component
interface GlassmorphismCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  highlightBorder?: boolean
  coloredShadow?: boolean
  onClick?: () => void
}

export function GlassmorphismCard({
  children,
  className,
  hoverEffect = false,
  highlightBorder = false,
  coloredShadow = false,
  onClick,
}: GlassmorphismCardProps) {
  return (
    <motion.div
      whileHover={
        hoverEffect
          ? {
              y: -5,
              boxShadow: coloredShadow
                ? "0 20px 25px -5px rgba(0, 102, 204, 0.1), 0 10px 10px -5px rgba(0, 102, 204, 0.04)"
                : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              borderColor: highlightBorder ? "rgba(0, 102, 204, 0.3)" : "rgba(255, 255, 255, 0.2)",
            }
          : undefined
      }
      transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
      className={cn(
        "overflow-hidden rounded-2xl",
        "border border-white/20 dark:border-white/10",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md",
        "shadow-lg transition-all duration-300",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

// Frosted Glass Button Component
interface FrostedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function FrostedButton({
  children,
  className,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
}: FrostedButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 text-white"
      case "secondary":
        return "bg-white/80 backdrop-blur-sm hover:bg-white/90 text-blue-600 border border-white/50"
      case "outline":
        return "bg-transparent hover:bg-white/10 text-white border border-white/50"
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white"
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "py-2 px-4 text-sm"
      case "lg":
        return "py-4 px-8 text-lg"
      default:
        return "py-3 px-6 text-base"
    }
  }

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "font-medium transition-colors shadow-md",
        getVariantStyles(),
        getSizeStyles(),
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

// Animated Section Component
interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.42, 0, 0.58, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// Gradient Text Component
interface GradientTextProps {
  children: ReactNode
  className?: string
  gradient?: "blue" | "purple" | "teal"
}

export function GradientText({ children, className, gradient = "blue" }: GradientTextProps) {
  const getGradient = () => {
    switch (gradient) {
      case "purple":
        return "from-blue-600 to-blue-600 dark:from-blue-400 dark:to-blue-400"
      case "teal":
        return "from-blue-500 to-blue-500 dark:from-blue-400 dark:to-blue-400"
      default:
        return "from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-500"
    }
  }

  return (
    <span className={cn("bg-clip-text text-transparent bg-gradient-to-r", getGradient(), className)}>{children}</span>
  )
}

// Premium Image Component
interface PremiumImageProps {
  src: string
  alt: string
  className?: string
}

export function PremiumImage({ src, alt, className }: PremiumImageProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg shadow-lg border border-white/20 dark:border-white/10",
        "transition-all duration-300 hover:shadow-xl",
        className,
      )}
    >
      <img src={src || "/placeholder.svg"} alt={alt || ""} className="w-full h-full object-cover" />
    </div>
  )
}

// Export FrostedGlassCard for compatibility
export { FrostedGlassCard } from "../frosted-glass-card"

// Add FrostedCard component to global-styles.tsx
export function FrostedCard({
  children,
  className,
  hoverEffect = false,
  intensity = "medium",
  onClick,
}: {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  intensity?: "light" | "medium" | "strong"
  onClick?: () => void
}) {
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
          ? {
              y: -5,
              transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
            }
          : undefined
      }
      className={cn(
        // Base styles
        "overflow-hidden rounded-2xl",
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
