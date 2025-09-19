'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Shield, Mail, User, Settings, AlertCircle } from 'lucide-react'
import type { AdminUser, UserFormData } from './types'
import { USER_ROLES, ALL_PERMISSIONS, DEPARTMENTS } from './types'

interface UserFormDialogProps {
  isOpen: boolean
  onClose: () => void
  user?: AdminUser | null
  onSubmit: (data: UserFormData) => Promise<void>
}

export function UserFormDialog({
  isOpen,
  onClose,
  user,
  onSubmit
}: UserFormDialogProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    department: '',
    permissions: [],
    is_active: true,
    email_verified: false,
    send_welcome_email: true,
    temporary_password: ''
  })
  const [passwordGenerated, setPasswordGenerated] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department || '',
        permissions: user.permissions,
        is_active: user.is_active,
        email_verified: user.email_verified,
        send_welcome_email: false,
        temporary_password: ''
      })
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        department: '',
        permissions: [],
        is_active: true,
        email_verified: false,
        send_welcome_email: true,
        temporary_password: ''
      })
    }
    setPasswordGenerated(false)
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    onClose()
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, temporary_password: password }))
    setPasswordGenerated(true)
  }

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case 'super_admin':
        return ALL_PERMISSIONS
      case 'admin':
        return ALL_PERMISSIONS.filter(p => !p.includes('backup'))
      case 'editor':
        return ALL_PERMISSIONS.filter(p => 
          p.includes('content') || p.includes('media') || p.includes('seo')
        )
      case 'author':
        return ['content.view', 'content.create', 'content.edit', 'media.view', 'media.upload']
      case 'contributor':
        return ['content.view', 'content.create', 'media.view']
      case 'viewer':
        return ['content.view', 'media.view']
      default:
        return []
    }
  }

  const handleRoleChange = (newRole: string) => {
    const defaultPermissions = getDefaultPermissions(newRole)
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: [...defaultPermissions]
    }))
  }

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }))
  }

  const selectedRole = USER_ROLES.find(r => r.value === formData.role)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {user ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {user ? 'Update user details and permissions' : 'Create a new user account with appropriate role and permissions'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="role">Role & Access</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Department</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!user && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="temporary_password">Temporary Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="temporary_password"
                        type="text"
                        value={formData.temporary_password}
                        onChange={(e) => setFormData(prev => ({ ...prev, temporary_password: e.target.value }))}
                        placeholder="Leave empty to generate automatically"
                        className="rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePassword}
                        className="rounded-full"
                      >
                        Generate
                      </Button>
                    </div>
                    {passwordGenerated && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Password generated. Make sure to copy it before saving.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="send_welcome_email"
                      checked={formData.send_welcome_email}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_welcome_email: checked }))}
                    />
                    <Label htmlFor="send_welcome_email">Send welcome email with login instructions</Label>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="role" className="space-y-4">
              <div>
                <Label htmlFor="role">User Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {role.value === 'super_admin' && <Shield className="h-4 w-4" />}
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRole.permissions}
                  </p>
                )}
              </div>

              {selectedRole && (
                <div className="p-4 bg-gray-50 rounded-full">
                  <h4 className="font-medium text-gray-900 mb-2">Role Information</h4>
                  <Badge className={`${selectedRole.color} mb-2`}>
                    {selectedRole.label}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {selectedRole.permissions}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Account is active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="email_verified"
                    checked={formData.email_verified}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_verified: checked }))}
                  />
                  <Label htmlFor="email_verified">Email is verified</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Custom Permissions</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Customize specific permissions for this user. Changes here will override role defaults.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {ALL_PERMISSIONS.map(permission => {
                    const [category, action] = permission.split('.')
                    const isChecked = formData.permissions.includes(permission)
                    
                    return (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={isChecked}
                          onCheckedChange={(checked) => handlePermissionToggle(permission, !!checked)}
                        />
                        <Label 
                          htmlFor={permission}
                          className="text-sm cursor-pointer"
                        >
                          <span className="font-medium capitalize">{category}</span>
                          <span className="text-gray-500 ml-1">
                            {action.replace('_', ' ')}
                          </span>
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Security Settings</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Additional security features will be available after the user account is created.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Two-Factor Authentication</h5>
                    <p className="text-sm text-gray-500">Require 2FA for account access</p>
                  </div>
                  <Badge variant="outline">Configurable after creation</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Session Management</h5>
                    <p className="text-sm text-gray-500">Control active sessions and timeouts</p>
                  </div>
                  <Badge variant="outline">Automatic</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Login Monitoring</h5>
                    <p className="text-sm text-gray-500">Track login attempts and locations</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" className="rounded-full">
              {user ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}