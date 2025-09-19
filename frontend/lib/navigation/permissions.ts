import { CMSRole } from '@/types/cms'
import { createServerClient } from '@/lib/supabase-server'

export interface NavigationPermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
  publish: boolean
  reorder: boolean
  managePermissions: boolean
}

export interface NavigationSpecificPermission {
  id: string
  navigationId: string
  userId: string
  permissions: NavigationPermissions
  grantedBy: string
  grantedAt: Date
}

// Default permissions for each role
export const defaultNavigationPermissions: Record<CMSRole, NavigationPermissions> = {
  super_admin: {
    create: true,
    read: true,
    update: true,
    delete: true,
    publish: true,
    reorder: true,
    managePermissions: true
  },
  admin: {
    create: true,
    read: true,
    update: true,
    delete: true,
    publish: true,
    reorder: true,
    managePermissions: false
  },
  editor: {
    create: true,
    read: true,
    update: true,
    delete: false,
    publish: true,
    reorder: true,
    managePermissions: false
  },
  author: {
    create: true,
    read: true,
    update: true,
    delete: false,
    publish: false,
    reorder: true,
    managePermissions: false
  },
  contributor: {
    create: true,
    read: true,
    update: false,
    delete: false,
    publish: false,
    reorder: false,
    managePermissions: false
  },
  viewer: {
    create: false,
    read: true,
    update: false,
    delete: false,
    publish: false,
    reorder: false,
    managePermissions: false
  }
}

/**
 * Check if a user has a specific navigation permission
 */
export async function checkNavigationPermission(
  userId: string,
  navigationId: string | null,
  action: keyof NavigationPermissions,
  userRole?: CMSRole
): Promise<boolean> {
  // First check role-based permissions
  if (userRole && defaultNavigationPermissions[userRole][action]) {
    return true
  }

  // If no navigation ID provided, check only role permissions
  if (!navigationId) {
    return userRole ? defaultNavigationPermissions[userRole][action] : false
  }

  // Check navigation-specific permissions
  const supabase = await createServerClient()
  const { data: specificPermission } = await supabase
    .from('cms_navigation_permissions')
    .select('permissions')
    .eq('navigation_id', navigationId)
    .eq('user_id', userId)
    .single()

  if (specificPermission?.permissions?.[action]) {
    return true
  }

  // Check if user owns the navigation (for authors)
  if (userRole === 'author' && (action === 'update' || action === 'reorder')) {
    const { data: navigation } = await supabase
      .from('cms_navigations')
      .select('created_by')
      .eq('id', navigationId)
      .single()

    if (navigation?.created_by === userId) {
      return true
    }
  }

  return false
}

/**
 * Get all permissions for a user on a navigation
 */
export async function getUserNavigationPermissions(
  userId: string,
  navigationId: string,
  userRole: CMSRole
): Promise<NavigationPermissions> {
  const supabase = await createServerClient()

  // Super admins always have full permissions
  if (userRole === 'super_admin') {
    return defaultNavigationPermissions.super_admin
  }

  // Check for navigation-specific permissions
  const { data: specificPermission } = await supabase
    .from('cms_navigation_permissions')
    .select('permissions')
    .eq('navigation_id', navigationId)
    .eq('user_id', userId)
    .single()

  if (specificPermission?.permissions) {
    return specificPermission.permissions as NavigationPermissions
  }

  // Check if user owns the navigation (for authors)
  if (userRole === 'author') {
    const { data: navigation } = await supabase
      .from('cms_navigations')
      .select('created_by')
      .eq('id', navigationId)
      .single()

    if (navigation?.created_by === userId) {
      return {
        ...defaultNavigationPermissions.author,
        update: true,
        reorder: true
      }
    }
  }

  // Return default role permissions
  return defaultNavigationPermissions[userRole]
}

/**
 * Grant navigation permissions to a user
 */
export async function grantNavigationPermissions(
  navigationId: string,
  userId: string,
  permissions: Partial<NavigationPermissions>,
  grantedBy: string
): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('cms_navigation_permissions')
    .upsert({
      navigation_id: navigationId,
      user_id: userId,
      permissions,
      granted_by: grantedBy,
      granted_at: new Date().toISOString()
    })

  if (error) {
    throw new Error(`Failed to grant permissions: ${error.message}`)
  }
}

/**
 * Revoke navigation permissions from a user
 */
export async function revokeNavigationPermissions(
  navigationId: string,
  userId: string
): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('cms_navigation_permissions')
    .delete()
    .eq('navigation_id', navigationId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to revoke permissions: ${error.message}`)
  }
}

/**
 * Get all users with permissions on a navigation
 */
export async function getNavigationPermissions(
  navigationId: string
): Promise<Array<{
  userId: string
  user: { email: string; full_name: string }
  permissions: NavigationPermissions
  grantedBy: string
  grantedAt: Date
}>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('cms_navigation_permissions')
    .select(`
      user_id,
      permissions,
      granted_by,
      granted_at,
      user:users!cms_navigation_permissions_user_id_fkey (
        email,
        full_name
      )
    `)
    .eq('navigation_id', navigationId)

  if (error) {
    throw new Error(`Failed to fetch permissions: ${error.message}`)
  }

  if (!data) return []

  // Transform snake_case data to camelCase
  return data.map((item: any) => ({
    userId: item.user_id,
    user: Array.isArray(item.user) ? item.user[0] : item.user,
    permissions: item.permissions,
    grantedBy: item.granted_by,
    grantedAt: new Date(item.granted_at)
  }))
}