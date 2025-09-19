"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ChevronRight, Youtube, Github } from "lucide-react"
import { FooterAccessibilityControls } from "@/components/footer-accessibility-controls"
// import { useFooterContent, getContentData } from "@/lib/hooks/use-cms-content"
import type { FooterContent as FooterContentType } from "@/lib/types/cms-types"

interface FooterClientProps {
  footerNavigation?: {
    columns?: Array<{
      title: string
      links: Array<{
        title: string
        link: string
        external?: boolean
      }>
    }>
  }
  socialLinks?: Array<{
    platform: string
    url: string
    icon?: string
  }>
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
  }
  copyrightText?: string
  privacyPolicyUrl?: string
  termsOfServiceUrl?: string
}

const socialIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
}

export default function FooterClient({
  footerNavigation,
  socialLinks,
  contactInfo,
  copyrightText,
  privacyPolicyUrl,
  termsOfServiceUrl,
}: FooterClientProps) {
  // Create fallback footer content
  const fallbackFooterContent: FooterContentType = {
    id: 'footer-fallback',
    company_description: "HM Healthcare Partners is a leading healthcare technology consultancy and contract research organization dedicated to transforming patient outcomes through innovative solutions.",
    contact_info: {
      email: contactInfo?.email || "info@hmhcp.com",
      phone: contactInfo?.phone || "+1 (555) 123-4567",
      address: contactInfo?.address || "123 Healthcare Ave, Medical District, CA 90210"
    },
    social_links: socialLinks || [
      { id: '1', platform: 'linkedin', url: '#', icon: 'linkedin', sort_order: 1 },
      { id: '2', platform: 'twitter', url: '#', icon: 'twitter', sort_order: 2 }
    ],
    footer_columns: footerNavigation?.columns?.map((col, index) => ({
      id: `col-${index}`,
      title: col.title,
      sort_order: index,
      links: col.links.map((link, linkIndex) => ({
        id: `link-${index}-${linkIndex}`,
        label: link.title,
        href: link.link,
        target: link.external ? '_blank' : '_self',
        sort_order: linkIndex
      }))
    })) || [],
    copyright_text: copyrightText || "© 2024 HM Healthcare Partners. All rights reserved.",
    privacy_links: [
      { id: '1', label: 'Privacy Policy', href: privacyPolicyUrl || '/privacy', sort_order: 1 },
      { id: '2', label: 'Terms of Service', href: termsOfServiceUrl || '/terms', sort_order: 2 }
    ]
  }
  
  // Use fallback footer content for now
  const footerContentData = fallbackFooterContent
  const defaultFooter: { columns: Array<{ title: string; links: Array<{ title: string; link: string; external?: boolean }> }> } = {
    columns: [
      {
        title: "Company",
        links: [
          { title: "About Us", link: "/about" },
          { title: "Partners", link: "/partners" },
          { title: "Careers", link: "/careers" },
          { title: "Contact", link: "/contact" },
        ],
      },
      {
        title: "Services",
        links: [
          { title: "Strategic Consulting", link: "/services/strategic-consulting" },
          { title: "Implementation", link: "/services/implementation" },
          { title: "Quality Improvement", link: "/research/qa-qi" },
          { title: "Research", link: "/research" },
        ],
      },
      {
        title: "Resources",
        links: [
          { title: "Blog", link: "/blog" },
          { title: "Clinical Studies", link: "/research/clinical-studies" },
          { title: "Publications", link: "/research/publications" },
          { title: "Platforms", link: "/platforms" },
        ],
      },
    ],
  }

  // Transform CMS footer data to legacy format for backward compatibility
  const footerData = footerContentData ? {
    columns: footerContentData.footer_columns?.map(col => ({
      title: col.title,
      links: col.links.map(link => ({
        title: link.label,
        link: link.href,
        external: link.target === '_blank'
      }))
    })) || []
  } : (footerNavigation || defaultFooter)
  
  const columns = footerData.columns || []

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Company Info */}
          <div className="col-span-1">
            <div className="text-sm">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">HM Healthcare Partners</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {footerContentData?.company_description || "Transforming healthcare through innovation, research, and strategic partnerships. We help healthcare organizations navigate the complex digital landscape."}
              </p>
              {(footerContentData?.social_links || socialLinks) && (footerContentData?.social_links?.length > 0 || socialLinks?.length > 0) && (
                <div className="flex space-x-4 mt-4">
                  {(footerContentData?.social_links || socialLinks)?.map((social, index) => {
                    const IconComponent = socialIcons[social.platform?.toLowerCase() || ''] || Linkedin
                    return (
                      <motion.a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      >
                        <IconComponent size={18} />
                        <span className="sr-only">{social.platform}</span>
                      </motion.a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Footer Columns */}
          {columns.map((column, index) => (
            <div key={index} className="col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{column.title}</h3>
              <ul className="space-y-2 text-sm">
                {column.links?.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.external ? (
                      <a
                        href={link.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                      >
                        <ChevronRight size={14} className="mr-1" />
                        {link.title}
                      </a>
                    ) : (
                      <Link
                        href={link.link}
                        className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center"
                      >
                        <ChevronRight size={14} className="mr-1" />
                        {link.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info Column */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {contactInfo?.email && (
                <li className="flex items-start">
                  <Mail size={16} className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              )}
              {contactInfo?.phone && (
                <li className="flex items-start">
                  <Phone size={16} className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo?.address && (
                <li className="flex items-start">
                  <MapPin size={16} className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {contactInfo.address}
                  </span>
                </li>
              )}
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
              {copyrightText || `© 2025 HM Healthcare Partners. All rights reserved.`}
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {privacyPolicyUrl && (
                <Link
                  href={privacyPolicyUrl}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Privacy Policy
                </Link>
              )}
              {termsOfServiceUrl && (
                <Link
                  href={termsOfServiceUrl}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Terms of Service
                </Link>
              )}
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