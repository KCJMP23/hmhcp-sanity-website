import { shouldShowInNavigation } from './page-status'

export interface NavigationItem {
  _key: string
  title: string
  url: string
  target?: string
  children?: NavigationItem[]
}

export interface Navigation {
  title: string
  items: NavigationItem[]
}

// Fallback navigation data for when database is not available
export const fallbackNavItems = [
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Platforms",
    href: "/platforms",
    hasDropdown: true,
    submenu: [
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
        name: "Research Hub",
        href: "/platforms/research-hub",
        description: "Centralized research management platform",
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
    hasDropdown: true,
    submenu: [
      {
        name: "Clinical Research",
        href: "/services/clinical-research",
        description: "End-to-end clinical research services",
      },
      {
        name: "Implementation",
        href: "/services/implementation",
        description: "Healthcare technology implementation",
      },
      {
        name: "Quality Improvement",
        href: "/services/quality-improvement",
        description: "Quality enhancement programs",
      },
      {
        name: "Strategic Consulting",
        href: "/services/strategic-consulting",
        description: "Healthcare strategy and technology consulting",
      },
    ],
  },
  {
    name: "Resources",
    href: "/blog",
    hasDropdown: true,
    submenu: [
      {
        name: "Blog",
        href: "/blog",
        description: "Latest insights and updates",
      },
      {
        name: "Newsletter",
        href: "/newsletter",
        description: "Subscribe to our newsletter",
      },
    ],
  },
  {
    name: "Contact",
    href: "/contact",
  },
].filter(item => shouldShowInNavigation(item.href))

// Helper function to filter navigation items
function filterNavigationItems(items: any[]): any[] {
  return items
    .filter(item => shouldShowInNavigation(item.href || item.url))
    .map(item => ({
      ...item,
      submenu: item.submenu ? filterNavigationItems(item.submenu) : undefined,
      children: item.children ? filterNavigationItems(item.children) : undefined
    }))
    .filter(item => {
      // Remove items with empty submenus after filtering
      if (item.hasDropdown || item.children) {
        return (item.submenu && item.submenu.length > 0) || (item.children && item.children.length > 0)
      }
      return true
    })
}

export async function getNavigation(type: 'header' | 'footer' = 'header') {
  try {
    // For now, always return the fallback navigation
    // This can be enhanced later to fetch from Supabase if needed
    console.log(`Using static ${type} navigation`)
    return filterNavigationItems(fallbackNavItems)
  } catch (error) {
    console.error('Error processing navigation:', error)
    return filterNavigationItems(fallbackNavItems)
  }
}