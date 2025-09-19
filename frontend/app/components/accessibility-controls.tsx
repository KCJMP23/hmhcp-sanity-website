"use client"

import type React from "react"

import { useState } from "react"
import { useAccessibility } from "./accessibility-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Moon, Sun, ZoomIn, ZoomOut } from "lucide-react"

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const { preferences, setPreference } = useAccessibility()

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Accessibility controls"
      >
        <Eye className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-medium">Accessibility Settings</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Tabs defaultValue="display">
              <TabsList className="mb-6">
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="motion">Motion</TabsTrigger>
                <TabsTrigger value="interaction">Interaction</TabsTrigger>
              </TabsList>

              <TabsContent value="display">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Dark Mode</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark theme</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant={preferences.prefersDarkMode ? "outline" : "default"}
                        size="icon"
                        onClick={() => setPreference("prefersDarkMode", false)}
                        aria-label="Light mode"
                      >
                        <Sun className="h-5 w-5" />
                      </Button>
                      <Button
                        variant={preferences.prefersDarkMode ? "default" : "outline"}
                        size="icon"
                        onClick={() => setPreference("prefersDarkMode", true)}
                        aria-label="Dark mode"
                      >
                        <Moon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">High Contrast</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Increase contrast for better readability
                      </p>
                    </div>
                    <Switch
                      checked={preferences.prefersHighContrast}
                      onCheckedChange={(checked) => setPreference("prefersHighContrast", checked)}
                      aria-label="Toggle high contrast"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Text Size</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Adjust the size of text</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const sizes = ["default", "large", "x-large"] as const
                          const currentIndex = sizes.indexOf(preferences.fontSize)
                          const newIndex = Math.max(0, currentIndex - 1)
                          setPreference("fontSize", sizes[newIndex])
                        }}
                        disabled={preferences.fontSize === "default"}
                        aria-label="Decrease text size"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="w-24 text-center">
                        {preferences.fontSize === "default"
                          ? "Normal"
                          : preferences.fontSize === "large"
                            ? "Large"
                            : "X-Large"}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const sizes = ["default", "large", "x-large"] as const
                          const currentIndex = sizes.indexOf(preferences.fontSize)
                          const newIndex = Math.min(sizes.length - 1, currentIndex + 1)
                          setPreference("fontSize", sizes[newIndex])
                        }}
                        disabled={preferences.fontSize === "x-large"}
                        aria-label="Increase text size"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="motion">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Reduce Motion</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and motion effects</p>
                    </div>
                    <Switch
                      checked={preferences.prefersReducedMotion}
                      onCheckedChange={(checked) => setPreference("prefersReducedMotion", checked)}
                      aria-label="Toggle reduced motion"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interaction">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Keyboard Navigation</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enhanced focus indicators for keyboard users
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enableA11yFeatures}
                      onCheckedChange={(checked) => setPreference("enableA11yFeatures", checked)}
                      aria-label="Toggle accessibility features"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                Save Preferences
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
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
  )
}
