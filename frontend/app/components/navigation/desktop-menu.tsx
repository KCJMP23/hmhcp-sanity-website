"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronDown, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { navItems } from "./data"
import { NavigationState } from "./types"

interface DesktopMenuProps {
  state: NavigationState
  handleMouseEnter: (name: string) => void
  handleMouseLeave: () => void
}

export function DesktopMenu({ state, handleMouseEnter, handleMouseLeave }: DesktopMenuProps) {
  const { activeMenu, setActiveMenu, setIsOpen, scrolled, pathname, isDark } = state

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-1">
        {navItems.map((item) => (
          <div
            key={item.name}
            className="relative"
            onMouseEnter={() => handleMouseEnter(item.name)}
            onMouseLeave={handleMouseLeave}
          >
            {item.name === "Contact" ? (
              // Contact styled as a blue button
              <Link
                href={item.href}
                onClick={() => {
                  setIsOpen(false)
                  setActiveMenu(null)
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors duration-200"
                >
                  {item.name}
                </motion.div>
              </Link>
            ) : (
              // Regular menu items
              <button
                onClick={() => {
                  if (activeMenu === item.name) {
                    setActiveMenu(null)
                  } else {
                    setActiveMenu(item.name)
                  }
                }}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center  ${
                  activeMenu === item.name
                    ? "bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400"
                    : pathname === item.href
                      ? "text-primary-600 dark:text-primary-400"
                      : scrolled || pathname !== "/"
                        ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        : "text-gray-800 dark:text-white hover:bg-white/10 dark:hover:bg-gray-800/30"
                }`}
                aria-expanded={activeMenu === item.name}
              >
                {item.name}
                {item.submenu && (
                  <motion.div
                    animate={{ rotate: activeMenu === item.name ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-1"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </motion.div>
                )}
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center space-x-2">
        <button
          className={`p-2  transition-colors ${
            scrolled || pathname !== "/" || activeMenu
              ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              : "text-gray-800 dark:text-white hover:bg-white/10 dark:hover:bg-gray-800/30"
          }`}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <ThemeToggle />
      </div>
    </>
  )
}