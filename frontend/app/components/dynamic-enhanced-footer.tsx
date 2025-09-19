"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ChevronRight, Loader2 } from "lucide-react"
import { FooterAccessibilityControls } from "@/components/footer-accessibility-controls"
import { useNavigationByLocation } from "@/providers/navigation-provider"
import { NavigationItem } from "@/stores/navigationEditorStore"

export function DynamicEnhancedFooter() {
  const { navigation: footerNavigation, isLoading } = useNavigationByLocation('footer')

  const renderNavigationColumn = (item: NavigationItem) => {
    if (!item.children || item.children.length === 0) return null

    return (
      <div key={item.id} className="col-span-1">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">{item.title}</h3>
        <ul className="space-y-2 text-xs">
          {item.children.map((child) => (
            <li key={child.id}>
              <Link
                href={child.url || '#'}
                target={child.target}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
              >
                <ChevronRight size={14} className="mr-1" />
                {child.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="w-full px-4 sm:px-12 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto py-8 sm:py-12 pb-safe">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="col-span-1">
            <div className="text-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">HM Healthcare Partners</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Transforming healthcare through innovation, research, and strategic partnerships. We help healthcare
                organizations navigate the complex digital landscape.
              </p>
              <div className="flex space-x-4 mt-4">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Facebook size={18} />
                  <span className="sr-only">Facebook</span>
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Twitter size={18} />
                  <span className="sr-only">Twitter</span>
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Linkedin size={18} />
                  <span className="sr-only">LinkedIn</span>
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Instagram size={18} />
                  <span className="sr-only">Instagram</span>
                </motion.a>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="col-span-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              <span className="text-xs text-gray-600 ml-2">Loading navigation...</span>
            </div>
          ) : (
            footerNavigation.map((item) => renderNavigationColumn(item))
          )}

          <div className="col-span-1">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">Contact Info</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start">
                <Mail size={14} className="mr-2 mt-0.5 text-gray-500 dark:text-gray-400" />
                <a
                  href="mailto:info@hmhealthcarepartners.com"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  info@hmhealthcarepartners.com
                </a>
              </li>
              <li className="flex items-start">
                <Phone size={14} className="mr-2 mt-0.5 text-gray-500 dark:text-gray-400" />
                <a
                  href="tel:+1234567890"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  (123) 456-7890
                </a>
              </li>
              <li className="flex items-start">
                <MapPin size={14} className="mr-2 mt-0.5 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  123 Healthcare Blvd<br />
                  Suite 100<br />
                  San Francisco, CA 94105
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
              <p>&copy; {new Date().getFullYear()} HM Healthcare Partners. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end space-x-3 sm:space-x-6 text-xs">
              <Link
                href="/privacy"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-2 sm:mb-0"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-2 sm:mb-0"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-2 sm:mb-0"
              >
                Cookie Policy
              </Link>
              <Link
                href="/sitemap"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-2 sm:mb-0"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>

        <FooterAccessibilityControls />
      </div>
    </footer>
  )
}