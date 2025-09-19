"use client"

import Image from "next/image"
// import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  priority?: boolean
  variant?: "adaptive" | "navigation" | "navigation-scroll" | "white" | "dark"
  isScrolled?: boolean
  isDarkBackground?: boolean
}

export function Logo({ className, width = 200, height = 50, priority = false, variant = "adaptive", isScrolled = false, isDarkBackground = false }: LogoProps) {
  // const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle hydration mismatch by using default theme during SSR
  const theme = 'light'

  // For navigation variant - smart logo switching based on context
  if (variant === "navigation" || variant === "navigation-scroll") {
    // Smart logo selection based on context:
    // 1. When on dark background AND not scrolled: use white logo
    // 2. When scrolled: use logo based on theme (white in dark mode, black in light mode)
    // 3. When not on dark background AND not scrolled: use logo based on theme
    const useWhiteLogo = (() => {
      // During SSR and initial render, determine logo based on props to avoid flicker
      if (!mounted) {
        // If on dark background and not scrolled, use white logo by default
        if (!isScrolled && isDarkBackground) {
          return true
        }
        // Otherwise use black logo for initial render
        return false
      }
      
      // If not scrolled and on dark background page, always use white
      if (!isScrolled && isDarkBackground) {
        return true
      }
      
      // In all other cases, follow the theme
      // This includes when scrolled (header has background) or when not on dark background
      return theme === 'dark'
    })()
    
    // Use the actual white or black logo file
    const logoSrc = useWhiteLogo ? "/hmhcp-logo-white-real.svg" : "/hmhcp-logo-black.svg"
    
    return (
      <Image
        src={logoSrc}
        alt="HM Healthcare Partners"
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-auto",
          variant === "navigation-scroll" && "transition-all duration-300",
          className
        )}
        style={{
          imageRendering: "crisp-edges"
        }}
      />
    )
  }

  // Force white version
  if (variant === "white") {
    return (
      <Image
        src="/hmhcp-logo-white-real.svg"
        alt="HM Healthcare Partners"
        width={width}
        height={height}
        priority={priority}
        className={cn("h-auto", className)}
        style={{ imageRendering: "crisp-edges" }}
      />
    )
  }

  // Force dark version
  if (variant === "dark") {
    return (
      <Image
        src="/hmhcp-logo-dark.svg"
        alt="HM Healthcare Partners"
        width={width}
        height={height}
        priority={priority}
        className={cn("h-auto", className)}
        style={{ imageRendering: "crisp-edges" }}
      />
    )
  }

  // Adaptive theme-based logic
  // For the footer and other places, use the block logo
  const blockLogoSrc = "/hmhcp-block-logo.svg"
  
  // During SSR and before mounting, return block logo to match client
  if (!mounted) {
    return (
      <Image
        src={blockLogoSrc}
        alt="HM Healthcare Partners"
        width={width}
        height={height}
        priority={priority}
        className={cn("h-auto dark:invert transition-all duration-300", className)}
        style={{ imageRendering: "crisp-edges" }}
      />
    )
  }

  // After mounting, use block logo with dark mode inversion
  return (
    <Image
      src={blockLogoSrc}
      alt="HM Healthcare Partners"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto dark:invert transition-all duration-300", className)}
      style={{ imageRendering: "crisp-edges" }}
    />
  )
}

// For cases where we want to force a specific theme version (backward compatibility)
export function LogoWhite({ className, width = 200, height = 50, priority = false }: LogoProps) {
  return (
    <Logo
      variant="white"
      className={className}
      width={width}
      height={height}
      priority={priority}
    />
  )
}

export function LogoDark({ className, width = 200, height = 50, priority = false }: LogoProps) {
  return (
    <Logo
      variant="dark"
      className={className}
      width={width}
      height={height}
      priority={priority}
    />
  )
}