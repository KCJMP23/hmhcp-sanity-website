"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface PremiumSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Type of skeleton to render */
  type?: "card" | "text" | "avatar" | "button" | "image" | "hero" | "blog" | "navigation" | "grid" | "list" | "profile" | "dashboard" | "custom"
  /** Number of lines for text skeleton */
  lines?: number
  /** Show shimmer animation */
  shimmer?: boolean
  /** Custom width */
  width?: string
  /** Custom height */  
  height?: string
  /** Rounded corners variant */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
  /** Animation variant */
  variant?: "pulse" | "wave" | "gradient" | "breathing"
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  /** Premium effect intensity */
  intensity?: "subtle" | "medium" | "bold"
}

const PremiumSkeleton = React.forwardRef<HTMLDivElement, PremiumSkeletonProps>(
  ({ 
    className, 
    type = "custom", 
    lines = 3, 
    shimmer = true, 
    width, 
    height, 
    rounded = "md",
    variant = "gradient",
    size = "md",
    intensity = "medium",
    style,
    ...props 
  }, ref) => {
    const roundedClasses = {
      none: "rounded-none",
      sm: "rounded-sm", 
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full"
    }

    const sizeClasses = {
      xs: "h-3",
      sm: "h-4", 
      md: "h-5",
      lg: "h-6",
      xl: "h-8",
      "2xl": "h-10"
    }

    const intensityConfig = {
      subtle: {
        opacity: "opacity-60",
        blur: "backdrop-blur-sm",
        shadow: "shadow-sm"
      },
      medium: {
        opacity: "opacity-80", 
        blur: "backdrop-blur-md",
        shadow: "shadow-lg"
      },
      bold: {
        opacity: "opacity-90",
        blur: "backdrop-blur-lg", 
        shadow: "shadow-xl"
      }
    }

    const getAnimationVariant = () => {
      switch (variant) {
        case "pulse":
          return "animate-pulse"
        case "wave":
          return "animate-wave"
        case "breathing":
          return "animate-breathing"
        case "gradient":
        default:
          return shimmer ? "animate-shimmer" : "animate-pulse"
      }
    }

    const getBaseGradient = () => {
      switch (intensity) {
        case "subtle":
          return "bg-gradient-to-r from-blue-50/40 via-blue-100/60 to-blue-50/40 dark:from-blue-950/40 dark:via-blue-900/60 dark:to-blue-950/40"
        case "bold":
          return "bg-gradient-to-r from-blue-100/80 via-blue-200/90 to-blue-100/80 dark:from-blue-900/80 dark:via-blue-800/90 dark:to-blue-900/80"
        case "medium":
        default:
          return "bg-gradient-to-r from-blue-50/60 via-blue-100/80 to-blue-50/60 dark:from-blue-950/60 dark:via-blue-900/80 dark:to-blue-950/60"
      }
    }

    const baseClass = cn(
      getBaseGradient(),
      roundedClasses[rounded],
      getAnimationVariant(),
      intensityConfig[intensity].opacity,
      "relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
      "before:translate-x-[-100%] before:animate-shimmer-slide",
      shimmer && "before:opacity-100",
      !shimmer && "before:opacity-0",
      className
    )

    // Premium glassmorphism shimmer effect
    const shimmerStyle = {
      background: variant === "gradient" ? `
        linear-gradient(
          110deg,
          rgba(59, 130, 246, 0.1) 0%,
          rgba(147, 197, 253, 0.3) 25%,
          rgba(59, 130, 246, 0.4) 50%,
          rgba(147, 197, 253, 0.3) 75%,
          rgba(59, 130, 246, 0.1) 100%
        )
      ` : undefined,
      backgroundSize: variant === "gradient" ? "200% 100%" : undefined,
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(59, 130, 246, 0.1)",
      boxShadow: `
        0 4px 6px -1px rgba(59, 130, 246, 0.1),
        0 2px 4px -1px rgba(59, 130, 246, 0.06),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
      `,
      ...style
    }

    const customStyle = {
      width,
      height,
      ...shimmerStyle
    }

    if (type === "navigation") {
      return (
        <motion.div 
          className={cn("bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-100/50 dark:border-gray-700/50 shadow-xl", className)} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo skeleton */}
            <div className={cn(baseClass, "h-8 w-32 rounded-lg")} style={customStyle} />
            
            {/* Navigation items */}
            <div className="hidden md:flex items-center space-x-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={cn(baseClass, "h-4 w-16")} style={customStyle} />
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <div className={cn(baseClass, "h-9 w-20 rounded-full")} style={customStyle} />
              <div className={cn(baseClass, "h-9 w-24 rounded-full")} style={customStyle} />
            </div>
          </div>
        </motion.div>
      )
    }

    if (type === "hero") {
      return (
        <motion.div 
          className={cn("w-full space-y-12 py-20", className)} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Hero image skeleton with glassmorphism */}
          <motion.div 
            className={cn(
              baseClass, 
              "w-full h-[500px] relative overflow-hidden",
              "bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/80",
              "backdrop-blur-xl border border-blue-100/30 shadow-2xl"
            )}
            style={customStyle}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Floating elements for premium feel */}
            <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-blue-200/30 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-blue-100/20 rounded-full blur-2xl animate-float-delayed" />
          </motion.div>
          
          {/* Hero content skeleton */}
          <div className="space-y-8 max-w-4xl mx-auto text-center px-6">
            <motion.div 
              className={cn(baseClass, "h-6 w-40 mx-auto rounded-full")} 
              style={customStyle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            />
            <motion.div 
              className={cn(baseClass, "h-16 w-5/6 mx-auto rounded-2xl")} 
              style={customStyle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            />
            <motion.div 
              className={cn(baseClass, "h-8 w-3/4 mx-auto rounded-xl")} 
              style={customStyle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            />
            
            {/* Action buttons with stagger animation */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className={cn(baseClass, "h-14 w-48 rounded-2xl shadow-lg")} style={customStyle} />
              <div className={cn(baseClass, "h-14 w-40 rounded-2xl")} style={customStyle} />
            </motion.div>
          </div>
        </motion.div>
      )
    }

    if (type === "blog") {
      return (
        <motion.div 
          className={cn(
            "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-100/30 dark:border-gray-700/30 shadow-2xl overflow-hidden",
            "rounded-3xl hover:shadow-blue-500/10 transition-all duration-500",
            className
          )} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ y: -5, transition: { duration: 0.3 } }}
        >
          {/* Blog image skeleton with premium overlay */}
          <div className="relative overflow-hidden">
            <div className={cn(baseClass, "w-full h-64 rounded-none")} style={customStyle} />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent" />
          </div>
          
          {/* Blog content skeleton */}
          <div className="p-8 space-y-6">
            {/* Meta information */}
            <div className="flex items-center space-x-6">
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className={cn(baseClass, "w-10 h-10 rounded-xl")} style={customStyle} />
                <div className={cn(baseClass, "h-4 w-24 rounded-lg")} style={customStyle} />
              </motion.div>
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className={cn(baseClass, "w-10 h-10 rounded-xl")} style={customStyle} />
                <div className={cn(baseClass, "h-4 w-20 rounded-lg")} style={customStyle} />
              </motion.div>
            </div>
            
            {/* Title */}
            <motion.div 
              className={cn(baseClass, "h-10 w-4/5 rounded-xl")} 
              style={customStyle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            />
            
            {/* Content lines */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div 
                  key={i}
                  className={cn(
                    baseClass, 
                    "h-5 rounded-lg",
                    i === 0 ? "w-full" : i === 1 ? "w-5/6" : "w-3/4"
                  )} 
                  style={customStyle}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                />
              ))}
            </div>
            
            {/* Tags */}
            <motion.div 
              className="flex gap-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className={cn(baseClass, "h-8 w-20 rounded-full")} style={customStyle} />
              <div className={cn(baseClass, "h-8 w-24 rounded-full")} style={customStyle} />
              <div className={cn(baseClass, "h-8 w-16 rounded-full")} style={customStyle} />
            </motion.div>
            
            {/* Footer */}
            <motion.div 
              className="flex items-center justify-between pt-8 border-t border-blue-100/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center space-x-4">
                <div className={cn(baseClass, "w-8 h-8 rounded-xl")} style={customStyle} />
                <div className={cn(baseClass, "h-4 w-12 rounded-lg")} style={customStyle} />
              </div>
              <div className={cn(baseClass, "h-12 w-32 rounded-2xl shadow-lg")} style={customStyle} />
            </motion.div>
          </div>
        </motion.div>
      )
    }

    if (type === "card") {
      return (
        <motion.div 
          className={cn(
            "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-100/30 dark:border-gray-700/30 shadow-2xl p-8",
            "rounded-3xl hover:shadow-blue-500/20 transition-all duration-500",
            "hover:border-blue-200/50 group",
            className
          )} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          whileHover={{ y: -8, transition: { duration: 0.3 } }}
        >
          <div className="space-y-6">
            {/* Icon with premium styling */}
            <motion.div 
              className={cn(
                baseClass, 
                "w-16 h-16 rounded-2xl shadow-lg group-hover:shadow-blue-500/30",
                "border border-blue-100/50"
              )} 
              style={customStyle}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            />
            
            {/* Title */}
            <motion.div 
              className={cn(baseClass, "h-8 w-4/5 rounded-xl")} 
              style={customStyle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            />
            
            {/* Content lines */}
            <div className="space-y-3">
              {Array.from({ length: lines }).map((_, i) => (
                <motion.div 
                  key={i} 
                  className={cn(
                    baseClass, 
                    "h-5 rounded-lg",
                    i === lines - 1 ? "w-3/4" : "w-full"
                  )} 
                  style={customStyle}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )
    }

    if (type === "grid") {
      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", className)} ref={ref} {...props}>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-100/30 dark:border-gray-700/30 shadow-xl p-6 rounded-3xl",
                baseClass
              )}
              style={customStyle}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: i * 0.1, 
                duration: 0.6,
                ease: "easeOut"
              }}
            >
              <div className="space-y-4">
                <div className={cn(baseClass, "w-full h-40 rounded-2xl")} style={customStyle} />
                <div className={cn(baseClass, "h-6 w-3/4 rounded-lg")} style={customStyle} />
                <div className={cn(baseClass, "h-4 w-full rounded-lg")} style={customStyle} />
                <div className={cn(baseClass, "h-4 w-2/3 rounded-lg")} style={customStyle} />
              </div>
            </motion.div>
          ))}
        </div>
      )
    }

    if (type === "list") {
      return (
        <div className={cn("space-y-4", className)} ref={ref} {...props}>
          {Array.from({ length: lines || 5 }).map((_, i) => (
            <motion.div 
              key={i}
              className={cn(
                "flex items-center space-x-4 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg",
                "border border-blue-100/30 rounded-2xl shadow-lg"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={cn(baseClass, "w-12 h-12 rounded-xl")} style={customStyle} />
              <div className="flex-1 space-y-2">
                <div className={cn(baseClass, "h-5 w-1/2 rounded-lg")} style={customStyle} />
                <div className={cn(baseClass, "h-4 w-3/4 rounded-lg")} style={customStyle} />
              </div>
              <div className={cn(baseClass, "h-8 w-20 rounded-full")} style={customStyle} />
            </motion.div>
          ))}
        </div>
      )
    }

    if (type === "profile") {
      return (
        <motion.div 
          className={cn(
            "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-100/30 dark:border-gray-700/30 shadow-2xl p-8 rounded-3xl",
            className
          )} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center space-y-6">
            {/* Profile picture */}
            <motion.div 
              className={cn(baseClass, "w-24 h-24 rounded-full border-4 border-blue-100/50")} 
              style={customStyle}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
            
            {/* Name */}
            <motion.div 
              className={cn(baseClass, "h-6 w-32 rounded-lg")} 
              style={customStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            />
            
            {/* Title */}
            <motion.div 
              className={cn(baseClass, "h-4 w-24 rounded-lg")} 
              style={customStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            />
            
            {/* Stats */}
            <div className="flex space-x-6 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div 
                  key={i}
                  className="text-center space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <div className={cn(baseClass, "h-6 w-8 mx-auto rounded-lg")} style={customStyle} />
                  <div className={cn(baseClass, "h-3 w-12 mx-auto rounded-lg")} style={customStyle} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )
    }

    if (type === "dashboard") {
      return (
        <div className={cn("space-y-8", className)} ref={ref} {...props}>
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={cn(baseClass, "h-8 w-48 rounded-xl")} style={customStyle} />
            <div className={cn(baseClass, "h-10 w-32 rounded-2xl")} style={customStyle} />
          </motion.div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-100/30 dark:border-gray-700/30 shadow-xl p-6 rounded-3xl",
                  baseClass
                )}
                style={customStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="space-y-4">
                  <div className={cn(baseClass, "h-12 w-12 rounded-2xl")} style={customStyle} />
                  <div className={cn(baseClass, "h-8 w-16 rounded-lg")} style={customStyle} />
                  <div className={cn(baseClass, "h-4 w-20 rounded-lg")} style={customStyle} />
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Charts */}
          <motion.div 
            className={cn(
              "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-blue-100/30 dark:border-gray-700/30 shadow-xl p-8 rounded-3xl",
              baseClass
            )}
            style={customStyle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className={cn(baseClass, "w-full h-80 rounded-2xl")} style={customStyle} />
          </motion.div>
        </div>
      )
    }

    if (type === "text") {
      return (
        <div className={cn("space-y-3", className)} ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div 
              key={i} 
              className={cn(
                baseClass, 
                sizeClasses[size],
                "rounded-lg",
                i === lines - 1 ? "w-3/4" : "w-full"
              )} 
              style={customStyle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            />
          ))}
        </div>
      )
    }

    if (type === "avatar") {
      return (
        <motion.div 
          className={cn(
            baseClass, 
            "rounded-full border-2 border-blue-100/50 shadow-lg",
            size === "xs" ? "w-8 h-8" : 
            size === "sm" ? "w-10 h-10" :
            size === "md" ? "w-12 h-12" :
            size === "lg" ? "w-16 h-16" :
            size === "xl" ? "w-20 h-20" : "w-24 h-24"
          )} 
          style={customStyle} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )
    }

    if (type === "button") {
      return (
        <motion.div 
          className={cn(
            baseClass, 
            "rounded-2xl shadow-lg border border-blue-100/50",
            size === "xs" ? "h-8 w-16" :
            size === "sm" ? "h-9 w-20" :
            size === "md" ? "h-10 w-24" :
            size === "lg" ? "h-12 w-32" :
            size === "xl" ? "h-14 w-40" : "h-16 w-48"
          )} 
          style={customStyle} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        />
      )
    }

    if (type === "image") {
      return (
        <motion.div 
          className={cn(
            baseClass, 
            "w-full border border-blue-100/30 shadow-lg",
            size === "xs" ? "h-32" :
            size === "sm" ? "h-40" :
            size === "md" ? "h-48" :
            size === "lg" ? "h-64" :
            size === "xl" ? "h-80" : "h-96"
          )} 
          style={customStyle} 
          ref={ref} 
          {...props}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )
    }

    // Custom skeleton
    return (
      <div className={baseClass} style={customStyle} ref={ref} {...props} />
    )
  }
)

