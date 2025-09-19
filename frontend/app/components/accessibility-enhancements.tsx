"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Typography } from "@/components/ui/apple-typography"
import { FrostedCard } from "@/components/ui/global-styles"
import { cn } from "@/lib/utils"
import { Settings, X, ZoomIn, ZoomOut, Type, Moon, Sun } from "lucide-react"

export function AccessibilityEnhancements() {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100) // percentage
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  // Apply accessibility settings
  useEffect(() => {
    // Font size
    document.documentElement.style.fontSize = `${fontSize}%`

    // High contrast
    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }

    // Reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }

    // Theme
    if (theme === "light") {
      document.documentElement.classList.remove("dark")
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [fontSize, highContrast, reducedMotion, theme])

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
        aria-label="Accessibility settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md"
            >
              <FrostedCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <Typography variant="heading3">Accessibility Settings</Typography>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close accessibility settings"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Font Size */}
                  <div>
                    <Typography variant="label" className="mb-2 block">
                      Text Size
                    </Typography>
                    <div className="flex items-center">
                      <button
                        onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Decrease text size"
                      >
                        <ZoomOut className="w-5 h-5" />
                      </button>
                      <div className="flex-1 mx-4">
                        <input
                          type="range"
                          min="80"
                          max="150"
                          step="10"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-primary-500"
                          aria-label="Text size"
                        />
                      </div>
                      <button
                        onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Increase text size"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center mt-1">
                      <Typography variant="caption">{fontSize}%</Typography>
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <Typography variant="label" className="mb-2 block">
                      Theme
                    </Typography>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setTheme("light")}
                        className={cn(
                          "flex-1 py-2 px-4  flex items-center justify-center",
                          theme === "light"
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                        )}
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "flex-1 py-2 px-4  flex items-center justify-center",
                          theme === "dark"
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                        )}
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={cn(
                          "flex-1 py-2 px-4  flex items-center justify-center",
                          theme === "system"
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                        )}
                      >
                        <Type className="w-4 h-4 mr-2" />
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* High Contrast */}
                  <div className="flex items-center justify-between">
                    <Typography variant="label">High Contrast</Typography>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={() => setHighContrast(!highContrast)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after: after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  {/* Reduced Motion */}
                  <div className="flex items-center justify-between">
                    <Typography variant="label">Reduced Motion</Typography>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={() => setReducedMotion(!reducedMotion)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after: after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setFontSize(100)
                      setHighContrast(false)
                      setReducedMotion(false)
                      setTheme("system")
                    }}
                    className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </FrostedCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip to content link - visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary-500 text-white px-4 py-2 focus:outline-none"
      >
        Skip to content
      </a>
    </>
  )
}
