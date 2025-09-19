import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type ButtonSize = "sm" | "md" | "lg" | "xl"
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "danger"

interface ButtonStandardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
  fullWidth?: boolean
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  href?: string
  target?: string
  rel?: string
}

export function ButtonStandard({
  children,
  className,
  size = "md",
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  loadingText,
  icon,
  iconPosition = "left",
  href,
  target,
  rel,
  ...props
}: ButtonStandardProps) {
  // Size classes with exact specifications
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg",
    xl: "px-8 py-3 text-xl",
  }

  // Variant classes with exact blue pill specifications
  const variantClasses = {
    primary: "bg-blue-700 dark:bg-blue-600 text-white hover:bg-blue-800 dark:hover:bg-blue-700 border border-blue-500/30 dark:border-blue-400/40 shadow-xl hover:shadow-2xl",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
    outline:
      "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100",
    link: "text-blue-600 dark:text-blue-400 hover:underline p-0",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  }

  // Loading state
  const loadingState = isLoading ? (
    <span className="rounded-full flex items-center justify-center">
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {loadingText || children}
    </span>
  ) : (
    <>
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </>
  )

  const buttonClasses = cn(
    "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none rounded-full",
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? "w-full sm:w-auto" : "",
    className,
  )

  // Special styling for primary variant
  const primarySpecialStyle = variant === 'primary' ? {
    backdropFilter: 'blur(4px) saturate(130%)',
    boxShadow: '0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
  } : {}

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={buttonClasses}
        style={primarySpecialStyle}
      >
        {loadingState}
      </Link>
    )
  }

  return (
    <button
      className={buttonClasses}
      disabled={isLoading || props.disabled}
      style={primarySpecialStyle}
      {...props}
    >
      {loadingState}
    </button>
  )
}
