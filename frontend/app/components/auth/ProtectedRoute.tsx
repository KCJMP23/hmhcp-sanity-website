'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { AdminLoadingOverlay } from '@/components/admin/ui/loading/AdminLoadingOverlay'
import { AdminAlert } from '@/components/admin/ui/notifications/AdminAlert'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  fallbackUrl?: string
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallbackUrl = '/admin/login',
  requireAuth = true
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { checkPermission } = usePermissions()

  useEffect(() => {
    if (!authLoading) {
      // Check authentication
      if (requireAuth && !user) {
        router.push(fallbackUrl)
        return
      }

      // Check permission if specified
      if (requiredPermission && !checkPermission(requiredPermission)) {
        router.push('/admin/unauthorized')
        return
      }
    }
  }, [authLoading, user, requiredPermission, checkPermission, router, fallbackUrl, requireAuth])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <AdminLoadingOverlay 
        message="Checking authentication..." 
      />
    )
  }

  // Show unauthorized if no user and auth is required
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AdminAlert
          type="error"
          title="Authentication Required"
          message="Please log in to access this page."
        />
      </div>
    )
  }

  // Show permission denied if permission check fails
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AdminAlert
          type="warning"
          title="Permission Denied"
          message="You don't have permission to access this page."
        />
      </div>
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}