"use client"

import * as React from "react"
import { Indicator, Root } from '@radix-ui/react-progress'
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root> & {
    variant?: "default" | "gradient" | "glass"
    size?: "sm" | "default" | "lg"
    showValue?: boolean
  }
>(({ className, value, variant = "default", size = "default", showValue = false, ...props }, ref) => {
  const progressValue = value || 0

  return (
    <div className="relative w-full">
      <Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          {
            "h-2": size === "sm",
            "h-4": size === "default", 
            "h-6": size === "lg",
            // Glass morphism effect
            "backdrop-blur-md bg-white/20 border border-white/30 shadow-lg": variant === "glass",
          },
          className
        )}
        {...props}
      >
        <Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            {
              "bg-primary": variant === "default",
              "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600": variant === "gradient",
              "bg-gradient-to-r from-blue-500/80 via-indigo-500/80 to-purple-500/80 backdrop-blur-sm": variant === "glass",
            }
          )}
          style={{ transform: `translateX(-${100 - (progressValue)}%)` }}
        />
      </Root>
      
      {showValue && (
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progressValue)}%</span>
          {progressValue < 100 && <span>Loading...</span>}
        </div>
      )}
    </div>
  )
})

Progress.displayName = Root.displayName

export { Progress }
