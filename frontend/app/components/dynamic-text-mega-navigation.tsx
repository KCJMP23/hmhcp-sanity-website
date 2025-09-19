"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useNavigationByLocation } from "@/providers/navigation-provider"
import { NavigationItem } from "@/stores/navigationEditorStore"
import { logger } from '@/lib/logger';

export function DynamicTextMegaNavigation() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { navigation: headerNavigation, isLoading, error } = useNavigationByLocation('header')

  const navItems = headerNavigation || []
  const mobileItems = headerNavigation || []

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setActiveMenu(null)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('menu-open')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('menu-open')
    }

    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('menu-open')
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMouseEnter = (name: string, hasDropdown: boolean) => {
    if (!hasDropdown) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(name)
    }, 100)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 300)
  }

  const handleNavigation = (href: string, hasDropdown?: boolean) => {
    if (!hasDropdown) {
      setIsOpen(false)
      setActiveMenu(null)
      // Small delay to allow menu close animation before navigation
      setTimeout(() => {
        router.push(href)
      }, 100)
    }
  }

  const renderNavItem = (item: NavigationItem) => {
    const hasDropdown = item.children && item.children.length > 0
    const isContact = item.title.toLowerCase() === 'contact'

    if (isContact) {
      return (
        <Link
          href={item.url || '#'}
          onClick={() => {
            setIsOpen(false)
            setActiveMenu(null)
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors duration-200 min-h-[40px] flex items-center"
          >
            {item.title}
          </motion.div>
        </Link>
      )
    }

    if (hasDropdown) {
      return (
        <button
          onClick={() => {
            if (activeMenu === item.title) {
              setActiveMenu(null)
            } else {
              setActiveMenu(item.title)
            }
          }}
          className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center min-h-[44px] ${
            activeMenu === item.title
              ? "text-primary-600 dark:text-primary-400"
              : pathname === item.url
                ? "text-primary-600 dark:text-primary-400"
                : scrolled || pathname !== "/"
                  ? "text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                  : "text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
          }`}
          aria-expanded={activeMenu === item.title}
        >
          {item.title}
          <motion.div
            animate={{ rotate: activeMenu === item.title ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1"
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
        </button>
      )
    }

    return (
      <Link
        href={item.url || '#'}
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
          className={`px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[44px] flex items-center ${
            pathname === item.url
              ? "text-primary-600 dark:text-primary-400"
              : scrolled || pathname !== "/"
                ? "text-gray-800 dark:text-gray-200"
                : "text-gray-800 dark:text-white"
          }`}
        >
          {item.title}
        </motion.div>
      </Link>
    )
  }

  if (error) {
    logger.error('Navigation error:', { error: new Error(error), action: 'error_logged', metadata: { error } })
  }

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
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: isMobile ? 0.3 : 0.5, ease: [0.42, 0, 0.58, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || activeMenu
            ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm"
            : "bg-transparent dark:bg-gray-900/50 backdrop-blur-sm"
        }`}
      >
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link
              href="/"
              onClick={() => {
                setIsOpen(false)
                setActiveMenu(null)
              }}
              className="flex items-center"
            >
              <motion.div
                whileHover={isMobile ? {} : { scale: 1.05 }}
                className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-primary-600 dark:text-white transition-all duration-300"
              >
                HM Healthcare Partners
              </motion.div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                  <span className="text-xs text-gray-600">Loading navigation...</span>
                </div>
              ) : (
                navItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(item.title, !!(item.children && item.children.length > 0))}
                    onMouseLeave={handleMouseLeave}
                  >
                    {renderNavItem(item)}
                  </div>
                ))
              )}
            </nav>

            <div className="hidden lg:flex items-center space-x-2">
              <ThemeToggle />
            </div>

            <div className="flex lg:hidden items-center space-x-4">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                if (item.title === activeMenu && item.children && item.children.length > 0) {
                  return (
                    <div key={item.id} className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto py-6 sm:py-8">
                      <div className="mb-6">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white">{item.title}</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {item.children.map((subitem) => (
                          <Link
                            key={subitem.id}
                            href={subitem.url || '#'}
                            onClick={() => {
                              setIsOpen(false)
                              setActiveMenu(null)
                            }}
                            className="group"
                          >
                            <div className="transition-all duration-300 group-hover:translate-x-1">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {subitem.title}
                              </h3>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <Link
                          href={item.url || '#'}
                          onClick={() => {
                            setIsOpen(false)
                            setActiveMenu(null)
                          }}
                          className="inline-flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
                        >
                          View all {item.title.toLowerCase()}
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

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile menu overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative z-50"
              >
              <div className="w-full px-4 sm:px-6 max-w-screen-2xl mx-auto py-4 max-h-[calc(100vh-80px)] overflow-y-auto">
                <nav className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                      <span className="text-xs text-gray-600 ml-2">Loading navigation...</span>
                    </div>
                  ) : (
                    mobileItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="py-1"
                      >
                        <Link
                          href={item.url || '#'}
                          onClick={() => {
                            setIsOpen(false)
                            setActiveMenu(null)
                          }}
                          className="flex items-center justify-between py-3 px-2 group min-h-[48px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div
                            className={`text-base font-medium ${
                              item.title.toLowerCase() === "contact"
                                ? "text-primary-600 dark:text-primary-400 font-semibold"
                                : pathname === item.url
                                  ? "text-primary-600 dark:text-primary-400"
                                  : "text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                            }`}
                          >
                            {item.title}
                          </div>
                          {item.children && item.children.length > 0 && (
                            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </Link>

                        {item.children && item.children.length > 0 && (
                          <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                            {item.children.map((subitem, subIndex) => (
                              <motion.div
                                key={subitem.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 + subIndex * 0.05 }}
                              >
                                <Link
                                  href={subitem.url || '#'}
                                  onClick={() => {
                                    setIsOpen(false)
                                    setActiveMenu(null)
                                  }}
                                  className="block py-2 px-2 group min-h-[40px] flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <div
                                    className={`text-sm ${
                                      pathname === subitem.url
                                        ? "text-primary-600 dark:text-primary-400"
                                        : "text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                                    }`}
                                  >
                                    {subitem.title}
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </nav>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}