import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import type React from "react"
import { createElement } from "react"

interface TypographyProps {
  as?: keyof React.JSX.IntrinsicElements
  variant?: "display" | "heading1" | "heading2" | "heading3" | "heading4" | "body" | "small" | "caption" | "label"
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Typography({ as, variant = "body", children, className, style }: TypographyProps) {
  // Base styles with Apple font family
  const baseStyles = "text-gray-900 dark:text-white"

  // Updated styles to match hero section responsive scaling pattern
  const variantStyles = {
    display: "font-sf-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extralight tracking-tight leading-tight",
    heading1: "font-sf-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-extralight tracking-tight leading-tight",
    heading2: "font-sf-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-light tracking-tight leading-tight",
    heading3: "font-sf-display text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-light tracking-normal leading-snug",
    heading4: "font-sf-display text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-normal tracking-normal leading-snug",
    body: "font-sf-text text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl font-light leading-relaxed text-gray-600 dark:text-gray-300 tracking-normal",
    small: "font-sf-text text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-lg font-light leading-normal text-gray-500 dark:text-gray-400 tracking-normal",
    caption: "font-sf-text text-xs sm:text-xs md:text-sm lg:text-sm xl:text-sm 2xl:text-base font-light leading-normal text-gray-500 dark:text-gray-400 tracking-normal",
    label: "font-sf-text text-sm sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-lg font-medium leading-normal tracking-normal",
  }

  // Map variants to appropriate HTML elements if 'as' is not provided
  let Component: keyof React.JSX.IntrinsicElements = as || "div"

  if (!as) {
    switch (variant) {
      case "display":
      case "heading1":
        Component = "h1"
        break
      case "heading2":
        Component = "h2"
        break
      case "heading3":
        Component = "h3"
        break
      case "heading4":
        Component = "h4"
        break
      case "body":
        Component = "p"
        break
      case "small":
      case "caption":
      case "label":
        Component = "span"
        break
      default:
        Component = "div"
    }
  }

  return createElement(
    Component,
    {
      className: cn(baseStyles, variantStyles[variant], className),
      style
    },
    children
  )
}
