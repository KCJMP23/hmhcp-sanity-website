"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface HighContrastContextType {
  highContrast: boolean
  setHighContrast: (value: boolean) => void
}

const HighContrastContext = createContext<HighContrastContextType>({
  highContrast: false,
  setHighContrast: () => {},
})

export function useHighContrast() {
  return useContext(HighContrastContext)
}

export function HighContrastProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrastState] = useState(false)

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia("(prefers-contrast: more)")
    setHighContrastState(mediaQuery.matches)

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrastState(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)

    // Check for stored preference
    const storedPreference = localStorage.getItem("high-contrast")
    if (storedPreference !== null) {
      setHighContrastState(storedPreference === "true")
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  const setHighContrast = (value: boolean) => {
    setHighContrastState(value)
    localStorage.setItem("high-contrast", value.toString())
  }

  useEffect(() => {
    // Apply class to body
    if (highContrast) {
      document.body.classList.add("high-contrast")
    } else {
      document.body.classList.remove("high-contrast")
    }
  }, [highContrast])

  return (
    <HighContrastContext.Provider value={{ highContrast, setHighContrast }}>{children}</HighContrastContext.Provider>
  )
}
