"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/apple-typography"
import { Logo } from "@/components/ui/logo"
import { AppleButton } from "@/components/ui/apple-button"

export default function EnhancedNavigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const navRef = useRef<HTMLDivElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown)
  }

  // Haptic feedback function (will only work on supported devices)
  const triggerHapticFeedback = () => {
    if (typeof window !== "undefined" && "navigator" in window) {
      if (navigator.vibrate) {
        navigator.vibrate(10) // 10ms vibration
      }
    }
  }

  const navLinks = [
    { name: "Home", href: "/" },
    {
      name: "About",
      href: "/about",
      dropdown: [
        { name: "Our Team", href: "/about#leadership", description: "Meet our leadership team" },
        { name: "Our Mission", href: "/about#mission", description: "Learn about our mission and values" },
        { name: "Our History", href: "/about#history", description: "Discover our journey and milestones" },
      ],
    },
    {
      name: "Services",
      href: "/services",
      dropdown: [
        {
          name: "Strategic Consulting",
          href: "/services#consulting",
          description: "Expert guidance for healthcare organizations",
        },
        {
          name: "Implementation",
          href: "/services#implementation",
          description: "Seamless technology integration services",
        },
        {
          name: "Quality Improvement",
          href: "/services#quality",
          description: "Enhance healthcare delivery and outcomes",
        },
      ],
    },
    {
      name: "Platforms",
      href: "/platforms",
      dropdown: [
        { name: "IntelliC", href: "/platforms/intellic", description: "AI-powered clinical decision support" },
        {
          name: "Precognitive Health",
          href: "/platforms/precognitive-health",
          description: "Predictive analytics for preventive care",
        },
        { name: "Wear API", href: "/platforms/wear-api", description: "Wearable device integration platform" },
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
      dropdown: [
        {
          name: "Clinical Studies",
          href: "/research/clinical-studies",
          description: "Ongoing and completed clinical trials",
        },
        { name: "Publications", href: "/research/publications", description: "Peer-reviewed research publications" },
        { name: "QA/QI", href: "/research/qa-qi", description: "Quality assurance and improvement initiatives" },
      ],
    },
    { name: "Education", href: "/education" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <header
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500",
        isScrolled ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm" : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="navigation" className={cn("h-10 w-auto", isScrolled ? "" : "")} priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => (
              <div key={item.name} className="relative">
                {item.name === "Contact" ? (
                  // Contact styled as a button
                  <Link href={item.href}>
                    <AppleButton variant="primary" size="sm" onClick={triggerHapticFeedback}>
                      {item.name}
                    </AppleButton>
                  </Link>
                ) : (
                  // Regular nav items with dropdowns
                  <div>
                    <button
                      onClick={() => {
                        toggleDropdown(item.name)
                        triggerHapticFeedback()
                      }}
                      className={cn(
                        "flex items-center px-3 py-2 font-text text-sm tracking-body  transition-colors",
                        activeDropdown === item.name
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : isScrolled
                            ? "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                            : "text-white hover:text-blue-100",
                      )}
                      aria-expanded={activeDropdown === item.name}
                    >
                      {item.name}
                      {item.dropdown && (
                        <motion.span
                          animate={{ rotate: activeDropdown === item.name ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-1"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      )}
                    </button>

                    {/* Apple-style Mega Menu Dropdown */}
                    {item.dropdown && (
                      <AnimatePresence>
                        {activeDropdown === item.name && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 mt-2 w-64 overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-gray-200/50 dark:border-gray-700/50 z-50"
                          >
                            <div className="py-2">
                              {item.dropdown.map((dropdownItem) => (
                                <Link key={dropdownItem.name} href={dropdownItem.href} onClick={triggerHapticFeedback}>
                                  <motion.div
                                    whileHover={{ x: 5, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                                    className="px-4 py-3 block"
                                  >
                                    <Typography variant="label" className="text-gray-900 dark:text-white">
                                      {dropdownItem.name}
                                    </Typography>
                                    <Typography variant="small" className="mt-1">
                                      {dropdownItem.description}
                                    </Typography>
                                  </motion.div>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark")
                triggerHapticFeedback()
              }}
              className={cn(
                "p-2  transition-colors",
                isScrolled
                  ? "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  : "text-white hover:text-blue-100",
              )}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark")
                triggerHapticFeedback()
              }}
              className={cn(
                "p-2  transition-colors mr-2",
                isScrolled
                  ? "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  : "text-white hover:text-blue-100",
              )}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen)
                triggerHapticFeedback()
              }}
              className={cn(
                "p-2  transition-colors",
                isScrolled
                  ? "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  : "text-white hover:text-blue-100",
              )}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
              {navLinks.map((item) => (
                <div key={item.name} className="py-2">
                  <Link
                    href={item.href}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      triggerHapticFeedback()
                    }}
                  >
                    <Typography
                      variant="body"
                      className={cn(
                        "block py-2",
                        pathname === item.href ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white",
                      )}
                    >
                      {item.name}
                    </Typography>
                  </Link>

                  {item.dropdown && (
                    <div className="mt-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            triggerHapticFeedback()
                          }}
                        >
                          <Typography variant="small" className="block py-2 text-gray-700 dark:text-gray-300">
                            {dropdownItem.name}
                          </Typography>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
