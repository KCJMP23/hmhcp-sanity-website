'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  Lock, 
  Unlock, 
  Mail, 
  Key,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown
} from 'lucide-react'
import { format } from 'date-fns'
import type { AdminUser, UserPagination } from './types'
import { USER_ROLES } from './types'

interface UserTableProps {
  users: AdminUser[]
  loading: boolean
  selectedUsers: string[]
  onSelectionChange: (userIds: string[]) => void
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
  onView: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
  onResetPassword: (user: AdminUser) => void
  onResendWelcome: (user: AdminUser) => void
  pagination: UserPagination
  onPageChange: (page: number) => void
}

export function UserTable({
  users,
  loading,
  selectedUsers,
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onResetPassword,
  onResendWelcome,
  pagination,
  onPageChange
}: UserTableProps) {
  const getUserRole = (roleValue: string) => {
    return USER_ROLES.find(r => r.value === roleValue) || 
      { label: roleValue, color: 'bg-gray-100 text-gray-800' }
  }

  const getStatusBadge = (user: AdminUser) => {
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      return <Badge className="bg-red-100 text-red-800 text-xs rounded-md">Locked</Badge>
    }
    if (!user.email_verified) {
      return <Badge className="bg-amber-100 text-amber-800 text-xs rounded-md">Unverified</Badge>
    }
    if (!user.is_active) {
      return <Badge className="bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 text-xs rounded-md">Active</Badge>
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(users.map(user => user.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUsers, userId])
    } else {
      onSelectionChange(selectedUsers.filter(id => id !== userId))
    }
  }

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length
  const isPartiallySelected = selectedUsers.length > 0 && selectedUsers.length < users.length

  if (loading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-sm h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No users found</p>
            <p className="text-sm text-gray-400">Create your first user account to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Users ({pagination.total})</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded-md"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-md"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userRole = getUserRole(user.role)
                const isSelected = selectedUsers.includes(user.id)
                
                return (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                      />
                    </TableCell>
                    
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate" title={user.email}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`${userRole.color} text-xs rounded-md`}>
                        {user.role === 'super_admin' && <Crown className="mr-1 h-3 w-3" />}
                        {userRole.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {user.department || 'Not assigned'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      {user.last_login ? (
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {format(new Date(user.last_login), 'MMM d, yyyy')}
                          </p>
                          <p className="text-gray-500">
                            {format(new Date(user.last_login), 'h:mm a')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.two_factor_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500">
                          {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(user)}
                          className="h-8 w-8 p-0"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                          className="h-8 w-8 p-0"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus(user)}
                          className="h-8 w-8 p-0"
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResetPassword(user)}
                          className="h-8 w-8 p-0"
                          title="Reset password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(user)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}