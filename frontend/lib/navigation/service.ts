import { createServerClient } from '@/lib/supabase-server'
import { 
  getCachedNavigation, 
  setCachedNavigation, 
  getCachedNavigationByLocation,
  setCachedNavigationByLocation,
  invalidateNavigationCache
} from './cache'

export interface NavigationItem {
  id: string
  title: string
  url?: string
  page_id?: string
  link_type: 'page' | 'custom' | 'external' | 'anchor'
  target: '_self' | '_blank' | '_parent' | '_top'
  css_classes?: string
  icon?: string
  position: number
  status: 'active' | 'inactive' | 'draft'
  parent_id?: string
  children: NavigationItem[]
}

export interface Navigation {
  id: string
  name: string
  location: 'header' | 'footer' | 'mobile' | 'sidebar'
  status: 'active' | 'inactive' | 'draft'
  is_default: boolean
  items: NavigationItem[]
}

/**
 * Get navigation by ID with caching
 */
export async function getNavigationById(navigationId: string): Promise<Navigation | null> {
  // Try cache first
  const cached = await getCachedNavigation(navigationId)
  if (cached) {
    return {
      id: cached.id,
      name: cached.name,
      location: cached.location as Navigation['location'],
      status: cached.status as Navigation['status'],
      is_default: false, // This would need to be included in cache
      items: buildNavigationTree(cached.items)
    }
  }

  // Fetch from database
  const supabase = await createServerClient()
  
  const { data: navigation, error } = await supabase
    .from('cms_navigations')
    .select(`
      id,
      name,
      location,
      status,
      is_default
    `)
    .eq('id', navigationId)
    .eq('status', 'active')
    .single()

  if (error || !navigation) {
    return null
  }

  // Get navigation items
  const { data: items, error: itemsError } = await supabase
    .from('cms_navigation_items')
    .select('*')
    .eq('navigation_id', navigationId)
    .eq('status', 'active')
    .order('position')

  if (itemsError) {
        return null
  }

  const navigationData: Navigation = {
    ...navigation,
    items: buildNavigationTree(items || [])
  }

  // Cache the result
  await setCachedNavigation(navigationId, {
    id: navigation.id,
    name: navigation.name,
    location: navigation.location,
    status: navigation.status,
    items: items || []
  })

  return navigationData
}

/**
 * Get navigation by location with caching
 */
export async function getNavigationByLocation(location: string): Promise<Navigation | null> {
  // Try cache first
  const cached = await getCachedNavigationByLocation(location)
  if (cached) {
    return {
      id: cached.id,
      name: cached.name,
      location: cached.location as Navigation['location'],
      status: cached.status as Navigation['status'],
      is_default: false,
      items: buildNavigationTree(cached.items)
    }
  }

  // Fetch from database
  try {
    const supabase = await createServerClient()
    
    const { data: navigation, error } = await supabase
      .from('cms_navigations')
      .select(`
        id,
        name,
        location,
        status,
        is_default
      `)
      .eq('location', location)
      .eq('status', 'active')
      .single()

    if (error || !navigation) {
      return null
    }

    // Get navigation items
    const { data: items, error: itemsError } = await supabase
      .from('cms_navigation_items')
      .select('*')
      .eq('navigation_id', navigation.id)
      .eq('status', 'active')
      .order('position')

    if (itemsError) {
            return null
    }
    
    const navigationData: Navigation = {
      ...navigation,
      items: buildNavigationTree(items || [])
    }

    // Cache the result
    await setCachedNavigationByLocation(location, {
      id: navigation.id,
      name: navigation.name,
      location: navigation.location,
      status: navigation.status,
      items: items || []
    })

    return navigationData
  } catch (error) {
    return null
  }
}

/**
 * Build hierarchical navigation tree from flat items
 */
function buildNavigationTree(items: any[]): NavigationItem[] {
  const itemMap = new Map<string, NavigationItem>()
  const tree: NavigationItem[] = []

  // First pass: create all items
  items.forEach(item => {
    itemMap.set(item.id, {
      id: item.id,
      title: item.title,
      url: item.url,
      page_id: item.page_id,
      link_type: item.link_type || 'custom',
      target: item.target || '_self',
      css_classes: item.css_classes,
      icon: item.icon,
      position: item.position,
      status: item.status,
      parent_id: item.parent_id,
      children: []
    })
  })

  // Second pass: build hierarchy
  items.forEach(item => {
    const navItem = itemMap.get(item.id)!
    if (item.parent_id) {
      const parent = itemMap.get(item.parent_id)
      if (parent) {
        parent.children.push(navItem)
      }
    } else {
      tree.push(navItem)
    }
  })

  // Sort items by position at each level
  const sortByPosition = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .sort((a, b) => a.position - b.position)
      .map(item => ({
        ...item,
        children: sortByPosition(item.children)
      }))
  }

  return sortByPosition(tree)
}

/**
 * Invalidate navigation cache when items are updated
 */
export async function invalidateNavigation(navigationId: string): Promise<void> {
  await invalidateNavigationCache(navigationId)
}

/**
 * Preload navigation data for better performance
 */
export async function preloadNavigations(): Promise<void> {
  try {
    const locations = ['header', 'footer', 'mobile', 'sidebar']
    
    // Preload all location-based navigations
    await Promise.all(
      locations.map(location => getNavigationByLocation(location))
    )
    
  } catch (error) {
  }
}

/**
 * Get navigation with performance metrics
 */
export async function getNavigationWithMetrics(navigationId: string): Promise<{
  navigation: Navigation | null
  metrics: {
    cacheHit: boolean
    loadTime: number
    itemCount: number
  }
}> {
  const startTime = Date.now()
  let cacheHit = false
  
  // Check cache first
  const cached = await getCachedNavigation(navigationId)
  if (cached) {
    cacheHit = true
    const navigation = {
      id: cached.id,
      name: cached.name,
      location: cached.location as Navigation['location'],
      status: cached.status as Navigation['status'],
      is_default: false,
      items: buildNavigationTree(cached.items)
    }
    
    return {
      navigation,
      metrics: {
        cacheHit,
        loadTime: Date.now() - startTime,
        itemCount: cached.items.length
      }
    }
  }
  
  // Fetch from database
  const navigation = await getNavigationById(navigationId)
  
  return {
    navigation,
    metrics: {
      cacheHit,
      loadTime: Date.now() - startTime,
      itemCount: navigation?.items.length || 0
    }
  }
}