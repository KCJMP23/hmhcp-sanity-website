import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import type React from "react"
import { createElement } from "react"

interface SectionContainerProps {
  children: ReactNode
  className?: string
  as?: keyof React.JSX.IntrinsicElements
  id?: string
  fullWidth?: boolean
  noPadding?: boolean
}

export function SectionContainer({
  children,
  className,
  as: Component = "section",
  id,
  fullWidth = false,
  noPadding = false,
}: SectionContainerProps) {
  return createElement(
    Component,
    {
      id,
      className: cn("relative", !noPadding && "py-16 md:py-24", className)
    },
    createElement(
      "div",
      {
        className: cn(!fullWidth && "container mx-auto px-6")
      },
      children
    )
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}

export function SectionHeader({ title, subtitle, centered = false, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-12", centered && "text-center", className)}>
      <h2 className="text-3xl md:text-4xl font-light tracking-wide text-gray-900 dark:text-white mb-4">{title}</h2>
      {subtitle && <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">{subtitle}</p>}
    </div>
  )
}
