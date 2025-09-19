import FooterClient from "./footer-client"
import { shouldShowInNavigation } from "@/lib/page-status"
import { FooterContent } from "@/lib/types/cms-types"

// Type definitions for Sanity data
interface NavigationItem {
  title: string
  url: string
  children?: Array<{
    title: string
    url: string
  }>
}

interface SanityNavigation {
  _id: string
  _type: 'navigation'
  title: 'header' | 'footer'
  items: NavigationItem[]
}

interface SanityAddress {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface SanitySiteSettings {
  _id: string
  _type: 'siteSettings'
  title: string
  description: string
  socialLinks?: {
    twitter?: string
    facebook?: string
    linkedin?: string
    instagram?: string
    youtube?: string
  }
  contactInfo?: {
    email?: string
    phone?: string
    address?: SanityAddress
  }
  footerText?: string
}

// Transform Sanity navigation to FooterClient format
function transformNavigation(navigation: SanityNavigation | null) {
  if (!navigation || !navigation.items) {
    // Return default navigation structure if no data from Sanity
    return {
      columns: [
        {
          title: "Company",
          links: [
            { title: "About Us", link: "/about" },
            { title: "Partners", link: "/partners" },
            { title: "Careers", link: "/careers" },
            { title: "Contact", link: "/contact" },
          ].filter(link => shouldShowInNavigation(link.link)),
        },
        {
          title: "Services",
          links: [
            { title: "Strategic Consulting", link: "/services/strategic-consulting" },
            { title: "Implementation", link: "/services/implementation" },
            { title: "Quality Improvement", link: "/research/qa-qi" },
            { title: "Research", link: "/research" },
          ].filter(link => shouldShowInNavigation(link.link)),
        },
        {
          title: "Resources",
          links: [
            { title: "Blog", link: "/blog" },
            { title: "Clinical Studies", link: "/research/clinical-studies" },
            { title: "Publications", link: "/research/publications" },
            { title: "Platforms", link: "/platforms" },
          ].filter(link => shouldShowInNavigation(link.link)),
        }
      ]
    }
  }

  // Group navigation items into columns
  const columns = [
    {
      title: "Company",
      links: [] as Array<{ title: string; link: string; external?: boolean }>
    },
    {
      title: "Services",
      links: [] as Array<{ title: string; link: string; external?: boolean }>
    },
    {
      title: "Resources",
      links: [] as Array<{ title: string; link: string; external?: boolean }>
    }
  ]

  // Categorize links based on URL patterns
  navigation.items.forEach(item => {
    // Ensure item has required properties
    if (!item.title || !item.url) {
      console.warn('Skipping navigation item with missing title or url:', item)
      return
    }

    // Skip archived/removed pages
    if (!shouldShowInNavigation(item.url)) {
      return
    }

    const link = {
      title: item.title,
      link: item.url,
      external: item.url.startsWith('http')
    }

    // Categorize based on URL patterns
    if (item.url.includes('/about') || 
        item.url.includes('/partners') || item.url.includes('/careers') || 
        item.url.includes('/contact')) {
      columns[0].links.push(link)
    } else if (item.url.includes('/services') || item.url.includes('/implementation') || 
               item.url.includes('/strategic-consulting')) {
      columns[1].links.push(link)
    } else if (item.url.includes('/blog') || item.url.includes('/publications') || 
               item.url.includes('/clinical-studies') || item.url.includes('/platforms') || 
               item.url.includes('/platforms')) {
      columns[2].links.push(link)
    } else if (item.url.includes('/research') || item.url.includes('/education') || 
               item.url.includes('/qa-qi')) {
      // Add research and education items to services column
      columns[1].links.push(link)
    } else {
      // Add remaining items to resources
      columns[2].links.push(link)
    }

    // Add submenu items if they exist
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach(child => {
        // Ensure child has required properties
        if (!child.title || !child.url) {
          console.warn('Skipping child navigation item with missing title or url:', child)
          return
        }

        const childLink = {
          title: child.title,
          link: child.url,
          external: child.url.startsWith('http')
        }
        
        // Add to the same column as parent
        if (item.url.includes('/services') || item.url.includes('/research') || 
            item.url.includes('/education')) {
          columns[1].links.push(childLink)
        } else if (item.url.includes('/about')) {
          columns[0].links.push(childLink)
        } else {
          columns[2].links.push(childLink)
        }
      })
    }
  })

  // Ensure we have the right number of links in each column
  // If empty, populate with defaults (filtered for archived pages)
  if (columns[0].links.length === 0) {
    columns[0].links = [
      { title: "About Us", link: "/about" },
      { title: "Partners", link: "/partners" },
      { title: "Careers", link: "/careers" },
      { title: "Contact", link: "/contact" },
    ].filter(link => shouldShowInNavigation(link.link))
  }
  
