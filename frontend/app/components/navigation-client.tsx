"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"
import { ThemeToggleNavigation } from "@/components/theme-toggle-navigation"
import { Logo } from "@/components/ui/logo"
import { NavigationItem } from "@/stores/navigationEditorStore"

interface NavigationClientProps {
  navigation: NavigationItem[]
  logoUrl?: string
  logoText?: string
}

export default function NavigationClient({ navigation, logoUrl, logoText }: NavigationClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  const handleMouseEnter = (itemName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setActiveDropdown(itemName)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 100)
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo variant="navigation-scroll" isScrolled={isScrolled} priority={true} width={150} height={45} className="h-11 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            {navigation.map((item) => (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => item.children && handleMouseEnter(item.title)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.url || '#'}
                  className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.url || '')
                      ? "text-blue-600 dark:text-blue-400"  // Active page is always blue
                      : isScrolled
                      ? "text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"  // Scrolled: dark text
                      : "text-white/90 hover:text-white"  // Not scrolled: white text
                  }`}
                  style={{
                    fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    letterSpacing: '-0.005em'
                  }}
                  target={item.target === '_blank' ? "_blank" : undefined}
                  rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                >
                  <span>{item.title}</span>
                  {item.children && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Apple-style Mega Menu Dropdown */}
                {item.children && (
                  <AnimatePresence>
                    {activeDropdown === item.title && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-full mt-1"
                      >
                        <div className="relative">
                          {/* Large dropdown container with Apple-style design */}
                          <div className="absolute left-1/2 -translate-x-1/2 w-screen max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
                            <div className="p-6">
                              <div className="grid gap-4">
                                {item.children.map((subItem, index) => (
                                  <Link
                                    key={index}
                                    href={subItem.url || '#'}
                                    className="group flex items-start space-x-4 p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    target={subItem.target === '_blank' ? "_blank" : undefined}
                                    rel={subItem.target === '_blank' ? "noopener noreferrer" : undefined}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                                        {subItem.title}
                                      </div>
                                    </div>
                                    <ArrowRight className="mt-0.5 h-5 w-5 text-gray-400 dark:text-gray-600 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            <ThemeToggleNavigation isScrolled={isScrolled} />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden  p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${
                isScrolled
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-white"
              }`}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <div key={item.title}>
                  <Link
                    href={item.url || '#'}
                    className={`block px-4 py-2 text-base font-medium  transition-colors ${
                      isActive(item.url || '')
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    target={item.target === '_blank' ? "_blank" : undefined}
                    rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                  >
                    {item.title}
                  </Link>
                  {item.children && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.children.map((subItem, index) => (
                        <Link
                          key={index}
                          href={subItem.url || '#'}
                          className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          target={subItem.target === '_blank' ? "_blank" : undefined}
                          rel={subItem.target === '_blank' ? "noopener noreferrer" : undefined}
                        >
                          {subItem.title}
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
    </nav>
  )
}