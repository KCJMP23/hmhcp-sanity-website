import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/apple-typography"

interface SectionContainerProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  centered?: boolean
  background?: "white" | "light" | "gradient" | "dark"
  spacing?: "normal" | "large" | "compact"
}

export function SectionContainer({
  children,
  className,
  title,
  subtitle,
  centered = false,
  background = "white",
  spacing = "normal",
}: SectionContainerProps) {
  const backgrounds = {
    white: "bg-white dark:bg-gray-900",
    light: "bg-gray-50 dark:bg-gray-800",
    gradient: "bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
    dark: "bg-gray-900 dark:bg-black text-white",
  }

  const spacings = {
    normal: "py-16 md:py-24",
    large: "py-24 md:py-32",
    compact: "py-12 md:py-16",
  }

  return (
    <section className={cn(backgrounds[background], spacings[spacing], className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className={cn("mb-16", centered && "text-center")}>
            {title && (
              <Typography as="h2" variant="heading1" className="mb-4">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                as="p"
                variant="body"
                className={cn("text-gray-600 dark:text-gray-300", centered && "max-w-3xl mx-auto")}
              >
                {subtitle}
              </Typography>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
