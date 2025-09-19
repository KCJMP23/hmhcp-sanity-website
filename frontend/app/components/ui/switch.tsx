"use client"

import * as React from "react"
import { Root, Thumb } from '@radix-ui/react-switch'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Switch Component with standardized sizes
 * Part of the unified design system
 */

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700",
  {
    variants: {
      size: {
        sm: "h-5 w-9",     // Small switch
        md: "h-6 w-11",    // Medium switch (default)
        lg: "h-7 w-14",    // Large switch
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        md: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0",
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Root>, "size">,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof Root>,
  SwitchProps
>(({ className, size, ...props }, ref) => (
  <Root
    className={cn(switchVariants({ size }), className)}
    {...props}
    ref={ref}
  >
    <Thumb className={cn(thumbVariants({ size }))} />
  </Root>
))
Switch.displayName = Root.displayName

export { Switch, switchVariants }
