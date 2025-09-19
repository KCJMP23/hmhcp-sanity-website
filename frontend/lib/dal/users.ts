import { supabaseAdmin } from './supabase'
import { logAuditAction } from './admin-auth'
import { unstable_cache } from 'next/cache'
import logger from '@/lib/logging/winston-logger'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'admin' | 'editor' | 'author' | 'contributor' | 'viewer'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  permissions: string[]
  avatar?: string
}

// Get all users with caching
export const getUsers = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching users', {
        error: error.message,
        code: error.code
      })
      return []
    }

    // Map database structure to AdminUser interface
    return data.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name || user.email.split('@')[0],
      lastName: user.last_name || '',
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.updated_at, // Use updated_at as proxy for last login
      createdAt: user.created_at,
      permissions: getPermissionsForRole(user.role),
      avatar: user.avatar_url
    })) as AdminUser[]
  },
  ['profiles'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['profiles']
  }
)

// Get single user by ID
export async function getUserById(userId: string): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    logger.error('Error fetching user by ID', {
      error: error?.message,
      code: error?.code,
      userId
    })
    return null
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name || data.email.split('@')[0],
    lastName: data.last_name || '',
    role: data.role,
    isActive: data.is_active,
    lastLogin: data.updated_at, // Use updated_at as proxy for last login
    createdAt: data.created_at,
    permissions: getPermissionsForRole(data.role),
    avatar: data.avatar_url
  }
}

// Create new user
export async function createUser(userData: Partial<AdminUser> & { password: string }) {
  const { password, ...userWithoutPassword } = userData
  
  // Create auth user first
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email!,
    password,
    email_confirm: true
  })

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`)
  }

  // Then create profile record
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role || 'viewer',
      is_active: userData.isActive !== false
    })
    .select()
    .single()

  if (error) {
    // Rollback auth user creation
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw new Error(`Failed to create profile: ${error.message}`)
  }

  // Log the action to audit trail
  await logAuditAction(authData.user.id, 'create', 'admin_user', data.id, {
    email: data.email,
    role: data.role
  })

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name || data.email.split('@')[0],
    lastName: data.last_name || '',
    role: data.role,
    isActive: data.is_active,
    lastLogin: data.updated_at, // Use updated_at as proxy for last login
    createdAt: data.created_at,
    permissions: getPermissionsForRole(data.role),
    avatar: data.avatar_url
  } as AdminUser
}

// Update user - flexible to handle both profile page and admin formats
export async function updateUser(userId: string, updates: any) {
  try {
    // Determine which table to use - check if admin_users exists first
    let tableName = 'admin_users'
    let updateData: any = {}
    
    // Handle different input formats
    if (updates.full_name !== undefined) {
      // Profile page format
      updateData = {
        full_name: updates.full_name,
        bio: updates.bio,
        role: updates.role,
        status: updates.status
      }
    } else {
      // Legacy format - convert to admin_users format
      updateData = {
        full_name: updates.firstName && updates.lastName ? `${updates.firstName} ${updates.lastName}` : updates.firstName,
        role: updates.role,
        status: updates.isActive ? 'active' : 'inactive',
        avatar_url: updates.avatar
      }
    }

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    // Log the action to audit trail
    try {
      await logAuditAction(userId, 'update', 'admin_user', userId, updates)
    } catch (auditError) {
      // Non-critical error, don't fail the update
      console.warn('Failed to log audit action:', auditError)
    }

    return data
  } catch (error) {
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Delete user (soft delete by deactivating)
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({ status: 'inactive' })
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    // Log the action to audit trail
    try {
      await logAuditAction(userId, 'delete', 'admin_user', userId, {
        action: 'soft_delete_user'
      })
    } catch (auditError) {
      // Non-critical error, don't fail the deletion
      console.warn('Failed to log audit action:', auditError)
    }
  } catch (error) {
    throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get permissions for role
function getPermissionsForRole(role: AdminUser['role']): string[] {
  const rolePermissions = {
    super_admin: ['all'],
    admin: ['content.create', 'content.edit', 'content.delete', 'content.publish', 'media.upload', 'media.delete', 'users.view', 'settings.edit'],
    editor: ['content.create', 'content.edit', 'content.delete', 'content.publish', 'media.upload', 'media.delete'],
    author: ['content.create', 'content.edit_own', 'content.publish_own', 'media.upload'],
    contributor: ['content.create', 'media.upload'],
    viewer: ['content.view']
  }

  return rolePermissions[role] || []
}

// Filter users
export async function filterUsers(
  searchQuery: string = '',
  roleFilter: string = 'all',
  statusFilter: string = 'all'
): Promise<AdminUser[]> {
  let query = supabaseAdmin.from('profiles').select('*')

  // Apply search filter
  if (searchQuery) {
    query = query.or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
  }

  // Apply role filter
  if (roleFilter !== 'all') {
    query = query.eq('role', roleFilter)
  }

  // Apply status filter
  if (statusFilter === 'active') {
    query = query.eq('is_active', true)
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    logger.error('Error filtering users', {
      error: error.message,
      code: error.code,
      searchQuery,
      roleFilter,
      statusFilter
    })
    return []
  }

  return data.map((user: any) => ({
    id: user.id,
    email: user.email,
    firstName: user.first_name || user.email.split('@')[0],
    lastName: user.last_name || '',
    role: user.role,
    isActive: user.is_active,
    lastLogin: user.updated_at, // Use updated_at as proxy for last login
    createdAt: user.created_at,
    permissions: getPermissionsForRole(user.role),
    avatar: user.avatar_url
  })) as AdminUser[]
}