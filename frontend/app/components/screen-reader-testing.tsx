"use client"

import { useState } from "react"

export function ScreenReaderTesting() {
  const [isOpen, setIsOpen] = useState(false)
  const [visuallyHidden, setVisuallyHidden] = useState(false)
  const [audioFeedback, setAudioFeedback] = useState(false)
  const [currentFocus, setCurrentFocus] = useState<string | null>(null)
  const [ariaAttributes, setAriaAttributes] = useState<Record<string, string>>({})
  const [elementRole, setElementRole] = useState<string | null>(null)

  // Simulate screen reader behavior
  const simulateScreenReader = (enable: boolean) => {
    if (enable) {
      // Add event listeners for focus events
      document.addEventListener("focusin", handleFocusIn)
      
      // Start with the first focusable element
      const firstFocusable = document.querySelector<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (firstFocusable) {
        firstFocusable.focus()
        handleFocusIn({ target: firstFocusable } as unknown as FocusEvent)
      }
    } else {
      // Remove event listeners
      document.removeEventListener("focusin", handleFocusIn)
      setCurrentFocus(null)
      setAriaAttributes({})
      setElementRole(null)
    }
  }
  
  // Handle focus events
  const handleFocusIn = (event: FocusEvent) => {
    const element = event.target as HTMLElement
    
    if (!element) return
    
    // Get element description
    let description = ""
    
    if (element.tagName === "A") {
      description = "Link"
      if (element.textContent) {
        description += `: ${element.textContent.trim()}`
      }
    } else if (element.tagName === "BUTTON") {
      description = "Button"
      if (element.textContent) {
        description += `: ${element.textContent.trim()}`
      } else if (element.getAttribute("aria-label")) {
        description += `: ${element.getAttribute("aria-label")}`
      }
    } else if (element.tagName === "INPUT") {
      const type = element.getAttribute("type") || "text"
      description = `Input (${type})`
      
      const label = document.querySelector(`label[for="${element.id}"]`)
      if (label) {
        description += `: ${label.textContent?.trim()}`
      } else if (element.getAttribute("aria-label")) {
        description += `: ${element.getAttribute("aria-label")}`
      } else if (element.getAttribute("placeholder")) {
        description += `: ${element.getAttribute("placeholder")}`
      }
    } else {
      description = element.tagName.toLowerCase()
      if (element.textContent) {
        const text = element.textContent.trim()
        if (text.length > 50) {
          description += `: ${text.substring(0, 50)}...`
        } else if (text) {
          description += `: ${text}`
        }
      }
    }
    
    setCurrentFocus(description)
    
    // Get ARIA attributes
    const attributes: Record<string, string> = {}
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      if (attr.name.startsWith("aria-")) {
        attributes[attr.name] = attr.value
      }
    }
    setAriaAttributes(attributes)
    
    // Get role
    const role = element.getAttribute("role")
    setElementRole(role)
    
    // Speak the element (if audio feedback is enabled)
    if (audioFeedback) {
      speakElement(description, element)
    }
  }
  
  // Speak element using Web Speech API
  const speakElement = (description: string, element: HTMLElement) => {
    if (!('speechSynthesis' in window)) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(description)
    utterance.rate = 1.2
    utterance.pitch = 1
    
    // Speak
    window.speechSynthesis.speak(utterance)
  }
  
  // Toggle visual display
  const toggleVisualDisplay = () => {
    const newState = !visuallyHidden
    setVisuallyHidden(newState)
    
    if (newState) {
      // Add a screen reader only class to the body
      document.body.classList.add("sr-only-simulation")
    } else {
      // Remove the class
      document.body.classList.remove("sr-only-simulation")
    }
  }
  
  // Toggle audio feedback
  const toggleAudioFeedback = () => {
    const newState = !audioFeedback
    setAudioFeedback(newState)
    
    if (newState && currentFocus) {
      // Speak the current focus
      speakElement(currentFocus, document.activeElement as HTMLElement)
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-62 left-6 z-50 p-3 bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="Open screen reader testing tool"
      >
        <span className="text-xs">SR</span>
      </button>
    </>
  )
}
