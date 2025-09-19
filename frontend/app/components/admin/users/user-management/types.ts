// Types for User Management
export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  email_verified: boolean
  two_factor_enabled: boolean
  last_login: string | null
  login_count: number
  failed_login_attempts: number
  account_locked_until: string | null
  permissions: string[]
  department: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  profile_image_url: string | null
}

export interface UserFormData {
  email: string
  first_name: string
  last_name: string
  role: string
  department: string
  permissions: string[]
  is_active: boolean
  email_verified: boolean
  send_welcome_email: boolean
  temporary_password?: string
}

export interface UserStats {
  total_users: number
  active_users: number
  super_admins: number
  editors: number
  authors: number
  contributors: number
  viewers: number
  recent_logins: number
  locked_accounts: number
  unverified_emails: number
}

export interface UserFilters {
  search: string
  role: string
  department: string
  status: string
}

export interface UserPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const USER_ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-800', permissions: 'All permissions' },
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800', permissions: 'Full content & user management' },
  { value: 'editor', label: 'Editor', color: 'bg-blue-100 text-blue-800', permissions: 'Content creation & editing' },
  { value: 'author', label: 'Author', color: 'bg-green-100 text-green-800', permissions: 'Create & edit own content' },
  { value: 'contributor', label: 'Contributor', color: 'bg-yellow-100 text-yellow-800', permissions: 'Submit content for review' },
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800', permissions: 'View-only access' }
] as const

export const ALL_PERMISSIONS = [
  'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
  'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
  'media.view', 'media.upload', 'media.delete', 'media.organize',
  'analytics.view', 'analytics.export',
  'seo.view', 'seo.edit', 'seo.analyze',
  'settings.view', 'settings.edit',
  'backup.create', 'backup.restore', 'backup.download'
] as const

export const DEPARTMENTS = [
  'Administration',
  'Clinical Research',
  'Quality Assurance',
  'Marketing',
  'IT/Technical',
  'Legal/Compliance',
  'Finance',
  'Operations'
] as const