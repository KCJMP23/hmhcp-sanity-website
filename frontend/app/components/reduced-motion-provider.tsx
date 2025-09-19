"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface ReducedMotionContextType {
  prefersReducedMotion: boolean
  setReducedMotion: (value: boolean) => void
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false,
  setReducedMotion: () => {},
})

export function useReducedMotion() {
  return useContext(ReducedMotionContext)
}

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)

    // Check for stored preference
    const storedPreference = localStorage.getItem("reduced-motion")
    if (storedPreference !== null) {
      setPrefersReducedMotion(storedPreference === "true")
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  const setReducedMotion = (value: boolean) => {
    setPrefersReducedMotion(value)
    localStorage.setItem("reduced-motion", value.toString())
  }

  useEffect(() => {
    // Apply class to body
    if (prefersReducedMotion) {
      document.body.classList.add("reduced-motion")
    } else {
      document.body.classList.remove("reduced-motion")
    }
  }, [prefersReducedMotion])

  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion, setReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  )
}
