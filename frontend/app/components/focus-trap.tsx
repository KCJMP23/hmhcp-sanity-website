"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface FocusTrapProps {
  children: React.ReactNode
  isActive: boolean
  onEscape?: () => void
}

export function FocusTrap({ children, isActive, onEscape }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus the first element
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === "Escape" && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key
      if (e.key === "Tab") {
        // If shift + tab on first element, go to last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
        // If tab on last element, go to first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Store previous active element to restore focus later
    const previousActiveElement = document.activeElement as HTMLElement

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      // Restore focus when unmounted
      previousActiveElement?.focus()
    }
  }, [isActive, onEscape])

  return <div ref={containerRef}>{children}</div>
}
