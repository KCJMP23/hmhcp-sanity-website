"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronRight } from "lucide-react"
import { FooterAccessibilityControls } from "@/components/footer-accessibility-controls"
import { Logo } from "@/components/ui/logo"
import { getEnabledSocialLinks, hasSocialMediaLinks } from "@/lib/social-config"

export function EnhancedFooter() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Company Info */}
          <div className="col-span-1">
            <div className="text-sm">
              <div className="mb-4">
                <Logo 
                  variant="adaptive"
                  width={96}
                  height={96}
                  className="h-24 w-auto"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Transforming healthcare through innovation, research, and strategic partnerships. We help healthcare
                organizations navigate the complex digital landscape.
              </p>
{hasSocialMediaLinks() && (
                <div className="flex space-x-4 mt-4">
                  {getEnabledSocialLinks().map((socialLink) => {
                    const iconMap = {
                      Facebook,
                      Twitter,
                      Linkedin,
                      Instagram,
                      Youtube
                    }
                    const IconComponent = iconMap[socialLink.icon as keyof typeof iconMap]
                    
                    return (
                      <motion.a
                        key={socialLink.name}
                        href={socialLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        aria-label={`Follow us on ${socialLink.name}`}
                      >
                        <IconComponent size={18} />
                        <span className="sr-only">{socialLink.name}</span>
                      </motion.a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Company Links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/leadership"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Leadership
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/services/strategic-consulting"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Strategic Consulting
                </Link>
              </li>
              <li>
                <Link
                  href="/services/implementation"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Implementation
                </Link>
              </li>
              <li>
                <Link
                  href="/services/quality-improvement"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Quality Improvement
                </Link>
              </li>
              <li>
                <Link
                  href="/services/education-training"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Education & Training
                </Link>
              </li>
              <li>
                <Link
                  href="/services/research"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Research
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/case-studies"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="/publications"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Publications
                </Link>
              </li>
              <li>
                <Link
                  href="/webinars"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  Webinars
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                >
                  <ChevronRight size={14} className="mr-1" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Info */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <Mail size={16} className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                <a
                  href="mailto:contact@hmhealthcarepartners.com"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  contact@hmhealthcarepartners.com
                </a>
              </li>
              <li className="flex items-start">
                <Phone size={16} className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                <a
                  href="tel:+15551234567"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-start">
                <MapPin size={16} className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  123 Innovation Way,
                  <br />
                  Boston, MA 02110
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Accessibility Controls */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <FooterAccessibilityControls />
        </div>

        {/* Legal Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
              © 2025 HM Healthcare Partners. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/privacy-policy"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Cookie Policy
              </Link>
              <Link
                href="/accessibility"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
