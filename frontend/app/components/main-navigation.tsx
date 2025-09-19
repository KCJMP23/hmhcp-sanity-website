"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import { useTheme } from "next-themes"

const navItems = [
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Platforms",
    href: "/platforms",
    submenu: [
      {
        name: "INTELLIC",
        href: "/platforms/intellic",
        description: "AI-powered clinical decision support",
      },
      {
        name: "Precognitive Health",
        href: "/platforms/precognitive-health",
        description: "Predictive analytics for preventive care",
      },
      {
        name: "Wear API",
        href: "/platforms/wear-api",
        description: "Wearable device integration platform",
      },
      {
        name: "Peregrine Medical Press",
        href: "/platforms/peregrine-medical-press",
        description: "Digital publishing for medical research",
      },
    ],
  },
  {
    name: "Research",
    href: "/research",
    submenu: [
      {
        name: "Clinical Studies",
        href: "/research/clinical-studies",
        description: "Ongoing and completed clinical trials",
      },
      {
        name: "Publications",
        href: "/research/publications",
        description: "Peer-reviewed research publications",
      },
      {
        name: "QA/QI",
        href: "/research/qa-qi",
        description: "Quality assurance and improvement",
      },
    ],
  },
  {
    name: "Services",
    href: "/services",
  },
  {
    name: "Education",
    href: "/education",
  },
  {
    name: "Partners",
    href: "/partners",
  },
  {
    name: "Blog",
    href: "/blog",
  },
  {
    name: "Contact",
    href: "/contact",
  },
]

export function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)
  const pathname = usePathname()
  const { theme } = useTheme()
  const navRef = useRef<HTMLDivElement>(null)

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu and mega menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setActiveMegaMenu(null)
  }, [pathname])

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMegaMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleMegaMenu = (name: string) => {
    setActiveMegaMenu(activeMegaMenu === name ? null : name)
  }

  const isDark = theme === "dark"

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
          scrolled
            ? `${isDark ? "bg-gray-900/90" : "bg-white/90"} backdrop-blur-md shadow-sm`
            : `${isDark ? "bg-gray-900" : "bg-transparent"}`
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              onClick={() => {
                setIsOpen(false)
                setActiveMegaMenu(null)
              }}
              className="flex items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${
                  scrolled || pathname !== "/"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-primary-600 dark:text-white"
                } transition-all duration-300`}
              >
                <Logo variant="navigation" className="h-8 sm:h-9 md:h-10 lg:h-12 w-auto" priority />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2 xl:space-x-6">
              {navItems.map((item) => (
                <div key={item.name} className="relative">
                  {item.name === "Contact" ? (
                    // Contact styled as a blue button
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false)
                        setActiveMegaMenu(null)
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-2 lg:px-5 lg:py-2 text-xs lg:text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors duration-200"
                      >
                        {item.name}
                      </motion.div>
                    </Link>
                  ) : item.submenu ? (
                    // Submenu items
                    <motion.button
                      onClick={() => toggleMegaMenu(item.name)}
                      className={`px-2 py-2 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium transition-all duration-200 flex items-center ${
                        activeMegaMenu === item.name
                          ? "text-primary-600 dark:text-primary-400"
                          : scrolled || pathname !== "/"
                            ? "text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                            : "text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                      }`}
                      aria-expanded={activeMegaMenu === item.name}
                    >
                      {item.name}
                      <motion.div
                        animate={{ rotate: activeMegaMenu === item.name ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="ml-1"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </motion.div>
                    </motion.button>
                  ) : (
                    // Regular menu items
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false)
                        setActiveMegaMenu(null)
                      }}
                    >
                      <motion.div
                        whileHover={{
                          color: "#0066cc",
                          transition: { duration: 0.2 },
                        }}
                        className={`px-2 py-2 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium transition-all duration-200 ${
                          pathname === item.href
                            ? "text-primary-600 dark:text-primary-400"
                            : scrolled || pathname !== "/"
                              ? "text-gray-800 dark:text-gray-200"
                              : "text-gray-800 dark:text-white"
                        }`}
                      >
                        {item.name}
                      </motion.div>
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-4">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={` p-1 ${
                  scrolled || pathname !== "/"
                    ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    : "text-gray-800 dark:text-gray-200"
                }`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {activeMegaMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800 ${
                isDark ? "bg-gray-900/95" : "bg-white/95"
              } backdrop-blur-md shadow-lg max-h-[70vh] overflow-y-auto`}
            >
              <div className="container mx-auto px-4 py-6">
                {navItems.map((item) => {
                  if (item.name === activeMegaMenu && item.submenu) {
                    return (
                      <div key={item.name} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="col-span-1"
                        >
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{item.name}</h3>
                          <Link
                            href={item.href}
                            onClick={() => {
                              setIsOpen(false)
                              setActiveMegaMenu(null)
                            }}
                            className="inline-flex items-center text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
                          >
                            View all {item.name.toLowerCase()}
                            <motion.div
                              className="ml-1"
                              initial={{ x: 0 }}
                              whileHover={{ x: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </motion.div>
                          </Link>
                        </motion.div>
                        {item.submenu.map((subitem, index) => (
                          <motion.div
                            key={subitem.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                            className="col-span-1"
                          >
                            <Link
                              href={subitem.href}
                              onClick={() => {
                                setIsOpen(false)
                                setActiveMegaMenu(null)
                              }}
                              className="group block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <h4 className="text-gray-900 dark:text-white font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {subitem.name}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">{subitem.description}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="container mx-auto px-4 py-4 max-h-[70vh] overflow-y-auto">
                <nav className="space-y-4">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="py-1"
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setIsOpen(false)
                          setActiveMegaMenu(null)
                        }}
                      >
                        <motion.div
                          whileHover={{ x: 5 }}
                          className={`flex items-center py-1 text-base font-medium ${
                            item.name === "Contact"
                              ? "text-primary-600 dark:text-primary-400 font-semibold"
                              : pathname === item.href
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {item.name}
                        </motion.div>
                      </Link>
                      {item.submenu && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                          className="mt-1 ml-8 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-3"
                        >
                          {item.submenu.map((subitem, subIndex) => (
                            <motion.div
                              key={subitem.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + subIndex * 0.05 }}
                            >
                              <Link
                                href={subitem.href}
                                onClick={() => {
                                  setIsOpen(false)
                                  setActiveMegaMenu(null)
                                }}
                              >
                                <motion.div
                                  whileHover={{ x: 5 }}
                                  className={`flex items-center py-1 text-sm ${
                                    pathname === subitem.href
                                      ? "text-primary-600 dark:text-primary-400"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {subitem.name}
                                </motion.div>
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}
