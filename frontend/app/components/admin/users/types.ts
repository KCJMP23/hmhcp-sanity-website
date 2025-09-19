/**
 * User Management Types and Constants
 * Centralized types and configuration for admin user management
 */

// Import AdminUser type from DAL
import type { AdminUser as ImportedAdminUser } from '@/lib/dal/users'
export type AdminUser = ImportedAdminUser

export const roleLabels = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  editor: { label: 'Editor', color: 'bg-blue-100 text-blue-800' },
  author: { label: 'Author', color: 'bg-green-100 text-green-800' },
  contributor: { label: 'Contributor', color: 'bg-yellow-100 text-yellow-800' },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-800' }
}

export const rolePermissions = {
  super_admin: ['all'],
  admin: ['content.create', 'content.edit', 'content.delete', 'content.publish', 'media.upload', 'media.delete', 'users.view', 'settings.edit'],
  editor: ['content.create', 'content.edit', 'content.delete', 'content.publish', 'media.upload', 'media.delete'],
  author: ['content.create', 'content.edit_own', 'content.publish_own', 'media.upload'],
  contributor: ['content.create', 'media.upload'],
  viewer: ['content.view']
}

export type UserRole = AdminUser['role']
export type FilterOption = 'all' | UserRole
export type StatusFilter = 'all' | 'active' | 'inactive'