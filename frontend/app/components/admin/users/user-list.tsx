/**
 * User List Component
 * Story 3.4: User Management & Role-Based Access Control
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Shield, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  title?: string;
  role?: string;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at?: string;
  locked_until?: string;
  created_at: string;
  user_roles?: Array<{
    custom_roles: {
      name: string;
      display_name: string;
    };
  }>;
}

interface UserListProps {
  onUserSelect?: (user: User) => void;
}

export function UserList({ onUserSelect }: UserListProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedDepartment !== 'all' && { department: selectedDepartment })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, selectedRole, selectedDepartment]);

  // Handle user actions
  const handleUserAction = async (action: string, userId: string) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'deactivate':
          endpoint = `/api/admin/users/${userId}/deactivate`;
          break;
        case 'activate':
          endpoint = `/api/admin/users/${userId}/activate`;
          break;
        case 'unlock':
          endpoint = `/api/admin/users/${userId}/unlock`;
          break;
        case 'reset-password':
          endpoint = `/api/admin/users/${userId}/reset-password`;
          break;
        case 'delete':
          endpoint = `/api/admin/users/${userId}`;
          method = 'DELETE';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      toast.success(`User ${action} successful`);
      fetchUsers();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: action,
          items: selectedUsers.map(id => ({ id }))
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to perform bulk ${action}`);
      }

      const result = await response.json();
      toast.success(`Bulk ${action} completed: ${result.success_count} succeeded, ${result.error_count} failed`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  // Export users
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedDepartment !== 'all' && { department: selectedDepartment })
      });

      const response = await fetch(`/api/admin/users/export?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const getUserRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'editor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">User Management</h2>
          <Badge variant="outline">{pagination.total} users</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchUsers()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with role assignments.
                </DialogDescription>
              </DialogHeader>
              {/* Create user form would go here */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedUsers.length} selected</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkAction('activate')}
          >
            Activate
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkAction('deactivate')}
          >
            Deactivate
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkAction('unlock')}
          >
            Unlock
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleBulkAction('delete')}
          >
            Delete
          </Button>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUsers(users.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow 
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => onUserSelect?.(user)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'Unnamed User'}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.title && (
                        <div className="text-sm text-muted-foreground">{user.title}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.user_roles?.[0]?.custom_roles ? (
                      <Badge variant={getUserRoleBadgeColor(user.user_roles[0].custom_roles.name)}>
                        {user.user_roles[0].custom_roles.display_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No Role</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                      {user.locked_until && new Date(user.locked_until) > new Date() && (
                        <Badge variant="warning">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                      {user.mfa_enabled && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          2FA
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at 
                      ? format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm')
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        {user.locked_until && new Date(user.locked_until) > new Date() && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction('unlock', user.id)}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock Account
                          </DropdownMenuItem>
                        )}
                        {user.is_active ? (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction('deactivate', user.id)}
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction('activate', user.id)}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleUserAction('delete', user.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}