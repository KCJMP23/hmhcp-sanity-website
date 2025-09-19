import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Textarea Component with standardized padding and styling
 * Consistent with the unified design system
 */

const textareaVariants = cva(
  "flex w-full rounded-2xl border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y",
  {
    variants: {
      size: {
        // Padding matches input fields, min-height provides appropriate space
        sm: "px-3 py-2 text-sm min-h-[80px]",       // Small size
        md: "px-4 py-3 text-base min-h-[100px]",    // Medium size (default)
        lg: "px-5 py-4 text-lg min-h-[120px]",      // Large size
        xl: "px-6 py-5 text-xl min-h-[140px]",      // Extra large
      },
      variant: {
        default: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        error: "border-red-500 focus-visible:ring-red-500",
        success: "border-green-500 focus-visible:ring-green-500",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends Omit<React.ComponentProps<"textarea">, "size">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ size, variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
