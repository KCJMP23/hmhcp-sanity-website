"use client"

import * as React from "react"
import { Indicator, Root } from '@radix-ui/react-checkbox'
import { Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Checkbox Component with standardized sizes
 * Part of the unified design system
 */

const checkboxVariants = cva(
  "peer shrink-0 rounded-md border border-gray-300 dark:border-gray-600 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-4 w-4",    // 16px - Small checkbox
        md: "h-5 w-5",    // 20px - Medium checkbox (default)
        lg: "h-6 w-6",    // 24px - Large checkbox
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Root>, "size">,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof Root>,
  CheckboxProps
>(({ className, size, ...props }, ref) => {
  const checkIconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }
  
  return (
    <Root
      ref={ref}
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className={checkIconSize[size || 'md']} />
      </Indicator>
    </Root>
  )
})
Checkbox.displayName = Root.displayName

export { Checkbox, checkboxVariants }
