"use client"

import { useEffect, useState } from "react"

export function KeyboardNavigationHelper() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        document.body.classList.add("user-is-tabbing")
        setIsKeyboardUser(true)
        window.removeEventListener("keydown", handleFirstTab)
      }
    }

    window.addEventListener("keydown", handleFirstTab)

    return () => {
      window.removeEventListener("keydown", handleFirstTab)
    }
  }, [])

  useEffect(() => {
    if (isKeyboardUser) {
      // Add keyboard navigation helpers
      const focusableElements = document.querySelectorAll(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
      )

      focusableElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.dataset.keyboardFocusable = "true"
        }
      })
    }
  }, [isKeyboardUser])

  return null
}
