/**
 * User Table Components
 * Table display with user rows and actions
 */

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Edit, 
  Trash2, 
  User,
  Eye,
  UserCheck,
  UserX,
  Check,
  Plus
} from 'lucide-react'
import { AdminUser, roleLabels } from './types'
import { formatDate, formatLastLogin, formatPermission, canDeleteUser } from './utils'

interface UserTableProps {
  users: AdminUser[]
  loading: boolean
  onEditUser: (user: AdminUser) => void
  onDeleteUser: (userId: string) => void
  onToggleStatus: (userId: string) => void
}

export function UserTable({ 
  users,
  loading, 
  onEditUser, 
  onDeleteUser, 
  onToggleStatus 
}: UserTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="rounded-xl p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </CardContent>
      </Card>
    )
  }
  
  if (users.length === 0) {
    return <EmptyState />
  }

  return (
    <Card>
      <CardContent className="rounded-xl p-0rounded-xl ">
        <div className="overflow-x-hidden">
          <div className="w-full overflow-x-auto"><table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEditUser={onEditUser}
                  onDeleteUser={onDeleteUser}
                  onToggleUserStatus={onToggleStatus}
                />
              ))}
            </tbody>
          </table></div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserRowProps {
  user: AdminUser
  onEditUser: (user: AdminUser) => void
  onDeleteUser: (userId: string) => void
  onToggleUserStatus: (userId: string) => void
}

function UserRow({ user, onEditUser, onDeleteUser, onToggleUserStatus }: UserRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-300 flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={roleLabels[user.role].color}>
          {roleLabels[user.role].label}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {user.isActive ? (
            <Badge className="bg-green-100 text-green-800">
              <UserCheck className="mr-1 h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <UserX className="mr-1 h-3 w-3" />
              Inactive
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatLastLogin(user.lastLogin)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <UserDetailsDialog user={user} />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditUser(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleUserStatus(user.id)}
          >
            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteUser(user.id)}
            disabled={!canDeleteUser(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

interface UserDetailsDialogProps {
  user: AdminUser
}

function UserDetailsDialog({ user }: UserDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label>Role</Label>
              <Badge className={roleLabels[user.role].color}>
                {roleLabels[user.role].label}
              </Badge>
            </div>
            <div>
              <Label>Status</Label>
              <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          
          <div>
            <Label>Permissions</Label>
            <div className="mt-2 space-y-1">
              {user.permissions.map(permission => (
                <div key={permission} className="flex items-center gap-2 text-sm">
                  <Check className="h-3 w-3 text-green-500" />
                  {formatPermission(permission)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="rounded-xl p-8 text-centerrounded-xl ">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-500">
          Try adjusting your search or filter criteria.
        </p>
      </CardContent>
    </Card>
  )
}