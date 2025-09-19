import { supabaseAdmin, type NavigationMenu, type SiteSetting } from './supabase'
import { getCurrentAdmin, logAuditAction } from './admin-auth'
import { revalidatePath } from 'next/cache'

// Navigation Management
export async function getAllNavigationMenus() {
  const { data, error } = await supabaseAdmin
    .from('navigation_menus')
    .select('*')
    .order('location')

  if (error) throw error
  
  // Return default structures for standard locations if empty
  if (!data || data.length === 0) {
    return [
      { id: 'default-header', name: 'header', location: 'header', items: [] },
      { id: 'default-footer', name: 'footer', location: 'footer', items: [] },
      { id: 'default-sidebar', name: 'sidebar', location: 'sidebar', items: [] }
    ]
  }

  return data as NavigationMenu[]
}

export async function getNavigationMenu(location: string) {
  const { data, error } = await supabaseAdmin
    .from('navigation_menus')
    .select('*')
    .eq('location', location)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  
  // Return default structure if not found
  if (!data) {
    return {
      id: `default-${location}`,
      name: location,
      location,
      items: []
    }
  }

  return data as NavigationMenu
}

export async function updateNavigationMenu(
  location: string,
  items: any[]
) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin', 'editor'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const { data, error } = await supabaseAdmin
    .from('navigation_menus')
    .upsert({
      name: location,
      location,
      items,
      updated_by: admin.id
    }, {
      onConflict: 'location'
    })
    .select()
    .single()

  if (error) throw error

  await logAuditAction(admin.id, 'update', 'navigation', data.id, {
    location,
    itemCount: items.length
  })

  // Revalidate all pages as navigation affects the entire site
  revalidatePath('/', 'layout')

  return data as NavigationMenu
}

// Site Settings Management
export async function getSiteSettings() {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('*')

  if (error) throw error

  // Convert array to object
  const settings: Record<string, any> = {}
  data.forEach((setting: SiteSetting) => {
    settings[setting.key] = setting.value
  })

  return settings
}

export async function getSiteSetting(key: string) {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  
  return data?.value || null
}

export async function updateSiteSetting(key: string, value: any) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .upsert({
      key,
      value,
      updated_by: admin.id
    }, {
      onConflict: 'key'
    })
    .select()
    .single()

  if (error) throw error

  await logAuditAction(admin.id, 'update', 'settings', undefined, {
    key,
    value
  })

  // Revalidate based on setting type
  if (key.includes('seo') || key.includes('meta')) {
    revalidatePath('/', 'layout')
  }

  return data as SiteSetting
}

export async function bulkUpdateSiteSettings(settings: Record<string, any>) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_by: admin.id
  }))

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert(updates, {
      onConflict: 'key'
    })

  if (error) throw error

  await logAuditAction(admin.id, 'bulk_update', 'settings', undefined, {
    keys: Object.keys(settings)
  })

  revalidatePath('/', 'layout')
}

// Common navigation structures
export const defaultNavigationStructures = {
  header: [
    {
      label: 'Home',
      href: '/',
      type: 'link'
    },
    {
      label: 'About',
      href: '/about',
      type: 'link'
    },
    {
      label: 'Platforms',
      href: '/platforms',
      type: 'dropdown',
      items: []
    },
    {
      label: 'Blog',
      href: '/blog',
      type: 'link'
    },
    {
      label: 'Contact',
      href: '/contact',
      type: 'link'
    }
  ],
  footer: [
    {
      label: 'Company',
      type: 'section',
      items: [
        { label: 'About Us', href: '/about', type: 'link' },
        { label: 'Our Team', href: '/team', type: 'link' },
        { label: 'Careers', href: '/careers', type: 'link' }
      ]
    },
    {
      label: 'Resources',
      type: 'section',
      items: [
        { label: 'Blog', href: '/blog', type: 'link' },
        { label: 'Documentation', href: '/docs', type: 'link' },
        { label: 'Support', href: '/support', type: 'link' }
      ]
    },
    {
      label: 'Legal',
      type: 'section',
      items: [
        { label: 'Privacy Policy', href: '/privacy', type: 'link' },
        { label: 'Terms of Service', href: '/terms', type: 'link' }
      ]
    }
  ]
}

// Default site settings
export const defaultSiteSettings = {
  site_title: 'HM Healthcare Partners',
  site_description: 'Transforming healthcare through innovative technology solutions',
  site_url: 'https://hm-hcp.com',
  contact_email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
  contact_phone: '+1 (555) 123-4567',
  social_twitter: '@hmhealthcare',
  social_linkedin: 'hm-healthcare-partners',
  analytics_enabled: true,
  maintenance_mode: false
}