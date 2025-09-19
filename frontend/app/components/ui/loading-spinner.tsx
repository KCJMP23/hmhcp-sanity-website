"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "inline-block rounded-full border-solid border-current border-r-transparent align-[-0.125em]",
  {
    variants: {
      variant: {
        default: "border-blue-600 text-blue-600",
        white: "border-white text-white border-r-transparent",
        muted: "border-gray-400 text-gray-400",
        success: "border-green-600 text-green-600",
        warning: "border-yellow-600 text-yellow-600",
        destructive: "border-red-600 text-red-600",
      },
      size: {
        sm: "h-4 w-4 border-2",
        default: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-[3px]",
        xl: "h-12 w-12 border-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** Show loading text alongside spinner */
  text?: string
  /** Custom loading text className */
  textClassName?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, variant, size, text, textClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        role="status"
        aria-label={text || "Loading"}
        {...props}
      >
        <motion.div 
          className={cn(spinnerVariants({ variant, size }))}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {text && (
          <motion.span
            className={cn(
              "text-sm font-medium text-gray-600 dark:text-gray-400",
              textClassName
            )}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {text}
          </motion.span>
        )}
        <span className="sr-only">{text || "Loading..."}</span>
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner, spinnerVariants }