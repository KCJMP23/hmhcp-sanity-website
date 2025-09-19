import type React from "react"
import { cn } from "@/lib/utils"

interface ContentSectionProps {
  children: React.ReactNode
  className?: string
  width?: "narrow" | "normal" | "wide"
  spacing?: "xs" | "sm" | "md" | "lg" | "xl"
}

export function ContentSection({ children, className, width = "normal", spacing = "lg" }: ContentSectionProps) {
  return (
    <section
      className={cn(
        width === "narrow" && "content-section-narrow",
        width === "normal" && "content-section",
        width === "wide" && "content-section-wide",
        spacing === "xs" && "space-xs",
        spacing === "sm" && "space-sm",
        spacing === "md" && "space-md",
        spacing === "lg" && "space-lg",
        spacing === "xl" && "space-xl",
        className,
      )}
    >
      {children}
    </section>
  )
}

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4"
}

export function SectionTitle({ children, className, as = "h2" }: SectionTitleProps) {
  const Component = as

  return <Component className={cn("section-title", className)}>{children}</Component>
}

interface SectionDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function SectionDescription({ children, className }: SectionDescriptionProps) {
  return <p className={cn("section-description", className)}>{children}</p>
}

export function ContentHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("text-center mb-16", className)}>{children}</div>
}
