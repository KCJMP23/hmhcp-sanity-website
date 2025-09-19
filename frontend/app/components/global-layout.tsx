"use client"

import { useState, useEffect, type ReactNode } from "react"
import { motion } from "framer-motion"
import EnhancedNavigation from "@/components/enhanced-navigation"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { MobileBottomSheet } from "@/components/mobile-bottom-sheet"
import { ScrollToTopOnNavigation } from "@/components/scroll-to-top-on-navigation"

interface GlobalLayoutProps {
  children: ReactNode
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <ScrollToTopOnNavigation />
      <EnhancedNavigation />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        {children}
      </motion.main>
      <EnhancedFooter />
      <MobileBottomSheet />
    </>
  )
}
