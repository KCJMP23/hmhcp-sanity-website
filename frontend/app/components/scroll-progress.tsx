"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion"

export function ScrollProgress() {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    const toggleVisibility = () => {
      // Show progress bar when page is scrolled down 100px
      if (window.scrollY > 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50"
        >
          <motion.div className="h-full bg-blue-600 origin-left" style={{ scaleX }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
