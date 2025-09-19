/**
 * User Management Utilities
 * Helper functions for user management operations
 */

import { AdminUser, FilterOption, StatusFilter } from './types'

/**
 * Format date string to human readable format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format last login time with relative time logic
 */
export const formatLastLogin = (dateString?: string): string => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Filter users based on search query, role, and status
 */
export const filterUsers = (
  users: AdminUser[],
  searchQuery: string,
  roleFilter: FilterOption,
  statusFilter: StatusFilter
): AdminUser[] => {
  return users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })
}

/**
 * Format permission string for display
 */
export const formatPermission = (permission: string): string => {
  return permission.replace('_', ' ').replace('.', ': ')
}

/**
 * Validate user form data
 */
export const validateUserForm = (user: Partial<AdminUser>): string[] => {
  const errors: string[] = []
  
  if (!user.firstName?.trim()) {
    errors.push('First name is required')
  }
  
  if (!user.lastName?.trim()) {
    errors.push('Last name is required')
  }
  
  if (!user.email?.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Please enter a valid email address')
  }
  
  if (!user.role) {
    errors.push('Role is required')
  }
  
  return errors
}

/**
 * Check if user can be deleted
 */
export const canDeleteUser = (user: AdminUser): boolean => {
  return user.role !== 'super_admin'
}

/**
 * Generate user initials for avatar
 */
export const getUserInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}