"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"
import { Progress } from "./progress"

const overlayVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-black/50 backdrop-blur-sm",
        glass: "bg-white/10 backdrop-blur-md border border-white/20",
        solid: "bg-white dark:bg-gray-900",
        subtle: "bg-black/20 backdrop-blur-[2px]",
      },
      animation: {
        fade: "animate-in fade-in-0",
        slideUp: "animate-in fade-in-0 slide-in-from-bottom-4",
        scale: "animate-in fade-in-0 zoom-in-95",
      },
    },
    defaultVariants: {
      variant: "default",
      animation: "fade",
    },
  }
)

const contentVariants = cva(
  "flex flex-col items-center justify-center space-y-4 rounded-2xl p-8 text-center shadow-2xl",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        glass: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30",
        minimal: "bg-transparent",
        card: "bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface LoadingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof overlayVariants> {
  /** Show/hide the overlay */
  show?: boolean
  /** Loading message */
  message?: string
  /** Optional description */
  description?: string
  /** Progress value (0-100) */
  progress?: number
  /** Custom loading icon */
  loadingIcon?: React.ReactNode
  /** Variant for content container */
  contentVariant?: VariantProps<typeof contentVariants>["variant"]
  /** Disable backdrop click to close */
  disableBackdropClick?: boolean
  /** Callback when backdrop is clicked */
  onBackdropClick?: () => void
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      className,
      variant,
      animation,
      contentVariant = "default",
      show = false,
      message = "Loading...",
      description,
      progress,
      loadingIcon,
      disableBackdropClick = true,
      onBackdropClick,
      children,
      ...props
    },
    ref
  ) => {
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !disableBackdropClick && onBackdropClick) {
        onBackdropClick()
      }
    }

    if (!show) return null

    return (
      <div
        ref={ref}
        className={cn(overlayVariants({ variant, animation }), className)}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-message"
        aria-describedby={description ? "loading-description" : undefined}
        {...props}
      >
        <div className={cn(contentVariants({ variant: contentVariant }))}>
          {/* Loading Icon */}
          <div className="flex items-center justify-center">
            {loadingIcon || (
              <LoadingSpinner 
                size="xl" 
                variant={contentVariant === "glass" ? "default" : "default"}
                className="text-blue-600"
              />
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 
              id="loading-message"
              className="text-lg font-semibold font-display text-gray-900 dark:text-gray-100 tracking-tight"
            >
              {message}
            </h3>
            {description && (
              <p 
                id="loading-description"
                className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="w-full max-w-xs space-y-2">
              <Progress 
                value={progress} 
                variant={contentVariant === "glass" ? "glass" : "gradient"}
                showValue={true}
                className="h-2"
              />
            </div>
          )}

          {/* Custom Content */}
          {children}
        </div>
      </div>
    )
  }
)

LoadingOverlay.displayName = "LoadingOverlay"

/**
 * Hook for managing loading overlay state
 */
export function useLoadingOverlay() {
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState("Loading...")
  const [description, setDescription] = React.useState<string>()
  const [progress, setProgress] = React.useState<number>()

  const showLoading = React.useCallback((
    loadingMessage?: string,
    loadingDescription?: string,
    initialProgress?: number
  ) => {
    if (loadingMessage) setMessage(loadingMessage)
    if (loadingDescription) setDescription(loadingDescription)
    if (initialProgress !== undefined) setProgress(initialProgress)
    setLoading(true)
  }, [])

  const hideLoading = React.useCallback(() => {
    setLoading(false)
    setProgress(undefined)
  }, [])

  const updateProgress = React.useCallback((value: number) => {
    setProgress(value)
  }, [])

  const updateMessage = React.useCallback((
    newMessage: string,
    newDescription?: string
  ) => {
    setMessage(newMessage)
    if (newDescription) setDescription(newDescription)
  }, [])

  return {
    loading,
    message,
    description,
    progress,
    showLoading,
    hideLoading,
    updateProgress,
    updateMessage,
  }
}

export { LoadingOverlay, overlayVariants, contentVariants }