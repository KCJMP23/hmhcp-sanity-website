"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import { NavigationState } from "./types"

interface HeaderProps {
  state: NavigationState
  navRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

export function NavigationHeader({ state, navRef, children }: HeaderProps) {
  const { scrolled, activeMenu, isDark, pathname, setIsOpen, setActiveMenu } = state

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-blue-600"
      >
        Skip to content
      </a>

      <motion.header
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || activeMenu
            ? `${isDark ? "bg-gray-900/90" : "bg-white/90"} backdrop-blur-md shadow-sm`
            : `${isDark ? "bg-gray-900/50" : "bg-transparent"} backdrop-blur-sm`
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              onClick={() => {
                setIsOpen(false)
                setActiveMenu(null)
              }}
              className="flex items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${
                  scrolled || pathname !== "/" || activeMenu
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-primary-600 dark:text-white"
                } transition-all duration-300`}
              >
                <Logo variant="navigation" className="h-8 sm:h-9 md:h-10 lg:h-12 w-auto" priority />
              </motion.div>
            </Link>

            {children}
          </div>
        </div>
      </motion.header>
    </>
  )
}