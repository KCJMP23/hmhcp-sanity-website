"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { navItems } from "./data"
import { NavigationState } from "./types"

interface MegaMenuProps {
  state: NavigationState
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  handleMouseLeave: () => void
}

export function MegaMenu({ state, timeoutRef, handleMouseLeave }: MegaMenuProps) {
  const { activeMenu, setActiveMenu, setIsOpen, isDark } = state

  return (
    <AnimatePresence>
      {activeMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800 ${
            isDark ? "bg-gray-900/95" : "bg-white/95"
          } backdrop-blur-xl shadow-lg`}
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          {navItems.map((item) => {
            if (item.name === activeMenu) {
              return (
                <div key={item.name} className="container mx-auto py-8 px-4">
                  <div className="flex items-start mb-6">
                    <div className="mr-3">{item.icon}</div>
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 dark:text-white">{item.name}</h2>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                    </div>
                  </div>

                  {item.submenu ? (
                    <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
                      <div className="md:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              <div className="bg-gray-50 dark:bg-gray-800/50 overflow-hidden transition-all duration-300 group-hover:shadow-md">
                                <div className="aspect-video relative overflow-hidden">
                                  <img
                                    src={subitem.image || "/placeholder.svg"}
                                    alt={subitem.name || ""}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </div>
                                <div className="p-4">
                                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {subitem.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {subitem.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {item.featured && (
                        <div className="md:col-span-4">
                          <Link
                            href={item.featured.href}
                            onClick={() => {
                              setIsOpen(false)
                              setActiveMenu(null)
                            }}
                            className="group block"
                          >
                            <div className="bg-gray-50 dark:bg-gray-800/50 overflow-hidden h-full transition-all duration-300 group-hover:shadow-md">
                              <div className="aspect-[4/3] relative overflow-hidden">
                                <img
                                  src={item.featured.image || "/placeholder.svg"}
                                  alt={item.featured.title || ""}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <h3 className="text-white font-medium text-lg">{item.featured.title}</h3>
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {item.featured.description}
                                </p>
                                <div className="mt-3 inline-flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300">
                                  Learn more
                                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Link
                        href={item.href}
                        onClick={() => {
                          setIsOpen(false)
                          setActiveMenu(null)
                        }}
                        className="group flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="mr-4 p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            View All {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Explore our complete {item.name.toLowerCase()} section
                          </p>
                        </div>
                      </Link>

                      {item.featured && (
                        <Link
                          href={item.featured.href}
                          onClick={() => {
                            setIsOpen(false)
                            setActiveMenu(null)
                          }}
                          className="group col-span-2"
                        >
                          <div className="bg-gray-50 dark:bg-gray-800/50 overflow-hidden h-full transition-all duration-300 group-hover:shadow-md">
                            <div className="aspect-[16/9] relative overflow-hidden">
                              <img
                                src={item.featured.image || "/placeholder.svg"}
                                alt={item.featured.title || ""}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-medium text-lg">{item.featured.title}</h3>
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.featured.description}
                              </p>
                              <div className="mt-3 inline-flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300">
                                Learn more
                                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false)
                        setActiveMenu(null)
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
                  </div>
                </div>
              )
            }
            return null
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}