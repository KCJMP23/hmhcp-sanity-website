"use client"

import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
  padding?: boolean
}

const maxWidthClasses = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full"
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "7xl",
  padding = true
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        padding && "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  gap?: number
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 6
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid",
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols["2xl"] && `2xl:grid-cols-${cols["2xl"]}`,
    `gap-${gap}`,
    className
  )

  return <div className={gridClasses}>{children}</div>
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: "vertical" | "horizontal"
  spacing?: number
  responsive?: boolean
}

export function ResponsiveStack({
  children,
  className,
  direction = "vertical",
  spacing = 4,
  responsive = true
}: ResponsiveStackProps) {
  const stackClasses = cn(
    "flex",
    direction === "vertical" ? "flex-col" : "flex-row",
    responsive && direction === "horizontal" && "flex-col sm:flex-row",
    direction === "vertical" ? `space-y-${spacing}` : `space-x-${spacing}`,
    responsive && direction === "horizontal" && `space-y-${spacing} sm:space-y-0 sm:space-x-${spacing}`,
    className
  )

  return <div className={stackClasses}>{children}</div>
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl"
  responsive?: boolean
}

export function ResponsiveText({
  children,
  className,
  size = "base",
  responsive = true
}: ResponsiveTextProps) {
  const textClasses = cn(
    responsive ? {
      "text-xs sm:text-sm": size === "xs",
      "text-sm sm:text-base": size === "sm",
      "text-base sm:text-lg": size === "base",
      "text-lg sm:text-xl md:text-2xl": size === "lg",
      "text-xl sm:text-2xl md:text-3xl": size === "xl",
      "text-2xl sm:text-3xl md:text-4xl": size === "2xl",
      "text-3xl sm:text-4xl md:text-5xl": size === "3xl",
      "text-4xl sm:text-5xl md:text-6xl": size === "4xl",
      "text-5xl sm:text-6xl md:text-7xl": size === "5xl",
      "text-6xl sm:text-7xl md:text-8xl": size === "6xl"
    } : `text-${size}`,
    className
  )

  return <div className={textClasses}>{children}</div>
}