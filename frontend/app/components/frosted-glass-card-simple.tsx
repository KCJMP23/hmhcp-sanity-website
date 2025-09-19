"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface FrostedGlassCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  intensity?: "light" | "medium" | "strong"
  onClick?: () => void
  rotate3d?: boolean
}

export function FrostedGlassCard({
  children,
  className,
  hoverEffect = false,
  intensity = "medium",
  onClick,
  rotate3d = false,
}: FrostedGlassCardProps) {
  const intensityClasses = {
    light: "bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm",
    medium: "bg-white/60 dark:bg-gray-800/60 backdrop-blur-md",
    strong: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg",
  }

  return (
    <div
      className={cn(
        "p-6 shadow-lg border border-white/20 dark:border-gray-700/20 rounded-2xl",
        "transition-all duration-300 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;",
        intensityClasses[intensity],
        hoverEffect && "hover:scale-[1.02] hover:shadow-xl",
        rotate3d && "hover:[transform:perspective(1000px)_rotateX(-5deg)_rotateY(5deg)]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}