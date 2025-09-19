"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "./button"
import { LoadingSpinner } from "./loading-spinner"

const loadingButtonVariants = cva(
  "transition-all duration-200 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;",
  {
    variants: {
      loadingVariant: {
        spinner: "",
        dots: "",
        pulse: "",
      },
    },
    defaultVariants: {
      loadingVariant: "spinner",
    },
  }
)

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    VariantProps<typeof loadingButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  /** Custom loading icon */
  loadingIcon?: React.ReactNode
  /** Position of loading indicator */
  loadingPosition?: "left" | "right" | "replace"
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      loadingIcon,
      loadingPosition = "left",
      loadingVariant = "spinner",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const renderLoadingIndicator = () => {
      if (loadingIcon) {
        return loadingIcon
      }

      switch (loadingVariant) {
        case "dots":
          return (
            <div className="flex space-x-1" role="status" aria-label="Loading">
              <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
            </div>
          )
        case "pulse":
          return (
            <div 
              className="h-4 w-4 bg-current rounded-full animate-pulse"
              role="status" 
              aria-label="Loading"
            />
          )
        default:
          return (
            <LoadingSpinner 
              variant={variant === "outline" || variant === "ghost" ? "default" : "white"} 
              size="sm" 
            />
          )
      }
    }

    const content = (() => {
      if (loading && loadingPosition === "replace") {
        return (
          <span className="flex items-center justify-center gap-2">
            {renderLoadingIndicator()}
            {loadingText && (
              <span className="animate-pulse">{loadingText}</span>
            )}
          </span>
        )
      }

      return (
        <span className="flex items-center justify-center gap-2">
          {loading && loadingPosition === "left" && renderLoadingIndicator()}
          <span className={cn(
            "transition-opacity duration-200",
            loading && loadingPosition === "replace" && "opacity-0"
          )}>
            {loadingText && loading ? loadingText : children}
          </span>
          {loading && loadingPosition === "right" && renderLoadingIndicator()}
        </span>
      )
    })()

    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          loadingButtonVariants({ loadingVariant }),
          {
            "cursor-not-allowed": loading,
            "opacity-90": loading,
          },
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton, loadingButtonVariants }