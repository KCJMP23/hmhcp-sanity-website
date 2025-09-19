/**
 * Standardized Authentication Middleware
 * 
 * This module provides consistent authentication and authorization
 * for all admin API endpoints.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
  statusCode?: number
}

/**
 * Authenticate user and return user data
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      }
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: 'User profile not found',
        statusCode: 404
      }
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: profile.email || user.email || '',
      role: profile.role || 'viewer',
      firstName: profile.first_name,
      lastName: profile.last_name
    }

    return {
      success: true,
      user: authenticatedUser
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    }
  }
}

/**
 * Require specific role(s) for access
 */
export async function requireRole(
  request: NextRequest, 
  allowedRoles: string[]
): Promise<AuthResult> {
  const authResult = await authenticateUser(request)
  
  if (!authResult.success) {
    return authResult
  }

  const user = authResult.user!
  
  if (!allowedRoles.includes(user.role)) {
    return {
      success: false,
      error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      statusCode: 403
    }
  }

  return authResult
}

/**
 * Require admin or higher role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, ['admin', 'super_admin'])
}

/**
 * Require super admin role
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, ['super_admin'])
}

/**
 * Middleware wrapper for authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  requiredRoles?: string[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      let authResult: AuthResult
      
      if (requiredRoles) {
        authResult = await requireRole(request, requiredRoles)
      } else {
        authResult = await authenticateUser(request)
      }

      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.statusCode || 401 }
        )
      }

      // Call the handler with authenticated user
      return await handler(request, authResult.user!)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware wrapper for admin-only endpoints
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, ['admin', 'super_admin'])
}

/**
 * Middleware wrapper for super admin only endpoints
 */
export function withSuperAdminAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, ['super_admin'])
}
