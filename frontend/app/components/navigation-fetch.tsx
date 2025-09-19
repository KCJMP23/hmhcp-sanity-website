import { supabaseAdmin } from "@/lib/dal/supabase"

// Type definitions
interface NavigationItem {
  title: string
  url: string
  children?: Array<{
    title: string
    url: string
  }>
}

// Server-side data fetching from Supabase
export async function getNavigationData() {
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
      return null
    }

    // Transform data to expected format
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