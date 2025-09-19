"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Layers, FileText, Microscope, GraduationCap, Users, BookOpen, Phone, X, Menu } from "lucide-react"
import { FrostedCard } from "@/components/ui/frosted-card"

// Mobile navigation items with their respective icons
const navItems = [
  { name: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
  { name: "Platforms", href: "/platforms", icon: <Layers className="h-5 w-5" /> },
  { name: "Services", href: "/services", icon: <FileText className="h-5 w-5" /> },
  { name: "Research", href: "/research", icon: <Microscope className="h-5 w-5" /> },
  { name: "Education", href: "/education", icon: <GraduationCap className="h-5 w-5" /> },
  { name: "Partners", href: "/partners", icon: <Users className="h-5 w-5" /> },
  { name: "Blog", href: "/blog", icon: <BookOpen className="h-5 w-5" /> },
  { name: "Contact", href: "/contact", icon: <Phone className="h-5 w-5" /> },
]

export function MobileBottomSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pathname = usePathname()

  // Close sheet when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Haptic feedback function (will only work on supported devices)
  const triggerHapticFeedback = () => {
    if (typeof window !== "undefined" && "navigator" in window) {
      if (navigator.vibrate) {
        navigator.vibrate(10) // 10ms vibration
      }
    }
  }

  const handleNavItemClick = () => {
    triggerHapticFeedback()
  }

  const handleToggleMenu = () => {
    triggerHapticFeedback()
    setIsOpen(!isOpen)
  }

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      setCurrentY(e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      const diff = currentY - startY
      if (diff > 50) {
        // Swipe down - close the sheet
        setIsOpen(false)
      }
      setIsDragging(false)
    }
  }

  return (
    <>
      {/* Only show on mobile devices */}
      <div className="fixed bottom-6 inset-x-0 z-50 sm:hidden px-4">
        <div className="relative">
          {/* Bottom Tab Bar */}
          <FrostedCard className="flex justify-between items-center px-6 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className={`${pathname === "/" ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
                onClick={handleNavItemClick}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Home className="h-6 w-6" />
                </motion.div>
              </Link>
              <Link
                href="/platforms"
                className={`${pathname.startsWith("/platforms") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
                onClick={handleNavItemClick}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Layers className="h-6 w-6" />
                </motion.div>
              </Link>
              <Link
                href="/research"
                className={`${pathname.startsWith("/research") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
                onClick={handleNavItemClick}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Microscope className="h-6 w-6" />
                </motion.div>
              </Link>
            </div>

            {/* Menu Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleMenu}
              className="bg-blue-600 text-white p-3 shadow-md active:scale-95 transition-transform"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>

            <div className="flex items-center space-x-6">
              <Link
                href="/blog"
                className={`${pathname.startsWith("/blog") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
                onClick={handleNavItemClick}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <BookOpen className="h-6 w-6" />
                </motion.div>
              </Link>
              <Link
                href="/education"
                className={`${pathname.startsWith("/education") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
                onClick={handleNavItemClick}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <GraduationCap className="h-6 w-6" />
                </motion.div>
              </Link>
              <Link
                href="/contact"
                className={`${pathname === "/contact" ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
                onClick={handleNavItemClick}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Phone className="h-6 w-6" />
                </motion.div>
              </Link>
            </div>
          </FrostedCard>

          {/* Expanded Sheet */}
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
                  onClick={() => setIsOpen(false)}
                />

                {/* Sheet - iOS style with swipe to dismiss */}
                <motion.div
                  className="absolute bottom-20 inset-x-0 z-50 max-h-[70vh]"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    y: isDragging ? Math.max(0, currentY - startY) : 0,
                  }}
                >
                  {/* Drag indicator */}
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 mx-auto mb-2"></div>

                  <FrostedCard className="p-6 shadow-xl border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-3 gap-4">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleNavItemClick}
                          className={`flex flex-col items-center justify-center p-4  transition-colors ${
                            pathname === item.href || pathname.startsWith(item.href + "/")
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="mb-2">
                            {item.icon}
                          </motion.div>
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </FrostedCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
