'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { AdminUser, UserFormData, UserStats, UserFilters, UserPagination } from './user-management/types'
import { UserStatsCards } from './user-management/user-stats'
import { UserFiltersComponent } from './user-management/user-filters'
import { UserTable } from './user-management/user-table'
import { UserFormDialog } from './user-management/user-form-dialog'
import { UserDetailDialog } from './user-management/user-detail-dialog'
import { logger } from '@/lib/logging/client-safe-logger'

const UserManagementComponent = () => {

  // State management
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Filters and pagination
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    department: '',
    status: 'all'
  })
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to load users')

      const data = await response.json()
      setUsers(data.data || [])
      setStats(data.stats || null)
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch (error) {
      logger.error('Error loading users', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'loadUsers'
      })
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [pagination.page, filters])

  // Get CSRF token
  const getCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token')
      const data = await response.json()
      return data.token
    } catch (error) {
      logger.error('Failed to get CSRF token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'getCSRFToken'
      })
      return ''
    }
  }

  // Handle user form submission
  const handleSaveUser = async (formData: UserFormData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({
          ...(editingUser && { id: editingUser.id }),
          ...formData
        })
      })

      if (!response.ok) throw new Error('Failed to save user')

      toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`)

      setIsCreateDialogOpen(false)
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      logger.error('Error saving user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleSave',
        userId: editingUser?.id
      })
      toast.error(`Failed to ${editingUser ? 'update' : 'create'} user`)
    }
  }

  // Handle user deletion
  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ id: user.id })
      })

      if (!response.ok) throw new Error('Failed to delete user')

      toast.success('User deleted successfully')

      await loadUsers()
    } catch (error) {
      logger.error('Error deleting user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleDelete',
        userId: user.id
      })
      toast.error('Failed to delete user')
    }
  }

  // Handle user status toggle
  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const response = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ 
          id: user.id, 
          is_active: !user.is_active 
        })
      })

      if (!response.ok) throw new Error('Failed to update user status')

      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`)

      await loadUsers()
    } catch (error) {
      logger.error('Error updating user status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleToggleStatus',
        userId: user.id,
        newStatus: !user.is_active
      })
      toast.error('Failed to update user status')
    }
  }

  // Handle password reset
  const handleResetPassword = async (user: AdminUser) => {
    if (!confirm(`Send password reset email to ${user.email}?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ id: user.id })
      })

      if (!response.ok) throw new Error('Failed to send password reset')

      toast.success('Password reset email sent successfully')
    } catch (error) {
      logger.error('Error sending password reset', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleResetPassword',
        userId: user.id
      })
      toast.error('Failed to send password reset email')
    }
  }

  // Handle welcome email resend
  const handleResendWelcome = async (user: AdminUser) => {
    try {
      const response = await fetch('/api/admin/users/resend-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ id: user.id })
      })

      if (!response.ok) throw new Error('Failed to resend welcome email')

      toast.success('Welcome email sent successfully')
    } catch (error) {
      logger.error('Error sending welcome email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleSendWelcome',
        userId: user.id
      })
      toast.error('Failed to send welcome email')
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return

    const confirmMessage = `${action} ${selectedUsers.length} selected user${selectedUsers.length === 1 ? '' : 's'}?`
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ 
          action, 
          userIds: selectedUsers 
        })
      })

      if (!response.ok) throw new Error(`Failed to ${action} users`)

      toast.success(`Bulk ${action} completed successfully`)

      setSelectedUsers([])
      await loadUsers()
    } catch (error) {
      logger.error('Error with bulk action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleBulkAction',
        bulkAction: action,
        userCount: selectedUsers.length
      })
      toast.error(`Failed to ${action} selected users`)
    }
  }

  // Handle user editing
  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setIsCreateDialogOpen(true)
    setIsDetailDialogOpen(false)
  }

  // Handle user viewing
  const handleView = (user: AdminUser) => {
    setViewingUser(user)
    setIsDetailDialogOpen(true)
  }

  // Handle add new user
  const handleAddNew = () => {
    setEditingUser(null)
    setIsCreateDialogOpen(true)
  }

  // Handle export
  const handleExport = () => {
    try {
      const csv = [
        'Name,Email,Role,Department,Status,Last Login,Login Count',
        ...users.map(user => [
          `"${user.first_name} ${user.last_name}"`,
          user.email,
          user.role,
          user.department || '',
          user.is_active ? 'Active' : 'Inactive',
          user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
          user.login_count
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `users-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success('Users exported successfully')
    } catch (error) {
      logger.error('Error exporting users', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'UserManagement',
        action: 'handleExport',
        format: 'csv'
      })
      toast.error('Failed to export users')
    }
  }

  // Handle import (placeholder)
  const handleImport = () => {
    toast('User import functionality will be available in a future update', {
      description: 'Feature Coming Soon'
    })
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-gray-900 dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Statistics */}
      <UserStatsCards stats={stats} loading={loading} />

      {/* Filters */}
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onAddNew={handleAddNew}
        onExport={handleExport}
        onImport={handleImport}
        selectedCount={selectedUsers.length}
        onBulkAction={handleBulkAction}
      />

      {/* Users Table */}
      <UserTable
        users={users}
        loading={loading}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        onResendWelcome={handleResendWelcome}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Form Dialog */}
      <UserFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setEditingUser(null)
        }}
        user={editingUser}
        onSubmit={handleSaveUser}
      />

      {/* Detail Dialog */}
      <UserDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false)
          setViewingUser(null)
        }}
        user={viewingUser}
        onEdit={handleEdit}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  )
}

// Export with React.memo for performance optimization
export const UserManagement = memo(UserManagementComponent)