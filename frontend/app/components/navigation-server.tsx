import { TextMegaNavigationFixed } from "./text-mega-navigation-fixed"
import { supabaseAdmin } from "@/lib/dal/supabase"

// Type definitions for navigation data
interface NavigationItem {
  title: string
  url: string
  children?: Array<{
    title: string
    url: string
  }>
}

// Get navigation data from Supabase or fallback to default
async function getNavigationData() {
  try {
    // Try to fetch navigation from managed_content table
    const { data, error } = await supabaseAdmin
      .from('managed_content')
      .select('*')
      .eq('type', 'navigation')
      .eq('slug', 'header-navigation')
      .eq('status', 'published')
      .limit(1)
      .single()

    if (error || !data?.content?.items) {
      // Return null to use default navigation
      return null
    }

    // Transform data for TextMegaNavigationOriginal
    return data.content.items.map((item: NavigationItem) => ({
      name: item.title,
      href: item.url,
      hasDropdown: item.children && item.children.length > 0,
      submenu: item.children?.map(child => ({
        name: child.title,
        href: child.url,
        description: undefined
      }))
    }))
  } catch (error) {
    console.error('Failed to fetch navigation:', error)
    return null
  }
}

export default async function NavigationServer() {
  // Fetch navigation data from Supabase
  const navItems = await getNavigationData()

  // Pass to client component (uses default navigation if navItems is null)
  return <TextMegaNavigationFixed navItems={navItems} />
}