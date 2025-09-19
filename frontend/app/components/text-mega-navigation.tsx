"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

// Updated navItems - removed submenu for Services, Education, and Blog
const navItems = [
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Platform",
    href: "/platform",
    hasDropdown: true,
    submenu: [
      {
        name: "Integrated Platform",
        href: "/platform",
        description: "MyBC Health + INTELLIC EDC ecosystem",
      },
      {
        name: "INTELLIC EDC",
        href: "/platform/intellic-edc",
        description: "Research-first electronic data capture",
      },
      {
        name: "MyBC Health",
        href: "/platform/mybc-health",
        description: "Personalized care companion app",
      },
      {
        name: "Legacy Platforms",
        href: "/platforms",
        description: "View all platform solutions",
      },
    ],
  },
  {
    name: "Research",
    href: "/research",
    hasDropdown: true,
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
    name: "Blog",
    href: "/blog",
  },
  {
    name: "Contact",
    href: "/contact",
  },
]

export function TextMegaNavigation() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu and mega menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setActiveMenu(null)
  }, [pathname])

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle mouse enter with delay for desktop menu - only for items with dropdown
  const handleMouseEnter = (name: string, hasDropdown: boolean) => {
    if (!hasDropdown) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(name)
    }, 100)
  }

  // Handle mouse leave with delay for desktop menu
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 300)
  }

  // Handle navigation for items without dropdowns
  const handleNavigation = (href: string, hasDropdown?: boolean) => {
    if (!hasDropdown) {
      router.push(href)
      setIsOpen(false)
      setActiveMenu(null)
    }
  }

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
            ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm"
            : "bg-transparent dark:bg-gray-900/50 backdrop-blur-sm"
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
                className="transition-all duration-300"
              >
                <Logo variant="navigation-scroll" isScrolled={scrolled || !!activeMenu} className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto" priority />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.name, !!item.hasDropdown)}
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
                  ) : item.hasDropdown ? (
                    // Menu items with dropdown (only Platforms and Research)
                    <button
                      onClick={() => {
                        if (activeMenu === item.name) {
                          setActiveMenu(null)
                        } else {
                          setActiveMenu(item.name)
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center ${
                        activeMenu === item.name
                          ? "text-primary-600 dark:text-primary-400"
                          : pathname === item.href
                            ? "text-primary-600 dark:text-primary-400"
                            : scrolled || pathname !== "/"
                              ? "text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                              : "text-white hover:text-primary-200"
                      }`}
                      aria-expanded={activeMenu === item.name}
                    >
                      {item.name}
                      <motion.div
                        animate={{ rotate: activeMenu === item.name ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-1"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </motion.div>
                    </button>
                  ) : (
                    // Regular menu items without dropdown (About, Services, Education, Blog)
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false)
                        setActiveMenu(null)
                      }}
                    >
                      <motion.div
                        whileHover={{
                          color: "#0066cc",
                          transition: { duration: 0.2 },
                        }}
                        className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          pathname === item.href
                            ? "text-primary-600 dark:text-primary-400"
                            : scrolled || pathname !== "/"
                              ? "text-gray-800 dark:text-gray-200"
                              : "text-white"
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
                className="p-1 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        {/* Apple-style Mega Menu - Only for Platforms and Research */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg"
              onMouseEnter={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
              }}
              onMouseLeave={handleMouseLeave}
            >
              {navItems.map((item) => {
                if (item.name === activeMenu && item.submenu) {
                  return (
                    <div key={item.name} className="container mx-auto py-8 px-4">
                      <div className="mb-6">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white">{item.name}</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            onClick={() => {
                              setIsOpen(false)
                              setActiveMenu(null)
                            }}
                            className="group"
                          >
                            <div className="transition-all duration-300 group-hover:translate-x-1">
                              {/* Adjusted text size to match main menu */}
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {subitem.name}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{subitem.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <Link
                          href={item.href}
                          onClick={() => {
                            setIsOpen(false)
                            setActiveMenu(null)
                          }}
                          className="inline-flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
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
                      </div>
                    </div>
                  )
                }
                return null
              })}
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
                          setActiveMenu(null)
                        }}
                        className="flex items-center justify-between py-2 group"
                      >
                        <div
                          className={`text-base font-medium ${
                            item.name === "Contact"
                              ? "text-primary-600 dark:text-primary-400 font-semibold"
                              : pathname === item.href
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                          }`}
                        >
                          {item.name}
                        </div>
                        {item.hasDropdown && <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                      </Link>

                      {item.hasDropdown && item.submenu && (
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
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
                                  setActiveMenu(null)
                                }}
                                className="block py-2 group"
                              >
                                <div
                                  className={`text-sm ${
                                    pathname === subitem.href
                                      ? "text-primary-600 dark:text-primary-400"
                                      : "text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                                  }`}
                                >
                                  {subitem.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {subitem.description}
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
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
