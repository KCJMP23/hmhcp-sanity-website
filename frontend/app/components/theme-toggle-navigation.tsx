"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

interface ThemeToggleNavigationProps {
  isScrolled: boolean
}

export function ThemeToggleNavigation({ isScrolled }: ThemeToggleNavigationProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()

  // Ensure component is mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const isDarkBackground = !isScrolled

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={` p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 ${
        isDarkBackground
          ? "hover:bg-white/10"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className={`h-5 w-5 ${isDarkBackground ? "text-blue-300" : "text-blue-300"}`} />
      ) : (
        <Moon className={`h-5 w-5 ${isDarkBackground ? "text-white" : "text-gray-700"}`} />
      )}
    </button>
  )
}