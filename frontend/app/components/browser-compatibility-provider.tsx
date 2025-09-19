// Ensure the browser compatibility provider is correctly implemented

"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { detect } from "detect-browser"

interface BrowserCompatibilityContextType {
  browser: string | null
  version: string | null
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  supportsBackdropFilter: boolean
  prefersReducedMotion: boolean
}

const BrowserCompatibilityContext = createContext<BrowserCompatibilityContextType>({
  browser: null,
  version: null,
  isMobile: false,
  isIOS: false,
  isAndroid: false,
  supportsBackdropFilter: false,
  prefersReducedMotion: false,
})

export function useBrowserCompatibility() {
  return useContext(BrowserCompatibilityContext)
}

export function BrowserCompatibilityProvider({ children }: { children: ReactNode }) {
  const [browserInfo, setBrowserInfo] = useState<BrowserCompatibilityContextType>({
    browser: null,
    version: null,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    supportsBackdropFilter: false,
    prefersReducedMotion: false,
  })

  useEffect(() => {
    // Detect browser
    const browser = detect()
    const name = browser?.name || "unknown"
    const version = browser?.version || "unknown"

    // Detect mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)

    // Detect feature support
    const supportsBackdropFilter = CSS.supports("backdrop-filter", "blur(10px)")
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Update state
    setBrowserInfo({
      browser: name,
      version,
      isMobile,
      isIOS,
      isAndroid,
      supportsBackdropFilter,
      prefersReducedMotion,
    })

    // Add classes to html element for CSS targeting
    const classesToAdd = [`browser-${name.toLowerCase()}`, isMobile ? "is-mobile" : "is-desktop"]

    // Only add these classes if the condition is true
    if (isIOS) classesToAdd.push("is-ios")
    if (isAndroid) classesToAdd.push("is-android")
    if (supportsBackdropFilter) classesToAdd.push("supports-backdrop-filter")
    else classesToAdd.push("no-backdrop-filter")
    if (prefersReducedMotion) classesToAdd.push("prefers-reduced-motion")

    // Add all valid classes at once
    document.documentElement.classList.add(...classesToAdd)

    return () => {
      // Clean up by removing classes
      document.documentElement.classList.remove(...classesToAdd)
    }
  }, [])

  return <BrowserCompatibilityContext.Provider value={browserInfo}>{children}</BrowserCompatibilityContext.Provider>
}
