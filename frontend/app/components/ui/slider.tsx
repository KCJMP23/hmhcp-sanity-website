"use client"

import * as React from "react"
import { Range, Root, Thumb, Track } from '@radix-ui/react-slider'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Slider Component with standardized sizes
 * Part of the unified design system
 */

const sliderVariants = cva(
  "relative flex w-full touch-none select-none items-center",
  {
    variants: {
      size: {
        sm: "",
        md: "",
        lg: "",
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const trackVariants = cva(
  "relative w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
  {
    variants: {
      size: {
        sm: "h-1",     // 4px track
        md: "h-2",     // 8px track (default)
        lg: "h-3",     // 12px track
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const thumbVariants = cva(
  "block rounded-full border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800 shadow-lg ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110",
  {
    variants: {
      size: {
        sm: "h-4 w-4",     // 16px thumb
        md: "h-5 w-5",     // 20px thumb (default)
        lg: "h-6 w-6",     // 24px thumb
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Root>, "size">,
    VariantProps<typeof sliderVariants> {}

const Slider = React.forwardRef<
  React.ElementRef<typeof Root>,
  SliderProps
>(({ className, size, ...props }, ref) => (
  <Root
    ref={ref}
    className={cn(sliderVariants({ size }), className)}
    {...props}
  >
    <Track className={cn(trackVariants({ size }))}>
      <Range className="absolute h-full bg-blue-600 rounded-full" />
    </Track>
    <Thumb className={cn(thumbVariants({ size }))} />
  </Root>
))
Slider.displayName = Root.displayName

export { Slider, sliderVariants }
