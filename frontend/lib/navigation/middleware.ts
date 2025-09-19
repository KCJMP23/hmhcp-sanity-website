import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { checkNavigationPermission } from './permissions'
import { logger } from '@/lib/logger';
import type { CMSRole } from '@/types/cms'

export type NavigationAction = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'reorder' | 'managePermissions'

/**
 * Middleware to check navigation permissions
 */
export async function withNavigationPermission(
  request: NextRequest,
  action: NavigationAction,
  handler: (request: NextRequest, params: any) => Promise<NextResponse>
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { user } = authResult

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Extract navigation ID from the request
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const navigationIdIndex = pathParts.findIndex(part => part === 'navigations') + 1
    const navigationId = pathParts[navigationIdIndex] === 'new' ? null : pathParts[navigationIdIndex]

    // For create action, navigationId should be null
    const checkId = action === 'create' ? null : navigationId

    // Map user role to CMS role
    let cmsRole: CMSRole | undefined
    if (user.role === 'admin') {
      cmsRole = 'super_admin'
    } else if (user.role === 'editor') {
      cmsRole = 'editor' 
    } else if (user.role === 'viewer') {
      cmsRole = 'viewer'
    }

    // Check permission
    const hasPermission = await checkNavigationPermission(
      user.id,
      checkId,
      action,
      cmsRole
    )

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: `You don't have permission to ${action} navigations`
        },
        { status: 403 }
      )
    }

    // Add user to request for use in handler
    ;(request as any).user = user
    ;(request as any).navigationId = navigationId

    // Call the original handler
    return await handler(request, { navigationId })
  } catch (error) {
    logger.error('Permission check error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Check if user has any navigation management permissions
 */
export async function canManageNavigations(userId: string, userRole?: string): Promise<boolean> {
  // Map user role to CMS role
  let cmsRole: CMSRole | undefined
  if (userRole === 'admin') {
    cmsRole = 'super_admin'
  } else if (userRole === 'editor') {
    cmsRole = 'editor' 
  } else if (userRole === 'viewer') {
    cmsRole = 'viewer'
  } else if (userRole === 'super_admin' || userRole === 'author' || userRole === 'contributor') {
    // Handle cases where CMS role is already provided
    cmsRole = userRole as CMSRole
  }

  if (cmsRole === 'super_admin' || cmsRole === 'editor') {
    return true
  }

  // Check if user has any navigation-specific permissions
  const hasPermission = await checkNavigationPermission(
    userId,
    null,
    'create',
    cmsRole
  )

  return hasPermission
}