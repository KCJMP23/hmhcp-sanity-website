"use client"

import type React from "react"

import { forwardRef } from "react"
import Link from "next/link"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link"
type ButtonSize = "small" | "medium" | "large" | "xlarge"

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
  className?: string
  children: React.ReactNode
}

interface LinkButtonProps extends Omit<HTMLMotionProps<"a">, 'children' | 'href'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
  className?: string
  children: React.ReactNode
  href: string
  external?: boolean
}

// Button styling based on variant and size
const getButtonStyles = (variant: ButtonVariant, size: ButtonSize, fullWidth: boolean) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-full"

  // Variant styles
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
    secondary:
      "bg-white hover:bg-gray-50 text-blue-600 shadow-md hover:shadow-lg border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-blue-400 dark:border-gray-700",
    outline: "border border-white text-white hover:bg-white/10 dark:border-white dark:text-white",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200",
    link: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-4 hover:underline",
  }

  // Size styles
  const sizeStyles = {
    small: "text-xs px-3 py-1.5 ",
    medium: "text-sm px-4 py-2 ",
    large: "text-base px-6 py-3 ",
    xlarge: "text-lg px-8 py-4 ",
  }

  // Width styles
  const widthStyles = fullWidth ? "w-full" : ""

  return cn(baseStyles, variantStyles[variant], sizeStyles[size], widthStyles)
}

// Button component
export const AppleButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      icon,
      iconPosition = "right",
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const buttonStyles = getButtonStyles(variant, size, fullWidth)

    return (
      <motion.button
        ref={ref}
        className={cn(buttonStyles, className)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
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

// Link Button component
export const AppleLinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      href,
      external = false,
      variant = "primary",
      size = "medium",
      icon,
      iconPosition = "right",
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const buttonStyles = getButtonStyles(variant, size, fullWidth)

    if (external) {
      return (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonStyles, className)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
        </motion.a>
      )
    }

    return (
      <Link href={href} passHref>
        <motion.a
          className={cn(buttonStyles, className)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
        </motion.a>
      </Link>
    )
  },
)

AppleLinkButton.displayName = "AppleLinkButton"

// Export AppleStyleButton as an alias for AppleButton for backward compatibility
export const AppleStyleButton = AppleButton
