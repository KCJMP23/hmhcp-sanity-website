'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, UserPlus, Shield, Users } from 'lucide-react'
// Removed sonner dependency - using console.log for notifications
import { BulkPermissionAssignment } from './BulkPermissionAssignment'
import { logger } from '@/lib/logger';

interface NavigationPermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
  publish: boolean
  reorder: boolean
  managePermissions: boolean
}

interface User {
  id: string
  email: string
  full_name: string
  cms_role: string
}

interface UserPermission {
  userId: string
  user: {
    email: string
    full_name: string
  }
  permissions: NavigationPermissions
  grantedBy: string
  grantedAt: Date
}

interface NavigationPermissionsProps {
  navigationId: string
  navigationName: string
}

export function NavigationPermissions({
  navigationId,
  navigationName
}: NavigationPermissionsProps) {
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showBulkAssignment, setShowBulkAssignment] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)

  // Fetch current permissions and user info
  useEffect(() => {
    fetchPermissions()
    fetchCurrentUser()
  }, [navigationId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser({ id: userData.id, role: userData.cms_role })
      }
    } catch (error) {
      logger.error('Failed to fetch current user:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/admin/navigations/${navigationId}/permissions`)
      if (!response.ok) throw new Error('Failed to fetch permissions')
      const data = await response.json()
      setPermissions(data.data || [])
    } catch (error) {
      console.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  // Search users
  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Failed to search users')
      const data = await response.json()
      setSearchResults(data.data || [])
    } catch (error) {
      console.error('Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  // Grant permissions
  const grantPermissions = async (userId: string, newPermissions: Partial<NavigationPermissions>) => {
    try {
      const response = await fetch(`/api/admin/navigations/${navigationId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          permissions: newPermissions
        })
      })

      if (!response.ok) throw new Error('Failed to grant permissions')
      
      console.log('Permissions granted successfully')
      fetchPermissions()
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Failed to grant permissions')
    }
  }

  // Update permissions
  const updatePermissions = async (userId: string, updatedPermissions: NavigationPermissions) => {
    try {
      const response = await fetch(`/api/admin/navigations/${navigationId}/permissions/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions })
      })

      if (!response.ok) throw new Error('Failed to update permissions')
      
      console.log('Permissions updated successfully')
      fetchPermissions()
    } catch (error) {
      console.error('Failed to update permissions')
    }
  }

  // Revoke permissions
  const revokePermissions = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/navigations/${navigationId}/permissions/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to revoke permissions')
      
      console.log('Permissions revoked successfully')
      fetchPermissions()
    } catch (error) {
      console.error('Failed to revoke permissions')
    }
  }

  const canManagePermissions = currentUser?.role === 'super_admin' || 
    permissions.find(p => p.userId === currentUser?.id)?.permissions.managePermissions

  if (!canManagePermissions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            You don't have permission to manage navigation permissions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Grant Permissions
          </CardTitle>
          <CardDescription>
            Search for users to grant navigation permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkAssignment(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Bulk Assign
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="secondary">{user.cms_role}</Badge>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="mt-4 p-4 border">
              <h4 className="font-medium mb-3">
                Grant permissions to {selectedUser.full_name}
              </h4>
              <PermissionToggles
                permissions={{
                  create: false,
                  read: true,
                  update: false,
                  delete: false,
                  publish: false,
                  reorder: false,
                  managePermissions: false
                }}
                onChange={(newPermissions) => grantPermissions(selectedUser.id, newPermissions)}
                onCancel={() => setSelectedUser(null)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Permissions
          </CardTitle>
          <CardDescription>
            Users with special permissions for this navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading permissions...</p>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No special permissions granted. Default role permissions apply.
            </p>
          ) : (
            <div className="space-y-4">
              {permissions.map((permission) => (
                <div key={permission.userId} className="border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{permission.user.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {permission.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Granted {new Date(permission.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokePermissions(permission.userId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <PermissionBadges
                    permissions={permission.permissions}
                    onChange={(updated) => updatePermissions(permission.userId, updated)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Permission Assignment Modal */}
      <BulkPermissionAssignment
        navigationId={navigationId}
        isOpen={showBulkAssignment}
        onClose={() => setShowBulkAssignment(false)}
        onSuccess={() => {
          setShowBulkAssignment(false)
          fetchPermissions()
        }}
      />
    </div>
  )
}

function PermissionToggles({
  permissions,
  onChange,
  onCancel
}: {
  permissions: NavigationPermissions
  onChange: (permissions: NavigationPermissions) => void
  onCancel: () => void
}) {
  const [localPermissions, setLocalPermissions] = useState(permissions)

  const togglePermission = (key: keyof NavigationPermissions) => {
    setLocalPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-3">
      {Object.entries(localPermissions).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <Label htmlFor={key} className="capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </Label>
          <Switch
            id={key}
            checked={value}
            onCheckedChange={() => togglePermission(key as keyof NavigationPermissions)}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-3">
        <Button onClick={() => onChange(localPermissions)}>
          Grant Permissions
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function PermissionBadges({
  permissions,
  onChange
}: {
  permissions: NavigationPermissions
  onChange: (permissions: NavigationPermissions) => void
}) {
  const togglePermission = (key: keyof NavigationPermissions) => {
    onChange({
      ...permissions,
      [key]: !permissions[key]
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(permissions).map(([key, value]) => (
        <Badge
          key={key}
          variant={value ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => togglePermission(key as keyof NavigationPermissions)}
        >
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </Badge>
      ))}
    </div>
  )
}