'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  MapPin, 
  Clock, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Crown,
  Lock,
  Unlock
} from 'lucide-react'
import { format } from 'date-fns'
import type { AdminUser } from './types'
import { USER_ROLES } from './types'

interface UserDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  user: AdminUser | null
  onEdit: (user: AdminUser) => void
  onResetPassword: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
}

export function UserDetailDialog({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onToggleStatus
}: UserDetailDialogProps) {
  if (!user) return null

  const userRole = USER_ROLES.find(r => r.value === user.role)
  const isLocked = user.account_locked_until && new Date(user.account_locked_until) > new Date()
  const isActive = user.is_active && !isLocked

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this user account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Overview */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {userRole && (
                  <Badge className={`${userRole.color} text-xs`}>
                    {user.role === 'super_admin' && <Crown className="mr-1 h-3 w-3" />}
                    {userRole.label}
                  </Badge>
                )}
                {isActive ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : isLocked ? (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    <Lock className="mr-1 h-3 w-3" />
                    Locked
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactive
                  </Badge>
                )}
                {user.email_verified ? (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Role & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userRole && (
                    <div>
                      <Badge className={`${userRole.color} mb-2`}>
                        {userRole.label}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        {userRole.permissions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">
                    {user.department || 'Not assigned'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Account Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">
                    {format(new Date(user.created_at), 'PPP')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(user.created_at), 'p')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Last Login
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.last_login ? (
                    <>
                      <p className="text-sm text-gray-900">
                        {format(new Date(user.last_login), 'PPP')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(user.last_login), 'p')}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Never logged in</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Security Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Security & Access</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Key className="mr-2 h-4 w-4" />
                    Two-Factor Auth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {user.two_factor_enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Login Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900">
                    {user.login_count}
                  </p>
                  <p className="text-xs text-gray-500">Total logins</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-red-600">
                    {user.failed_login_attempts}
                  </p>
                  <p className="text-xs text-gray-500">Since last success</p>
                </CardContent>
              </Card>
            </div>

            {isLocked && (
              <Card className="mt-4 border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Account Locked</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    This account is locked until {format(new Date(user.account_locked_until!), 'PPp')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-medium mb-4">Permissions</h3>
            <div className="grid gap-2 md:grid-cols-3">
              {user.permissions.map(permission => {
                const [category, action] = permission.split('.')
                return (
                  <div
                    key={permission}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-full"
                  >
                    <Shield className="h-3 w-3 text-gray-500" />
                    <span className="text-sm">
                      <span className="font-medium capitalize">{category}</span>
                      <span className="text-gray-500 ml-1">
                        {action.replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
            {user.permissions.length === 0 && (
              <p className="text-sm text-gray-500 italic">No specific permissions assigned</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onResetPassword(user)}
                className="rounded-lg"
              >
                <Key className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <Button
                variant="outline"
                onClick={() => onToggleStatus(user)}
                className="rounded-lg"
              >
                {isActive ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-full">
                Close
              </Button>
              <Button onClick={() => onEdit(user)} className="rounded-lg">
                Edit User
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}