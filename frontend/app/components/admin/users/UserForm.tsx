/**
 * User Form Components
 * Create and edit user dialogs with form validation
 */

'use client'

import { useState } from 'react'
import { useAdminToast } from '@/hooks/use-admin-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Check } from 'lucide-react'
import { AdminUser, roleLabels, rolePermissions } from './types'
import { validateUserForm, formatPermission } from './utils'

interface CreateUserDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateUser: (user: AdminUser) => void
}

export function CreateUserDialog({ isOpen, onOpenChange, onCreateUser }: CreateUserDialogProps) {
  const { user: userToast, form: formToast, api: apiToast } = useAdminToast()
  const [newUser, setNewUser] = useState<Partial<AdminUser>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'viewer',
    isActive: true,
    permissions: []
  })

  const handleCreateUser = async () => {
    try {
      // Validate form
      const errors = validateUserForm(newUser)
      if (errors.length > 0) {
        // Show validation error toast
        const firstError = errors[0]
        formToast.validationError(firstError)
        return
      }

      // Show loading toast
      apiToast.loading('Creating user...')

      const user: AdminUser = {
        id: Date.now().toString(),
        email: newUser.email!,
        firstName: newUser.firstName!,
        lastName: newUser.lastName!,
        role: newUser.role as AdminUser['role'],
        isActive: newUser.isActive!,
        createdAt: new Date().toISOString(),
        permissions: rolePermissions[newUser.role as keyof typeof rolePermissions]
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onCreateUser(user)
      
      // Show success toast
      userToast.created(`${user.firstName} ${user.lastName}`)
      
      onOpenChange(false)
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        role: 'viewer',
        isActive: true,
        permissions: []
      })
    } catch (error) {
      // Show error toast
      formToast.error('user', 'create', error instanceof Error ? error.message : 'Failed to create user')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new admin user with specific role and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={newUser.firstName}
                onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={newUser.lastName}
                onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john.doe@hmhcp.com"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={newUser.role} 
              onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as AdminUser['role'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-gray-50 p-3">
            <h4 className="text-sm font-medium mb-2">
              Permissions for {roleLabels[newUser.role as keyof typeof roleLabels]?.label}:
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              {rolePermissions[newUser.role as keyof typeof rolePermissions]?.map(permission => (
                <div key={permission} className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  {formatPermission(permission)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateUser}
              disabled={!newUser.firstName || !newUser.lastName || !newUser.email}
              className="rounded-full flex-1"
            >
              Create User
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface EditUserDialogProps {
  user: AdminUser | null
  onUpdateUser: (user: AdminUser) => void
  onClose: () => void
}

export function EditUserDialog({ user, onUpdateUser, onClose }: EditUserDialogProps) {
  const { user: userToast, form: formToast, api: apiToast } = useAdminToast()
  const [editingUser, setEditingUser] = useState<AdminUser | null>(user)

  if (!editingUser) return null

  const handleUpdateUser = async () => {
    try {
      // Validate form
      const errors = validateUserForm(editingUser)
      if (errors.length > 0) {
        // Show validation error toast
        const firstError = errors[0]
        formToast.validationError(firstError)
        return
      }

      // Show loading toast
      apiToast.loading('Updating user...')

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      onUpdateUser(editingUser)
      
      // Show success toast
      userToast.updated(`${editingUser.firstName} ${editingUser.lastName}`)
      
      onClose()
    } catch (error) {
      // Show error toast
      formToast.error('user', 'update', error instanceof Error ? error.message : 'Failed to update user')
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={editingUser.firstName}
                onChange={(e) => setEditingUser(prev => ({ ...prev!, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={editingUser.lastName}
                onChange={(e) => setEditingUser(prev => ({ ...prev!, lastName: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="editEmail">Email</Label>
            <Input
              id="editEmail"
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser(prev => ({ ...prev!, email: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="editRole">Role</Label>
            <Select 
              value={editingUser.role} 
              onValueChange={(value) => setEditingUser(prev => ({ ...prev!, role: value as AdminUser['role'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdateUser}
              className="rounded-full flex-1"
            >
              Update User
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}