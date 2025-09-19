"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

interface ThemeToggleProps {
  isScrolled?: boolean
}

export function ThemeToggle({ isScrolled = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()

  // Ensure component is mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // During SSR, render a placeholder that matches the expected button appearance
    return (
      <div className="w-9 h-9 p-2 flex items-center justify-center">
        <div className="w-5 h-5 rounded opacity-50" />
      </div>
    )
  }

  // Define pages with dark backgrounds that need white text - matches navigation
  const darkBackgroundPages = [
    "/", 
    "/about",
    "/platforms",
    "/platforms/intellic-edc", 
    "/platforms/mybc-health",
    "/research",
    "/research/clinical-studies",
    "/research/publications", 
    "/research/qa-qi",
    "/services",
    "/services/strategic-consulting",
    "/services/implementation",
    "/services/research",
    "/services/education-training",
    "/services/quality-improvement",
    "/education",
    "/blog",
    "/contact",
    "/case-studies",
    "/careers",
    "/leadership",
    "/partners",
    "/publications",
    "/webinars",
    "/faq",
    "/accessibility",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
    "/offline"
  ]
  
  // Pages with light backgrounds that need dark text when not scrolled
  const lightBackgroundPages = [
    "/admin",
    "/admin/login"
  ]
  
  // Also check if it's a blog post page (starts with /blog/)
  const isBlogPost = pathname.startsWith('/blog/') && pathname !== '/blog/'
  
  const isDarkBackgroundPage = darkBackgroundPages.includes(pathname) || isBlogPost
  const isLightBackgroundPage = lightBackgroundPages.includes(pathname) || pathname.startsWith("/admin/")
  
  // Use same logic as navigation for consistency
  const shouldUseDarkText = (() => {
    // When scrolled, header has white/gray background, so use dark text
    if (isScrolled) {
      return theme !== 'dark' // Dark text in light mode, white text in dark mode
    }
    
    // When not scrolled on dark background pages, use white text
    if (isDarkBackgroundPage) {
      return false // White text over dark hero background
    }
    
    // On light background pages when not scrolled, use dark text
    if (isLightBackgroundPage) {
      return theme !== 'dark' // Dark text in light mode, white text in dark mode
    }
    
    // Default: pages not explicitly listed, assume dark background for safety
    return false // White text by default
  })()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={` p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 ${
        shouldUseDarkText
          ? "hover:bg-gray-100 dark:hover:bg-gray-800"
          : "hover:bg-white/10"
      }`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className={`h-5 w-5 transition-colors ${
          shouldUseDarkText 
            ? "text-gray-700 dark:text-gray-300" 
            : "text-white drop-shadow-sm"
        }`} />
      ) : (
        <Moon className={`h-5 w-5 transition-colors ${
          shouldUseDarkText 
            ? "text-gray-700 dark:text-gray-300" 
            : "text-white drop-shadow-sm"
        }`} />
      )}
    </button>
  )
}