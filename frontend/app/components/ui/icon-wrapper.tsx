"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface IconWrapperProps {
  /** The icon component to render */
  children: ReactNode
  /** Size variant for the wrapper */
  size?: "sm" | "md" | "lg" | "xl"
  /** Whether to enable hover animation */
  animate?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether to use the soft blue background (default) or transparent */
  variant?: "soft-blue" | "transparent" | "solid-blue"
}

const sizeClasses = {
  sm: "w-12 h-12",  // For small icons (w-4 h-4 icons)
  md: "w-16 h-16",  // For medium icons (w-6 h-6 icons) 
  lg: "w-20 h-20",  // For large icons (w-8 h-8 icons)
  xl: "w-24 h-24"   // For extra large icons (w-10 h-10 icons)
}

const iconSizeClasses = {
  sm: "[&>*]:w-4 [&>*]:h-4",
  md: "[&>*]:w-6 [&>*]:h-6", 
  lg: "[&>*]:w-8 [&>*]:h-8",
  xl: "[&>*]:w-10 [&>*]:h-10"
}

const variantClasses = {
  "soft-blue": "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-600 dark:text-blue-400",
  "transparent": "bg-transparent text-blue-600 dark:text-blue-400",
  "solid-blue": "bg-blue-600 text-white dark:bg-blue-500"
}

export function IconWrapper({
  children,
  size = "md",
  animate = false,
  className,
  variant = "soft-blue"
}: IconWrapperProps) {
  const Component = animate ? motion.div : "div"
  
  const animationProps = animate ? {
    whileHover: { 
      scale: 1.05,
      rotateY: 5 
    },
    transition: { 
      duration: 0.2,
      type: "spring" as const,
      stiffness: 300
    }
  } : {}

  return (
    <Component
      className={cn(
        // Base styles - always rectangular with rounded corners
        "rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
        // Size classes
        sizeClasses[size],
        // Icon size classes  
        iconSizeClasses[size],
        // Variant classes
        variantClasses[variant],
        // Additional classes
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  )
}

// Pre-configured variants for common use cases
export function SoftBlueIconWrapper(props: Omit<IconWrapperProps, "variant">) {
  return <IconWrapper {...props} variant="soft-blue" />
}

export function TransparentIconWrapper(props: Omit<IconWrapperProps, "variant">) {
  return <IconWrapper {...props} variant="transparent" />
}

export function SolidBlueIconWrapper(props: Omit<IconWrapperProps, "variant">) {
  return <IconWrapper {...props} variant="solid-blue" />
}