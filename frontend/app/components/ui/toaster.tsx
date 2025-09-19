"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Toast variant to icon mapping
const getToastIcon = (variant?: string) => {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    case "error":
    case "destructive":
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
    case "info":
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    default:
      return null
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getToastIcon(variant)
        
        return (
          <Toast 
            key={id} 
            variant={variant}
            className={cn(
              // Apple-inspired styling with SF Pro fonts
              "font-text border-none shadow-xl",
              // Enhanced backdrop blur for glass effect
              "backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95",
              // Smooth animations
              "transition-all duration-500 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;",
              // Better spacing and layout
              "p-4 gap-3"
            )}
            {...props}
          >
            <div className="flex items-start gap-3 flex-1">
              {/* Icon with proper sizing */}
              {icon && (
                <div className="flex-shrink-0 mt-0.5">
                  {icon}
                </div>
              )}
              
              {/* Content container */}
              <div className="flex-1 grid gap-1 min-w-0">
                {title && (
                  <ToastTitle className={cn(
                    // SF Pro Display for headings
                    "font-display font-medium text-base leading-tight",
                    // Apple-style letter spacing
                    "tracking-[-0.005em]",
                    // Better text color
                    "text-gray-900 dark:text-gray-100"
                  )}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className={cn(
                    // SF Pro Text for body
                    "font-text font-normal text-sm leading-relaxed",
                    // Apple-style letter spacing for body text
                    "tracking-[-0.01em]",
                    // Subtle text color
                    "text-gray-700 dark:text-gray-300",
                    // Better line wrapping
                    "break-words"
                  )}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            
            {/* Action button if present */}
            {action}
            
            {/* Custom close button with Apple styling */}
            <ToastClose className={cn(
              // Position in top-right
              "absolute right-2 top-2",
              // Apple-style close button
              "h-6 w-6 rounded-full",
              "opacity-70 hover:opacity-100 transition-opacity duration-200",
              "text-gray-500 dark:text-gray-400",
              "hover:text-gray-700 dark:hover:text-gray-200",
              // Focus styling
              "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              // Better interaction area
              "p-1"
            )}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </ToastClose>
          </Toast>
        )
      })}
      <ToastViewport className={cn(
        // Position toasts in a more Apple-like location
        "fixed top-4 right-4 z-[100]",
        // Better spacing and sizing
        "flex flex-col-reverse gap-3",
        "w-full max-w-md sm:max-w-sm",
        // Ensure proper stacking
        "pointer-events-none"
      )} />
    </ToastProvider>
  )
}
