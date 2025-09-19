"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
// import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
// import { useNavigationMenu, getContentData } from "@/lib/hooks/use-cms-content"

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

interface TextMegaNavigationProps {
  navItems?: NavItem[]
}

// Default navItems for backward compatibility
const defaultNavItems: NavItem[] = [
  {
    name: "About",
    href: "/about",
    hasDropdown: true,
    submenu: [
      {
        name: "About Us",
        href: "/about",
        description: "Our mission and vision",
      },
      {
        name: "Leadership",
        href: "/leadership",
        description: "Meet our executive team",
      },
      {
        name: "Partners",
        href: "/partners",
        description: "Strategic partnerships",
      },
      {
        name: "Careers",
        href: "/careers",
        description: "Join our team",
      },
    ],
  },
  {
    name: "Healthcare",
    href: "/healthcare",
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
      {
        name: "Case Studies",
        href: "/case-studies",
        description: "Success stories and implementations",
      },
    ],
  },
  {
    name: "Services",
    href: "/services",
    hasDropdown: true,
    submenu: [
      {
        name: "Clinical Research",
        href: "/services/clinical-research",
        description: "End-to-end clinical trial support",
      },
      {
        name: "Strategic Consulting",
        href: "/services/strategic-consulting",
        description: "Healthcare strategy and transformation",
      },
      {
        name: "Healthcare Technology",
        href: "/services/healthcare-technology-consulting",
        description: "Technology implementation and integration",
      },
      {
        name: "Quality Improvement",
        href: "/services/quality-improvement",
        description: "QA/QI program development",
      },
      {
        name: "Education & Training",
        href: "/services/education-training",
        description: "Professional development programs",
      },
      {
        name: "Implementation",
        href: "/services/implementation",
        description: "Platform deployment and support",
      },
    ],
  },
  {
    name: "Resources",
    href: "/resources",
    hasDropdown: true,
    submenu: [
      {
        name: "Blog",
        href: "/blog",
        description: "Latest insights and updates",
      },
      {
        name: "Webinars",
        href: "/webinars",
        description: "Educational webinars",
      },
      {
        name: "Events",
        href: "/events",
        description: "Conferences and workshops",
      },
      {
        name: "Newsletter",
        href: "/newsletter",
        description: "Subscribe for updates",
      },
    ],
  },
  {
    name: "Contact",
    href: "/contact",
  },
]

// Throttle function for better scroll performance
const useThrottledCallback = (callback: () => void, delay: number) => {
  const lastRun = useRef(Date.now())
  
  return useCallback(() => {
    if (Date.now() - lastRun.current >= delay) {
      callback()
      lastRun.current = Date.now()
    }
  }, [callback, delay])
}

// Smooth scroll utility function for better cross-browser compatibility
const smoothScrollTo = (target: string | number) => {
  if (typeof target === 'string') {
    // Handle anchor links
    const element = document.querySelector(target)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    }
  } else {
    // Handle scroll to position
    window.scrollTo({
      top: target,
      behavior: 'smooth'
    })
  }
}

