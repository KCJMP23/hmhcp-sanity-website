import { cn } from "@/lib/utils"
import type React from "react"

interface ContentGridProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
  gap?: "xs" | "sm" | "md" | "lg" | "xl"
}

export function ContentGrid({ children, className, columns = 3, gap = "md" }: ContentGridProps) {
  const getColumnsClass = () => {
    if (columns === 1) return "grid-cols-1"
    if (columns === 2) return "md:grid-cols-2"
    if (columns === 3) return "md:grid-cols-2 lg:grid-cols-3"
    if (columns === 4) return "md:grid-cols-2 lg:grid-cols-4"
    return ""
  }

  return (
    <div
      className={cn(
        "grid",
        getColumnsClass(),
        gap === "xs" && "gap-2",
        gap === "sm" && "gap-4",
        gap === "md" && "gap-6 md:gap-8",
        gap === "lg" && "gap-8 md:gap-12",
        gap === "xl" && "gap-10 md:gap-16",
        "dark:text-gray-200",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface ContentGridItemProps {
  children: React.ReactNode
  className?: string
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3
}

export function ContentGridItem({ children, className, colSpan = 1, rowSpan = 1 }: ContentGridItemProps) {
  return (
    <div
      className={cn(
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "lg:col-span-3",
        colSpan === 4 && "lg:col-span-4",
        rowSpan === 2 && "md:row-span-2",
        rowSpan === 3 && "md:row-span-3",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface ContentGridFeatureProps {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  title: string
  description: string
}

export function ContentGridFeature({ children, className, icon, title, description }: ContentGridFeatureProps) {
  return (
    <div className={cn("premium-card flex flex-col", className)}>
      {icon && <div className="mb-6">{icon}</div>}
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      <div className="mt-auto">{children}</div>
    </div>
  )
}
