'use client'

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth/hooks'

// Define permission hierarchy
const PERMISSIONS = {
  // Content permissions
  'content.view': ['viewer', 'editor', 'publisher', 'admin'],
  'content.edit': ['editor', 'publisher', 'admin'],
  'content.delete': ['publisher', 'admin'],
  'content.publish': ['publisher', 'admin'],
  'content.archive': ['publisher', 'admin'],
  
  // Workflow permissions
  'workflow.view': ['viewer', 'editor', 'publisher', 'admin'],
  'workflow.transition': ['editor', 'publisher', 'admin'],
  'workflow.approve': ['publisher', 'admin'],
  'workflow.reject': ['publisher', 'admin'],
  'workflow.configure': ['admin'],
  
  // Team management permissions
  'team.view': ['viewer', 'editor', 'publisher', 'admin'],
  'team.edit': ['admin'],
  'team.delete': ['admin'],
  'team.create': ['admin'],
  
  // Bulk operations permissions
  'bulk.select': ['editor', 'publisher', 'admin'],
  'bulk.export': ['editor', 'publisher', 'admin'],
  'bulk.import': ['publisher', 'admin'],
  'bulk.delete': ['admin'],
  'bulk.publish': ['publisher', 'admin'],
  
  // Scheduling permissions
  'schedule.view': ['viewer', 'editor', 'publisher', 'admin'],
  'schedule.create': ['editor', 'publisher', 'admin'],
  'schedule.edit': ['publisher', 'admin'],
  'schedule.delete': ['publisher', 'admin'],
  
  // Version control permissions
  'version.view': ['viewer', 'editor', 'publisher', 'admin'],
  'version.compare': ['editor', 'publisher', 'admin'],
  'version.restore': ['publisher', 'admin'],
  'version.delete': ['admin'],
  
  // System permissions
  'system.configure': ['admin'],
  'system.audit': ['admin'],
  'system.backup': ['admin'],
  'system.restore': ['admin']
} as const

type Permission = keyof typeof PERMISSIONS
type Role = 'viewer' | 'editor' | 'publisher' | 'admin'

export function usePermissions() {
  const { user } = useAuth()

  // Get user role from metadata or default to viewer
  const userRole = useMemo(() => {
    return (user?.user_metadata?.role || 'viewer') as Role
  }, [user])

  // PERFORMANCE FIX: Cache permission calculations to prevent excessive re-renders
  const permissionCache = useMemo(() => {
    const cache = new Map<string, boolean>()
    
    if (!user) return cache
    
    // Pre-calculate all permissions for the user's role
    const isSuperAdmin = user.user_metadata?.is_super_admin === true
    
    Object.entries(PERMISSIONS).forEach(([permission, allowedRoles]) => {
      if (isSuperAdmin) {
        cache.set(permission, true)
      } else {
        cache.set(permission, allowedRoles.includes(userRole))
      }
    })
    
    return cache
  }, [user, userRole])

  // Check if user has a specific permission
  const checkPermission = useCallback((permission: Permission | string): boolean => {
    if (!user) return false
    
    // Check cache first for performance
    if (permissionCache.has(permission)) {
      return permissionCache.get(permission) || false
    }
    
    // Permission not in cache means it's unknown
    console.warn(`Unknown permission: ${permission}`)
    return false
  }, [user, permissionCache])

  // Check multiple permissions (AND logic)
  const checkAllPermissions = useCallback((permissions: (Permission | string)[]): boolean => {
    return permissions.every(permission => checkPermission(permission))
  }, [checkPermission])

  // Check multiple permissions (OR logic)
  const checkAnyPermission = useCallback((permissions: (Permission | string)[]): boolean => {
    return permissions.some(permission => checkPermission(permission))
  }, [checkPermission])

  // Get all permissions for current user
  const getAllPermissions = useCallback((): Permission[] => {
    if (!user) return []
    
    return Object.keys(PERMISSIONS).filter(permission => 
      checkPermission(permission)
    ) as Permission[]
  }, [user, checkPermission])

  // Check if user can perform action on specific resource
  const checkResourcePermission = useCallback(async (
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> => {
    // Basic permission check
    const basePermission = `${resource}.${action}`
    if (!checkPermission(basePermission)) return false
    
    // Additional resource-specific checks
    if (resourceId) {
      try {
        // Check ownership or special access rules
        const response = await fetch(`/api/admin/permissions/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource, action, resourceId })
        })
        
        if (!response.ok) return false
        
        const { allowed } = await response.json()
        return allowed
      } catch (error) {
        console.error('Failed to check resource permission:', error)
        return false
      }
    }
    
    return true
  }, [checkPermission])

  return {
    userRole,
    checkPermission,
    checkAllPermissions,
    checkAnyPermission,
    getAllPermissions,
    checkResourcePermission,
    permissions: PERMISSIONS
  }
}