export function TextMegaNavigationFixed({ navItems = defaultNavItems }: TextMegaNavigationProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasDarkBodyClass, setHasDarkBodyClass] = useState(false)
  const pathname = usePathname()
  const _router = useRouter()
  const { theme } = useTheme()
  const navRef = useRef<HTMLDivElement>(null)
  
  // Handle hydration mismatch by using default theme during SSR
  const currentTheme = theme || 'light'
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use static navigation data for now
  const navigationItems: NavItem[] = navItems

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
  
  // Also check if it's a blog post page (starts with /blog/) or if body has dark background class
  const isBlogPost = pathname.startsWith('/blog/') && pathname !== '/blog/'
  
  const isDarkBackgroundPage = darkBackgroundPages.includes(pathname) || isBlogPost || hasDarkBodyClass
  const isLightBackgroundPage = lightBackgroundPages.includes(pathname) || pathname.startsWith("/admin/")
  
  // Comprehensive logic for navigation text color that works in both light and dark modes
  const shouldUseDarkText = (() => {
    // When scrolled or menu is active, header has white/gray background, so use dark text
    if (scrolled || activeMenu) {
      return currentTheme !== 'dark' // Dark text in light mode, white text in dark mode
    }
    
    // When not scrolled on dark background pages, use white text
    if (isDarkBackgroundPage) {
      return false // White text over dark hero background
    }
    
    // On light background pages when not scrolled, use dark text
    if (isLightBackgroundPage) {
      return currentTheme !== 'dark' // Dark text in light mode, white text in dark mode
    }
    
    // Default: pages not explicitly listed, assume dark background for safety
    return false // White text by default
  })()

  // Track when component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Watch for body class changes (for 404 pages and other dynamic backgrounds)
  useEffect(() => {
    if (!mounted) return

    const updateDarkBodyClass = () => {
      setHasDarkBodyClass(document.body.classList.contains('has-dark-background'))
    }

    // Check initially
    updateDarkBodyClass()

    // Set up a MutationObserver to watch for class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateDarkBodyClass()
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [mounted])

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    const scrollThreshold = 80 // Fixed threshold for consistency
    setScrolled(window.scrollY > scrollThreshold)
  }, [])

  const throttledScrollHandler = useThrottledCallback(handleScroll, 16) // ~60fps

  // Handle scroll events to change header appearance
  useEffect(() => {
    if (!mounted) return

    // Check initial scroll position immediately and after a brief delay to catch any layout shifts
    handleScroll()
    const initialScrollCheck = setTimeout(handleScroll, 100)
    
    window.addEventListener("scroll", throttledScrollHandler, { passive: true })

    return () => {
      window.removeEventListener("scroll", throttledScrollHandler)
      clearTimeout(initialScrollCheck)
    }
  }, [mounted, handleScroll, throttledScrollHandler])

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
  const _handleNavigation = (e: React.MouseEvent, href: string, hasDropdown?: boolean) => {
    if (!hasDropdown) {
      // Check if it's an anchor link on the current page
      if (href.includes('#') && href.startsWith(pathname)) {
        e.preventDefault()
        const anchor = href.split('#')[1]
        smoothScrollTo(`#${anchor}`)
      }
      // Let normal navigation happen for regular links
      setIsOpen(false)
      setActiveMenu(null)
    }
  }

  // Enhanced click handler for all links
  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    // Check if it's an anchor link on the current page
    if (href.includes('#')) {
      const [path, anchor] = href.split('#')
      if (!path || path === pathname) {
        e.preventDefault()
        smoothScrollTo(`#${anchor}`)
        setIsOpen(false)
        setActiveMenu(null)
        return
      }
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

  // Don't render navigation on admin pages or dashboard
  if (pathname.startsWith('/admin') || pathname.startsWith('/studio') || pathname?.startsWith('/dashboard')) {
    return null
  }

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        onClick={(e) => handleLinkClick(e, "#main-content")}
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-blue-600"
      >
        Skip to content
      </a>

      <header
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 border-b ${headerBackgroundStyle} ${headerBorderStyle}`}
        style={{ 
          pointerEvents: 'auto',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
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
              <div className="transition-all duration-300">
                <Logo 
                  variant="navigation-scroll" 
                  isScrolled={scrolled || !!activeMenu} 
                  isDarkBackground={isDarkBackgroundPage && !scrolled && !activeMenu}
                  className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto" 
                  priority 
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 flex-grow justify-center mx-4" style={{ position: 'relative', zIndex: 10 }}>
              {navigationItems.map((item) => (
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
                        // Close menu on navigation
                        setIsOpen(false)
                        setActiveMenu(null)
                      }}
                    >
                      <div className="px-6 py-2 text-base font-medium rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200">
                        {item.name}
                      </div>
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
                      <div className="ml-1">
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </button>
                  ) : (
                    // Regular menu items without dropdown (About, Services, Education, Blog)
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        // Don't prevent default for regular navigation
                        if (item.href.includes('#')) {
                          handleLinkClick(e, item.href)
                        }
                        setIsOpen(false)
                        setActiveMenu(null)
                      }}
                      className={`inline-block px-4 py-2 text-base font-medium transition-all duration-200 ${
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
              <ThemeToggle isScrolled={scrolled} />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-4">
              <ThemeToggle isScrolled={scrolled} />
              <button
                className={`rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  shouldUseDarkText
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-white drop-shadow-sm"
                }`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                {isOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Apple-style Mega Menu - Only for Platforms and Research */}
        {activeMenu && (
          <div
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg"
              onMouseEnter={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
              }}
              onMouseLeave={handleMouseLeave}
            >
              {navigationItems.map((item) => {
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
                            onClick={(e) => {
                              // Only handle anchor links specially
                              if (subitem.href.includes('#')) {
                                handleLinkClick(e, subitem.href)
                              }
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
          </div>
        )}

        {/* Mobile Menu */}
        {isOpen && (
          <div
              className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="container mx-auto p-4 space-y-2">
                {navigationItems.map((item) => (
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
                                onClick={(e) => {
                                  handleLinkClick(e, subitem.href)
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
                        onClick={(e) => {
                          // Only handle anchor links specially
                          if (item.href.includes('#')) {
                            handleLinkClick(e, item.href)
                          }
                          setIsOpen(false)
                          setActiveMenu(null)
                        }}
                      >
                        <div
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
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
          </div>
        )}
      </header>
    </>
  )
}