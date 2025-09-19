'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  full_name: string
  cms_role: string
}

interface NavigationPermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
  publish: boolean
  reorder: boolean
  managePermissions: boolean
}

interface BulkPermissionAssignmentProps {
  navigationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const defaultPermissions: NavigationPermissions = {
  create: false,
  read: true,
  update: false,
  delete: false,
  publish: false,
  reorder: false,
  managePermissions: false
}

export function BulkPermissionAssignment({
  navigationId,
  isOpen,
  onClose,
  onSuccess
}: BulkPermissionAssignmentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<NavigationPermissions>(defaultPermissions)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const { toast } = useToast()

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Failed to search users')
      const data = await response.json()
      setSearchResults(data.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive'
      })
    } finally {
      setSearching(false)
    }
  }

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const togglePermission = (key: keyof NavigationPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const selectAllFromSearch = () => {
    const notSelected = searchResults.filter(user => 
      !selectedUsers.some(selected => selected.id === user.id)
    )
    setSelectedUsers(prev => [...prev, ...notSelected])
  }

  const clearSelection = () => {
    setSelectedUsers([])
  }

  const assignPermissions = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const assignments = selectedUsers.map(user =>
        fetch(`/api/admin/navigations/${navigationId}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            permissions
          })
        })
      )

      const results = await Promise.allSettled(assignments)
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.length - successful

      if (successful > 0) {
        toast({
          title: 'Success',
          description: `Permissions granted to ${successful} user${successful > 1 ? 's' : ''}`
        })
      }
      if (failed > 0) {
        toast({
          title: 'Error',
          description: `Failed to grant permissions to ${failed} user${failed > 1 ? 's' : ''}`,
          variant: 'destructive'
        })
      }

      if (successful > 0) {
        onSuccess()
        resetForm()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign permissions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedUsers([])
    setPermissions(defaultPermissions)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bulk Permission Assignment
                </CardTitle>
                <CardDescription>
                  Grant navigation permissions to multiple users at once
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Search */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-search">Search Users</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="user-search"
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  />
                  <Button onClick={searchUsers} disabled={searching}>
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Search Results ({searchResults.length})</Label>
                    <Button variant="outline" size="sm" onClick={selectAllFromSearch}>
                      Select All
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 border p-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
                        onClick={() => toggleUserSelection(user)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedUsers.some(u => u.id === user.id)}
                            onChange={() => toggleUserSelection(user)}
                          />
                          <div>
                            <p className="font-medium text-sm">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {user.cms_role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Selected Users ({selectedUsers.length})</Label>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto flex flex-wrap gap-2 border p-2">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleUserSelection(user)}
                    >
                      {user.full_name} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Permission Configuration */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Permissions to Grant</Label>
                <p className="text-sm text-muted-foreground">
                  Configure which permissions to grant to all selected users
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label 
                      htmlFor={`perm-${key}`} 
                      className="capitalize cursor-pointer"
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Switch
                      id={`perm-${key}`}
                      checked={value}
                      onCheckedChange={() => togglePermission(key as keyof NavigationPermissions)}
                    />
                  </div>
                ))}
              </div>

              {/* Permission Summary */}
              <div className="p-3 bg-muted">
                <p className="text-sm font-medium mb-2">Permission Summary:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} variant="default" className="text-xs">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))
                  }
                  {Object.values(permissions).every(v => !v) && (
                    <span className="text-xs text-muted-foreground">
                      No permissions selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={assignPermissions}
                disabled={loading || selectedUsers.length === 0}
              >
                {loading ? (
                  'Assigning...'
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Assign to {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}