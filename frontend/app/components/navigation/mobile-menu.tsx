"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Menu, X } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { navItems } from "./data"
import { NavigationState } from "./types"

interface MobileMenuProps {
  state: NavigationState
}

export function MobileMenuButton({ state }: MobileMenuProps) {
  const { isOpen, setIsOpen, scrolled, pathname } = state

  return (
    <div className="flex lg:hidden items-center space-x-4">
      <button
        className={`p-2  transition-colors ${
          scrolled || pathname !== "/"
            ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            : "text-gray-800 dark:text-white hover:bg-white/10 dark:hover:bg-gray-800/30"
        }`}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
      <ThemeToggle />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={` p-1 ${
          scrolled || pathname !== "/"
            ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            : "text-gray-800 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/30"
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
  )
}

export function MobileMenu({ state }: MobileMenuProps) {
  const { isOpen, setIsOpen, setActiveMenu, pathname } = state

  return (
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
                    className="flex items-center py-2 group"
                  >
                    <div className="mr-3 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {item.icon}
                    </div>
                    <div>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                    <motion.div className="ml-auto" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                    </motion.div>
                  </Link>

                  {item.submenu && (
                    <div className="mt-2 ml-8 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-3">
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
                            className="flex items-center py-2 group"
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
                            <motion.div className="ml-auto" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                              <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                            </motion.div>
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
  )
}