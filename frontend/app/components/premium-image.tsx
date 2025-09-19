"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { validateImageSrc } from "@/utils/image-debug"

interface PremiumImageProps {
  src: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
}

export function PremiumImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
}: PremiumImageProps) {
  const { resolvedTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(resolvedTheme === "dark")
  }, [resolvedTheme])

  // Validate src
  const validatedSrc = validateImageSrc(src ?? undefined)

  // Don't render if src is invalid
  if (!validatedSrc) {
    return null
  }

  return (
    <div className={cn(isDark ? "premium-image-dark" : "premium-image", className)}>
      <Image
        src={validatedSrc || "/placeholder.svg"}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        className={cn("object-cover", fill && "w-full h-full")}
      />
    </div>
  )
}
