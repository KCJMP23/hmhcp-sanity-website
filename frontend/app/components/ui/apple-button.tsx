"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { forwardRef } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link"
export type ButtonSize = "sm" | "md" | "lg"

interface AppleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

export const AppleButton = forwardRef<HTMLButtonElement, AppleButtonProps>(
  (
    { 
      variant = "primary", 
      size = "md", 
      icon, 
      iconPosition = "left", 
      fullWidth = false, 
      children, 
      className, 
      onAnimationStart, 
      onAnimationEnd, 
      onAnimationIteration,
      onDragStart,
      onDragEnd,
      onDrag,
      ...props 
    },
    ref,
  ) => {
    // Apple-style button variants
    const variantStyles: Record<ButtonVariant, string> = {
      primary: "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md border border-blue-400/30 dark:border-blue-300/40",
      secondary:
        "bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300",
      outline:
        "border-white/30 dark:border-white/40 bg-white/15 dark:bg-white/10 backdrop-blur-md text-white hover:bg-white/25 dark:hover:bg-white/20 transition-all duration-300",
      ghost:
        "bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-300",
      link: "bg-transparent text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto shadow-none transition-all duration-300",
    }

    // Apple-style button sizes with pill shape
    const sizeStyles: Record<ButtonSize, string> = {
      sm: "text-sm px-6 sm:px-8 py-2 sm:py-3 rounded-full",
      md: "text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 rounded-full",
      lg: "text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 rounded-full",
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: variant !== "link" ? 1.05 : 1 }}
        whileTap={{ scale: variant !== "link" ? 0.98 : 0.98 }}
        className={cn(
          "font-text font-light inline-flex items-center justify-center rounded-full",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          "tracking-body",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
      </motion.button>
    )
  },
)

AppleButton.displayName = "AppleButton"
