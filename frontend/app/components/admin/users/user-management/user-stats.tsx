'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  UserCheck, 
  Shield, 
  ShieldCheck, 
  Crown, 
  UserX, 
  AlertCircle, 
  Mail,
  Lock
} from 'lucide-react'
import type { UserStats } from './types'

interface UserStatsProps {
  stats: UserStats | null
  loading: boolean
}

export function UserStatsCards({ stats, loading }: UserStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gray-300 h-8 w-12 rounded animate-pulse" />
              <p className="text-xs text-muted-foreground mt-1">
                <span className="bg-gray-300 h-3 w-20 rounded animate-pulse inline-block" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_users}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active_users} active
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
          <p className="text-xs text-muted-foreground">
            {stats.recent_logins} recent logins
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.super_admins}</div>
          <p className="text-xs text-muted-foreground">
            Super admin accounts
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Team</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.editors + stats.authors + stats.contributors}
          </div>
          <p className="text-xs text-muted-foreground">
            Editors, authors & contributors
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.locked_accounts}</div>
          <p className="text-xs text-muted-foreground">
            Security restrictions
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unverified</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{stats.unverified_emails}</div>
          <p className="text-xs text-muted-foreground">
            Pending email verification
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Editors</CardTitle>
          <Crown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">{stats.editors}</div>
          <p className="text-xs text-muted-foreground">
            Content editors
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Viewers</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{stats.viewers}</div>
          <p className="text-xs text-muted-foreground">
            Read-only access
          </p>
        </CardContent>
      </Card>
    </div>
  )
}