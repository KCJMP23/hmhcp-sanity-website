"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useReducedMotion } from "./reduced-motion-provider"
import { useHighContrast } from "./high-contrast-provider"

export function AccessibilityPreferences() {
  const [isOpen, setIsOpen] = useState(false)
  const { prefersReducedMotion, setReducedMotion } = useReducedMotion()
  const { highContrast, setHighContrast } = useHighContrast()
  const [fontSize, setFontSize] = useState(100)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 flex items-center justify-center"
        aria-label="Accessibility preferences"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m9.17 14.83-4.24 4.24" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md backdrop-blur-lg bg-white/90 dark:bg-black/90">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium">Accessibility Preferences</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close accessibility preferences"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Reduced Motion</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    checked={prefersReducedMotion}
                    onCheckedChange={setReducedMotion}
                    aria-label="Toggle reduced motion"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">High Contrast</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Increase color contrast for better readability
                    </p>
                  </div>
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} aria-label="Toggle high contrast" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Font Size</h3>
                    <span>{fontSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    step="10"
                    value={fontSize}
                    onChange={(e) => {
                      const newSize = Number.parseInt(e.target.value)
                      setFontSize(newSize)
                      document.documentElement.style.fontSize = `${newSize}%`
                    }}
                    className="w-full"
                    aria-label="Adjust font size"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>Smaller</span>
                    <span>Default</span>
                    <span>Larger</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setReducedMotion(false)
                      setHighContrast(false)
                      setFontSize(100)
                      document.documentElement.style.fontSize = "100%"
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
