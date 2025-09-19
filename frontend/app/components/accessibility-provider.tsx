"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAccessibilityFixes } from "@/utils/accessibility-fixes"

type AccessibilityPreferences = {
  prefersReducedMotion: boolean
  prefersHighContrast: boolean
  prefersLightMode: boolean
  prefersDarkMode: boolean
  fontSize: "default" | "large" | "x-large"
  enableA11yFeatures: boolean
}

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  prefersReducedMotion: false,
  prefersHighContrast: false,
  prefersLightMode: false,
  prefersDarkMode: false,
  fontSize: "default",
  enableA11yFeatures: true,
}

const AccessibilityContext = createContext<{
  preferences: AccessibilityPreferences
  setPreference: (key: keyof AccessibilityPreferences, value: any) => void
}>({
  preferences: defaultAccessibilityPreferences,
  setPreference: () => {},
})

export function useAccessibility() {
  return useContext(AccessibilityContext)
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultAccessibilityPreferences)

  // Apply accessibility fixes
  useAccessibilityFixes()

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    // Detect user preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const prefersHighContrast = window.matchMedia("(prefers-contrast: more)").matches
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
    const prefersLightMode = window.matchMedia("(prefers-color-scheme: light)").matches

    // Check for saved preferences
    const savedPreferences = localStorage.getItem("accessibility-preferences")

    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        // If parsing fails, use system preferences
        setPreferences((prev) => ({
          ...prev,
          prefersReducedMotion,
          prefersHighContrast,
          prefersDarkMode,
          prefersLightMode,
        }))
      }
    } else {
      // Use system preferences
      setPreferences((prev) => ({
        ...prev,
        prefersReducedMotion,
        prefersHighContrast,
        prefersDarkMode,
        prefersLightMode,
      }))
    }

    // Add listener for preference changes
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const highContrastQuery = window.matchMedia("(prefers-contrast: more)")
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const lightModeQuery = window.matchMedia("(prefers-color-scheme: light)")

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPreferences((prev) => ({ ...prev, prefersReducedMotion: e.matches }))
    }

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPreferences((prev) => ({ ...prev, prefersHighContrast: e.matches }))
    }

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setPreferences((prev) => ({ ...prev, prefersDarkMode: e.matches }))
    }

    const handleLightModeChange = (e: MediaQueryListEvent) => {
      setPreferences((prev) => ({ ...prev, prefersLightMode: e.matches }))
    }

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange)
    highContrastQuery.addEventListener("change", handleHighContrastChange)
    darkModeQuery.addEventListener("change", handleDarkModeChange)
    lightModeQuery.addEventListener("change", handleLightModeChange)

    return () => {
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange)
      highContrastQuery.removeEventListener("change", handleHighContrastChange)
      darkModeQuery.removeEventListener("change", handleDarkModeChange)
      lightModeQuery.removeEventListener("change", handleLightModeChange)
    }
  }, [])

  // Apply preferences to document
  useEffect(() => {
    if (typeof window === "undefined") return

    // Save preferences
    localStorage.setItem("accessibility-preferences", JSON.stringify(preferences))

    // Apply reduced motion
    if (preferences.prefersReducedMotion) {
      document.documentElement.classList.add("reduce-motion")
      document.documentElement.style.setProperty("--enable-animations", "0")
    } else {
      document.documentElement.classList.remove("reduce-motion")
      document.documentElement.style.setProperty("--enable-animations", "1")
    }

    // Apply high contrast
    if (preferences.prefersHighContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }

    // Apply font size
    document.documentElement.style.setProperty(
      "--font-size-multiplier",
      preferences.fontSize === "default" ? "1" : preferences.fontSize === "large" ? "1.25" : "1.5",
    )

    // Apply a11y features
    if (preferences.enableA11yFeatures) {
      document.documentElement.classList.add("a11y-enabled")
    } else {
      document.documentElement.classList.remove("a11y-enabled")
    }
  }, [preferences])

  const setPreference = (key: keyof AccessibilityPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <AccessibilityContext.Provider value={{ preferences, setPreference }}>{children}</AccessibilityContext.Provider>
  )
}