  if (columns[1].links.length === 0) {
    columns[1].links = [
      { title: "Strategic Consulting", link: "/services/strategic-consulting" },
      { title: "Implementation", link: "/services/implementation" },
      { title: "Quality Improvement", link: "/research/qa-qi" },
      { title: "Research", link: "/research" },
    ].filter(link => shouldShowInNavigation(link.link))
  }
  
  if (columns[2].links.length === 0) {
    columns[2].links = [
      { title: "Blog", link: "/blog" },
      { title: "Clinical Studies", link: "/research/clinical-studies" },
      { title: "Publications", link: "/research/publications" },
      { title: "Platforms", link: "/platforms" },
    ].filter(link => shouldShowInNavigation(link.link))
  }

  // Return exactly 3 columns (the FooterClient component will add Company Info and Contact Us columns)
  return {
    columns: columns
  }
}

// Transform social links from Sanity format
function transformSocialLinks(socialLinks?: SanitySiteSettings['socialLinks']) {
  if (!socialLinks) return undefined

  const links = []
  if (socialLinks.facebook) {
    links.push({ platform: 'facebook', url: socialLinks.facebook })
  }
  if (socialLinks.twitter) {
    links.push({ platform: 'twitter', url: socialLinks.twitter })
  }
  if (socialLinks.linkedin) {
    links.push({ platform: 'linkedin', url: socialLinks.linkedin })
  }
  if (socialLinks.instagram) {
    links.push({ platform: 'instagram', url: socialLinks.instagram })
  }
  if (socialLinks.youtube) {
    links.push({ platform: 'youtube', url: socialLinks.youtube })
  }

  return links.length > 0 ? links : undefined
}

// Transform address to string format
function formatAddress(address?: SanityAddress): string | undefined {
  if (!address) return undefined

  const parts = []
  if (address.street) parts.push(address.street)
  if (address.city || address.state || address.zipCode) {
    const cityStateLine = [
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean).join(' ')
    if (cityStateLine) parts.push(cityStateLine)
  }
  if (address.country) parts.push(address.country)

  return parts.length > 0 ? parts.join('\n') : undefined
}

// GROQ queries
const FOOTER_NAVIGATION_QUERY = `*[_type == "navigation" && title == "footer"][0]{
  _id,
  _type,
  title,
  items[] {
    title,
    url,
    children[] {
      title,
      url
    }
  }
}`

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  _id,
  _type,
  title,
  description,
  socialLinks {
    twitter,
    facebook,
    linkedin,
    instagram,
    youtube
  },
  contactInfo {
    email,
    phone,
    address {
      street,
      city,
      state,
      zipCode,
      country
    }
  },
  footerText
}`

export default async function FooterServer() {
  // Use static fallback data to bypass Sanity issues temporarily
  const footerNavigation = {
    columns: [
      {
        title: "Company",
        links: [
          { title: "About Us", link: "/about" },
          { title: "Partners", link: "/partners" },
          { title: "Careers", link: "/careers" },
          { title: "Contact", link: "/contact" },
        ].filter(link => shouldShowInNavigation(link.link)),
      },
      {
        title: "Services",
        links: [
          { title: "Strategic Consulting", link: "/services/strategic-consulting" },
          { title: "Implementation", link: "/services/implementation" },
          { title: "Quality Improvement", link: "/research/qa-qi" },
          { title: "Research", link: "/research" },
        ].filter(link => shouldShowInNavigation(link.link)),
      },
      {
        title: "Resources",
        links: [
          { title: "Blog", link: "/blog" },
          { title: "Clinical Studies", link: "/research/clinical-studies" },
          { title: "Publications", link: "/research/publications" },
          { title: "Platforms", link: "/platforms" },
        ].filter(link => shouldShowInNavigation(link.link)),
      }
    ]
  }

  const socialLinks = [
    { platform: 'linkedin', url: 'https://www.linkedin.com/company/hm-healthcare-partners/' },
    { platform: 'twitter', url: 'https://twitter.com/hmhealthcare' },
  ]

  const contactInfo = {
    email: 'info@hm-hcp.com',
    phone: '(312) 985-9300',
    address: 'Offices in:\nFt. Lauderdale, FL &\nChicago, IL'
  }

  // Pass static data to client component
  return (
    <FooterClient
      footerNavigation={footerNavigation}
      socialLinks={socialLinks}
      contactInfo={contactInfo}
      copyrightText="© 2025 HM Healthcare Partners. All rights reserved."
      privacyPolicyUrl="/privacy-policy"
      termsOfServiceUrl="/terms-of-service"
    />
  )
}