PremiumSkeleton.displayName = "PremiumSkeleton"

// Premium loading page component with multiple variants
export function PremiumLoadingPage({ variant = "default" }: { variant?: "default" | "minimal" | "dashboard" | "blog" }) {
  const renderVariant = () => {
    switch (variant) {
      case "minimal":
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30">
            <div className="text-center space-y-8">
              <motion.div
                className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="space-y-4">
                <PremiumSkeleton type="text" lines={1} className="w-48 mx-auto" size="lg" />
                <PremiumSkeleton type="text" lines={2} className="w-64 mx-auto" size="sm" />
              </div>
            </div>
          </div>
        )
      
      case "dashboard":
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50/20 via-white to-blue-50/20 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <PremiumSkeleton type="navigation" />
              <PremiumSkeleton type="dashboard" />
            </div>
          </div>
        )
      
      case "blog":
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50/20 via-white to-blue-50/20 p-6">
            <div className="max-w-6xl mx-auto space-y-12">
              <PremiumSkeleton type="navigation" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PremiumSkeleton key={i} type="blog" />
                ))}
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50/20 via-white to-blue-50/20 relative overflow-hidden">
            {/* Premium background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-blue-300/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.7, 0.3],
                  rotate: [0, 90, 0]
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/25 to-blue-200/15 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.1, 1, 1.1],
                  opacity: [0.4, 0.8, 0.4],
                  rotate: [0, -90, 0]
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3
                }}
              />
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-100/10 to-blue-200/10 rounded-full blur-2xl"
                animate={{ 
                  scale: [0.8, 1.3, 0.8],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>

            <div className="relative z-10">
              {/* Hero skeleton */}
              <PremiumSkeleton type="hero" className="mb-24" />

              {/* Content sections */}
              <div className="max-w-7xl mx-auto px-6 space-y-20">
                {/* Section header */}
                <motion.div 
                  className="text-center space-y-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                >
                  <PremiumSkeleton className="h-6 w-32 mx-auto rounded-full" intensity="subtle" />
                  <PremiumSkeleton className="h-12 w-96 mx-auto rounded-2xl" intensity="medium" />
                  <PremiumSkeleton className="h-6 w-2/3 mx-auto rounded-xl" intensity="subtle" />
                </motion.div>

                {/* Grid section */}
                <PremiumSkeleton type="grid" />

                {/* Profile section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PremiumSkeleton key={i} type="profile" />
                  ))}
                </div>

                {/* List section */}
                <PremiumSkeleton type="list" lines={4} />
              </div>
            </div>

            {/* Premium floating indicators */}
            <motion.div 
              className="fixed bottom-8 right-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-blue-100/50 dark:border-gray-700/50"
              animate={{ 
                scale: [1, 1.02, 1],
                y: [0, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <motion.div 
                    className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="absolute inset-0 w-8 h-8 border-2 border-blue-300/20 border-b-blue-300 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-gray-800 block">Premium Loading</span>
                  <span className="text-xs text-gray-600">Crafting experience...</span>
                </div>
              </div>
            </motion.div>

            {/* Additional floating elements */}
            <motion.div 
              className="fixed top-8 left-8 bg-white/80 backdrop-blur-lg rounded-2xl p-3 shadow-lg border border-blue-100/30"
              animate={{ 
                opacity: [0.7, 1, 0.7],
                scale: [0.98, 1, 0.98]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-700">Initializing</span>
              </div>
            </motion.div>
          </div>
        )
    }
  }

  return renderVariant()
}

// Loading dots component
export function LoadingDots({ size = "md", color = "blue" }: { size?: "sm" | "md" | "lg", color?: "blue" | "gray" }) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  }
  
  const colorClasses = {
    blue: "bg-blue-500",
    gray: "bg-gray-400"
  }

  return (
    <div className="flex space-x-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(sizeClasses[size], colorClasses[color], "rounded-full")}
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Pulse loader component  
export function PulseLoader({ className }: { className?: string }) {
  return (
    <motion.div 
      className={cn("w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )
}

// CSS keyframes for premium animations (to be added to global CSS)
const premiumAnimationsCSS = `
/* Enhanced shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    background-position: 200% 0;
    opacity: 0.5;
  }
}

/* Shimmer slide effect */
@keyframes shimmer-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Wave animation */
@keyframes wave {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Breathing animation */
@keyframes breathing {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

/* Floating animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(3deg);
  }
  66% {
    transform: translateY(-10px) rotate(-3deg);
  }
}

/* Delayed floating animation */
@keyframes float-delayed {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-15px) rotate(-2deg);
  }
  66% {
    transform: translateY(-25px) rotate(2deg);
  }
}

/* Gradient shift animation */
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* Glow pulse animation */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
  }
}
`

// Utility classes for Tailwind CSS config
const tailwindAnimationClasses = {
  'animate-shimmer': 'animation: shimmer 2.5s ease-in-out infinite',
  'animate-shimmer-slide': 'animation: shimmer-slide 2s infinite linear',
  'animate-wave': 'animation: wave 2s ease-in-out infinite',
  'animate-breathing': 'animation: breathing 3s ease-in-out infinite',
  'animate-float': 'animation: float 6s ease-in-out infinite',
  'animate-float-delayed': 'animation: float-delayed 8s ease-in-out infinite 2s',
  'animate-gradient-shift': 'animation: gradient-shift 4s ease infinite',
  'animate-glow-pulse': 'animation: glow-pulse 2s ease-in-out infinite'
}

export { 
  PremiumSkeleton, 
  PremiumLoadingPage,
  LoadingDots,
  PulseLoader,
  premiumAnimationsCSS,
  tailwindAnimationClasses
}