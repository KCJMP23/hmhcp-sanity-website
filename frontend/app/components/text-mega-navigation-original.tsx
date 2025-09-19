"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"

interface NavItem {
  name: string
  href: string
  hasDropdown?: boolean
  submenu?: {
    name: string
    href: string
    description?: string
  }[]
}

interface TextMegaNavigationOriginalProps {
  navItems?: NavItem[]
}

// Default navItems for backward compatibility
const defaultNavItems: NavItem[] = [
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Platform",
    href: "/platforms",
    hasDropdown: true,
    submenu: [
      {
        name: "Integrated Platform",
        href: "/platforms",
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
    name: "Blog",
    href: "/blog",
  },
  {
    name: "Contact",
    href: "/contact",
  },
]

export function TextMegaNavigationOriginal({ navItems = defaultNavItems }: TextMegaNavigationOriginalProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Don't render navigation on admin/dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  // Define pages with dark backgrounds that need white text when not scrolled
  const darkBackgroundPages = [
    "/", 
    "/about",
    "/platforms",
    "/platforms/intellic-edc", 
    "/platforms/mybc-health",
    "/research",
    "/research/clinical-studies",
    "/research/publications", 
    "/research/qa-qi",
    "/services",
    "/services/strategic-consulting",
    "/services/implementation",
    "/services/research",
    "/services/education-training",
    "/services/quality-improvement",
    "/services/clinical-research",
    "/services/healthcare-technology-consulting",
    "/services/workforce-development",
    "/blog",
    "/contact",
    "/case-studies",
    "/careers",
    "/leadership",
    "/partners",
    "/publications",
    "/webinars",
    "/faq",
    "/accessibility",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
    "/offline"
  ]
  
  // Pages with light backgrounds that need dark text when not scrolled
  const lightBackgroundPages = [
    "/admin",
    "/admin/login"
  ]
  
  // Also check if it's a blog post page (starts with /blog/)
  const isBlogPost = pathname.startsWith('/blog/') && pathname !== '/blog/'
  
  const isDarkBackgroundPage = darkBackgroundPages.includes(pathname) || isBlogPost
  const isLightBackgroundPage = lightBackgroundPages.includes(pathname) || pathname.startsWith("/admin/")
  
  // Comprehensive logic for navigation text color that works in both light and dark modes
  const shouldUseDarkText = (() => {
    // When scrolled or menu is active, header has white/gray background, so use dark text
    if (scrolled || activeMenu) {
      return theme !== 'dark' // Dark text in light mode, white text in dark mode
    }
    
    // When not scrolled on dark background pages, use white text
    if (isDarkBackgroundPage) {
      return false // White text over dark hero background
    }
    
    // On light background pages when not scrolled, use dark text
    if (isLightBackgroundPage) {
      return theme !== 'dark' // Dark text in light mode, white text in dark mode
    }
    
    // Default: pages not explicitly listed, assume dark background for safety
    return false // White text by default
  })()

  // Track when component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll events to change header appearance
  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8)
    }

    // Check initial scroll position immediately
    handleScroll()
    
    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [mounted])

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

  // Determine header background style based on scroll and page type
  const headerBackgroundStyle = (() => {
    // When scrolled or menu is active, always show frosted white/gray background
    if (scrolled || activeMenu) {
      return "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm"
    }
    
    // When not scrolled on dark background pages, make header transparent
    if (isDarkBackgroundPage) {
      return "bg-transparent"
    }
    
    // On light background pages, show semi-transparent white background
    return "bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm"
  })()

  // Separate border style to handle transition properly
  const headerBorderStyle = (() => {
    if (scrolled || activeMenu) {
      return "border-gray-100/20 dark:border-gray-800/20"
    }
    return "border-transparent"
  })()

  // Don't render navigation on admin pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/studio')) {
    return null
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

      <header
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; ${headerBackgroundStyle} ${headerBorderStyle}`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              onClick={() => {
                setIsOpen(false)
                setActiveMenu(null)
              }}
              className="flex items-center flex-shrink-0"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="transition-all duration-300"
              >
                <Logo 
                  variant="navigation-scroll" 
                  isScrolled={scrolled || !!activeMenu} 
                  isDarkBackground={isDarkBackgroundPage && !scrolled && !activeMenu}
                  className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto" 
                  priority 
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 flex-grow justify-center mx-4">
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
                        className="px-6 py-2 text-base font-medium rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors duration-200"
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
                      className={`px-4 py-2 text-base font-medium transition-all duration-200 flex items-center ${
                        activeMenu === item.name
                          ? "text-primary-600 dark:text-primary-400"
                          : pathname === item.href
                            ? scrolled || activeMenu
                              ? "text-primary-600 dark:text-primary-400"
                              : isDarkBackgroundPage
                                ? "text-white"
                                : "text-primary-600 dark:text-primary-400"
                            : shouldUseDarkText
                              ? "text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                              : "text-white hover:text-primary-200 drop-shadow-sm"
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
                  ) : item.name === "Contact" ? (
                    // Special styling for Contact button - blue background and rounded
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false)
                        setActiveMenu(null)
                      }}
                      className={`px-6 py-2 text-base font-medium transition-all duration-200 block rounded-full bg-blue-600 text-white hover:bg-blue-700 ${
                        pathname === item.href
                          ? "bg-blue-700"
                          : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    // Regular menu items without dropdown (About, Services, Education, Blog)
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false)
                        setActiveMenu(null)
                      }}
                      className={`px-4 py-2 text-base font-medium transition-all duration-200 block ${
                        pathname === item.href
                          ? scrolled || activeMenu
                            ? "text-primary-600 dark:text-primary-400"
                            : isDarkBackgroundPage
                              ? "text-white"
                              : "text-primary-600 dark:text-primary-400"
                          : shouldUseDarkText
                            ? "text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                            : "text-white hover:text-primary-200 drop-shadow-sm"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
              <ThemeToggle isScrolled={scrolled || !!activeMenu} />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-4">
              <ThemeToggle isScrolled={scrolled || !!activeMenu} />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  shouldUseDarkText
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-white drop-shadow-sm"
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
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white">{item.name}</h2>
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
                            <div className="p-6 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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

        {/* Mobile Menu */}
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
                          onClick={() =>
                            setActiveMenu(activeMenu === item.name ? null : item.name)
                          }
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
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
                                className="block p-3 rounded-lg text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                          className={`p-3 transition-colors ${
                            item.name === "Contact"
                              ? pathname === item.href
                                ? "rounded-full bg-blue-700 text-white"
                                : "rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              : pathname === item.href
                                ? "rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                : "rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
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
      </header>
    </>
  )
}