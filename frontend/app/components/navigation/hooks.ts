"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { NavigationState } from "./types"

export function useNavigationState(): NavigationState & {
  navRef: React.RefObject<HTMLDivElement | null>
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  handleMouseEnter: (name: string) => void
  handleMouseLeave: () => void
} {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { theme } = useTheme()
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu and mega menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setActiveMenu(null)
  }, [pathname])

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle mouse enter with delay for desktop menu
  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(name)
    }, 100)
  }

  // Handle mouse leave with delay for desktop menu
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 300)
  }

  const isDark = theme === "dark"

  return {
    activeMenu,
    setActiveMenu,
    isOpen,
    setIsOpen,
    scrolled,
    pathname,
    theme,
    isDark,
    navRef,
    timeoutRef,
    handleMouseEnter,
    handleMouseLeave,
  }
}