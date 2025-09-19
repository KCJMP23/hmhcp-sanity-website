"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function FooterAccessibilityControls() {
  const [fontSize, setFontSize] = useState("medium")
  const [contrast, setContrast] = useState("normal")
  const [reducedMotion, setReducedMotion] = useState(false)

  const handleFontSizeChange = (size: string) => {
    setFontSize(size)
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg")
    document.documentElement.classList.add(`text-${size}`)
  }

  const handleContrastChange = (contrastMode: string) => {
    setContrast(contrastMode)
    document.documentElement.classList.remove("high-contrast", "normal-contrast")
    document.documentElement.classList.add(`${contrastMode}-contrast`)
  }

  const handleReducedMotionChange = (reduced: boolean) => {
    setReducedMotion(reduced)
    if (reduced) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1">
          <Settings className="h-3 w-3" />
          <span>Accessibility</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Accessibility Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Text Size</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleFontSizeChange("sm")}
                className={`px-2 py-1 text-xs  ${
                  fontSize === "sm"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                Small
              </button>
              <button
                onClick={() => handleFontSizeChange("base")}
                className={`px-2 py-1 text-xs  ${
                  fontSize === "base"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => handleFontSizeChange("lg")}
                className={`px-2 py-1 text-xs  ${
                  fontSize === "lg"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                Large
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Contrast</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleContrastChange("normal")}
                className={`px-2 py-1 text-xs  ${
                  contrast === "normal"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => handleContrastChange("high")}
                className={`px-2 py-1 text-xs  ${
                  contrast === "high"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                High Contrast
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Motion</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleReducedMotionChange(false)}
                className={`px-2 py-1 text-xs  ${
                  !reducedMotion
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => handleReducedMotionChange(true)}
                className={`px-2 py-1 text-xs  ${
                  reducedMotion
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                Reduced Motion
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
