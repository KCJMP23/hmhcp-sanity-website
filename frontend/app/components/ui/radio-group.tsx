"use client"

import * as React from "react"
import { Indicator, Item, Root } from '@radix-ui/react-radio-group'
import { Circle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * RadioGroup Components with standardized sizes
 * Part of the unified design system
 */

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => {
  return (
    <Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = Root.displayName

const radioItemVariants = cva(
  "aspect-square rounded-full border border-gray-300 dark:border-gray-600 text-blue-600 ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 data-[state=checked]:border-blue-600",
  {
    variants: {
      size: {
        sm: "h-4 w-4",    // 16px - Small radio
        md: "h-5 w-5",    // 20px - Medium radio (default)
        lg: "h-6 w-6",    // 24px - Large radio
      }
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface RadioGroupItemProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Item>, "size">,
    VariantProps<typeof radioItemVariants> {}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof Item>,
  RadioGroupItemProps
>(({ className, size, ...props }, ref) => {
  const indicatorSize = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  }
  
  return (
    <Item
      ref={ref}
      className={cn(radioItemVariants({ size }), className)}
      {...props}
    >
      <Indicator className="flex items-center justify-center">
        <Circle className={cn("fill-current text-current", indicatorSize[size || 'md'])} />
      </Indicator>
    </Item>
  )
})
RadioGroupItem.displayName = Item.displayName

export { RadioGroup, RadioGroupItem, radioItemVariants }
