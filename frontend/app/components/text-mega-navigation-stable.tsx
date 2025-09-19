"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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
        href: "/platforms/intellic-edc",
        description: "Research-first electronic data capture",
      },
      {
        name: "MyBC Health",
        href: "/platforms/mybc-health",
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

const darkBackgroundPages = ["/", "/about"]

const useDebounce = (callback: Function, delay: number) => {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  
  const debouncedCallback = useCallback((...args: any[]) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
  
  return debouncedCallback
}

export function TextMegaNavigationStable() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const navRef = useRef<HTMLDivElement>(null)
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const isDarkBackgroundPage = darkBackgroundPages.includes(pathname)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10)
  }, [])

  const debouncedHandleScroll = useDebounce(handleScroll, 10)

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll, { passive: true })
    handleScroll()
    
    return () => window.removeEventListener("scroll", debouncedHandleScroll)
  }, [debouncedHandleScroll, handleScroll])

  useEffect(() => {
    setIsOpen(false)
    setActiveMenu(null)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const clearMegaMenuTimeout = useCallback(() => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current)
      megaMenuTimeoutRef.current = null
    }
  }, [])

  const handleMouseEnter = useCallback((name: string, hasDropdown: boolean) => {
    if (!hasDropdown) return
    
    clearMegaMenuTimeout()
    setActiveMenu(name)
  }, [clearMegaMenuTimeout])

  const handleMouseLeave = useCallback(() => {
    clearMegaMenuTimeout()
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 300)
  }, [clearMegaMenuTimeout])

  const handleMegaMenuMouseEnter = useCallback(() => {
    clearMegaMenuTimeout()
  }, [clearMegaMenuTimeout])

  const getTextColor = useCallback((isActive: boolean) => {
    if (isActive) return "text-blue-600 dark:text-blue-400"
    
    if (isDarkBackgroundPage && !scrolled && !activeMenu) {
      return "text-white hover:text-blue-200 dark:text-white dark:hover:text-blue-200"
    }
    
    return "text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
  }, [scrolled, isDarkBackgroundPage, activeMenu])

  const getHeaderBackground = useCallback(() => {
    if (scrolled || activeMenu) {
      return "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm"
    }
    if (isDarkBackgroundPage) {
      return "bg-transparent"
    }
    return "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm"
  }, [scrolled, activeMenu, isDarkBackgroundPage])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-blue-600"
      >
        Skip to content
      </a>

      <motion.header
        ref={navRef}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${getHeaderBackground()}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative transition-all duration-300"
              >
                <img 
                  src="/hmhcp-logo-black.svg" 
                  alt="HMHCP" 
                  className={`h-8 sm:h-10 md:h-12 w-auto transition-opacity duration-300 ${
                    isDarkBackgroundPage && !scrolled && !activeMenu ? 'opacity-0 invisible' : 'opacity-100 visible'
                  }`} 
                />
                <img 
                  src="/hmhcp-logo-white.svg" 
                  alt="HMHCP" 
                  className={`h-8 sm:h-10 md:h-12 w-auto transition-opacity duration-300 absolute top-0 left-0 ${
                    isDarkBackgroundPage && !scrolled && !activeMenu ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`} 
                />
              </motion.div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.name, !!item.hasDropdown)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.name === "Contact" ? (
                    <Link href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                      >
                        {item.name}
                      </motion.div>
                    </Link>
                  ) : item.hasDropdown ? (
                    <button
                      onClick={() => setActiveMenu(activeMenu === item.name ? null : item.name)}
                      className={`px-4 py-2 text-base font-medium transition-all duration-200 flex items-center ${getTextColor(pathname === item.href || activeMenu === item.name)}`}
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
                    <Link href={item.href}>
                      <motion.div
                        whileHover={{
                          color: "#0066cc",
                          transition: { duration: 0.2 },
                        }}
                        className={`px-4 py-2 text-base font-medium transition-all duration-200 ${getTextColor(pathname === item.href)}`}
                      >
                        {item.name}
                      </motion.div>
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            <div className="hidden lg:flex items-center space-x-2">
              <ThemeToggle isScrolled={scrolled || !!activeMenu} />
            </div>

            <div className="flex lg:hidden items-center space-x-4">
              <ThemeToggle isScrolled={scrolled || !!activeMenu} />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={` p-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkBackgroundPage && !scrolled && !activeMenu
                    ? "text-white"
                    : "text-gray-800 dark:text-gray-200"
                }`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {activeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg"
              onMouseEnter={handleMegaMenuMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {navItems.map((item) => {
                if (item.name === activeMenu && item.submenu) {
                  return (
                    <div key={item.name} className="container mx-auto py-8 px-4">
                      <div className="mb-6">
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white">{item.name}</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            onClick={() => setActiveMenu(null)}
                            className="group"
                          >
                            <div className="p-6 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center">
                                {subitem.name}
                                <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                              </h3>
                              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
                                {subitem.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="container mx-auto p-4 space-y-2">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.hasDropdown ? (
                      <>
                        <button
                          onClick={() => setActiveMenu(activeMenu === item.name ? null : item.name)}
                          className={`w-full flex items-center justify-between p-3  transition-colors ${
                            pathname === item.href
                              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                              : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span className="text-base font-medium">{item.name}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              activeMenu === item.name ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {activeMenu === item.name && item.submenu && (
                          <div className="mt-2 ml-4 space-y-1">
                            {item.submenu.map((subitem) => (
                              <Link
                                key={subitem.name}
                                href={subitem.href}
                                onClick={() => {
                                  setIsOpen(false)
                                  setActiveMenu(null)
                                }}
                                className="block p-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="font-medium">{subitem.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {subitem.description}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => {
                          setIsOpen(false)
                          setActiveMenu(null)
                        }}
                      >
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          className={`p-3  transition-colors ${
                            pathname === item.href
                              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                              : item.name === "Contact"
                                ? "bg-primary-600 text-white hover:bg-primary-700"
                                : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span className="text-base font-medium">{item.name}</span>
                        </motion.div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}