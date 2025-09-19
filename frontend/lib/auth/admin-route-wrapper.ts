/**
 * Admin Route Wrapper
 * Provides secure authentication wrapper for all admin API routes
 * This ensures consistent authentication across all admin endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logging/client-safe-logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
  } | undefined
}

export interface RouteContext {
  params?: Promise<any>
}

/**
 * Verify authentication for API routes
 */
async function verifyApiAuth(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Supabase configuration missing for API auth')
      return { authenticated: false, user: null, error: 'Configuration error' }
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {}, // Not needed for verification
          remove() {}, // Not needed for verification
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return { 
        authenticated: false, 
        user: undefined, 
        error: error?.message || 'No valid session' 
      }
    }

    return { 
      authenticated: true, 
      user: {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'user'
      },
      error: undefined
    }
  } catch (error) {
    logger.error('API auth verification error:', { error })
    return { 
      authenticated: false, 
      user: undefined, 
      error: 'Authentication failed' 
    }
  }
}

/**
 * Wrap admin API route with authentication
 * Use this for all admin API endpoints
 */
export function withAdminAuth(
  handler: (request: AuthenticatedRequest, context?: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      // Verify authentication
      const { authenticated, user, error } = await verifyApiAuth(request)

      if (!authenticated) {
        logger.warn('Unauthorized admin API access attempt', {
          path: request.nextUrl?.pathname,
          error
        })

        return NextResponse.json(
          { 
            error: 'Authentication required',
            message: error || 'You must be logged in to access this resource'
          },
          { 
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer'
            }
          }
        )
      }

      // Check for admin role (optional, but recommended)
      if (user && user.role !== 'admin' && user.role !== 'super_admin') {
        logger.warn('Insufficient privileges for admin API access', {
          path: request.nextUrl?.pathname,
          userId: user.id,
          role: user.role
        })

        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: 'You do not have permission to access this resource'
          },
          { status: 403 }
        )
      }

      // Add user to request for downstream use
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      // Call the actual handler
      return handler(authenticatedRequest, context)
    } catch (error) {
      logger.error('Admin route wrapper error:', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wrap admin API route with specific role requirements
 */
export function withAdminRole(
  requiredRoles: string[],
  handler: (request: AuthenticatedRequest, context?: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      // Verify authentication
      const { authenticated, user, error } = await verifyApiAuth(request)

      if (!authenticated) {
        logger.warn('Unauthorized admin API access attempt', {
          path: request.nextUrl?.pathname,
          error
        })

        return NextResponse.json(
          { 
            error: 'Authentication required',
            message: error || 'You must be logged in to access this resource'
          },
          { 
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer'
            }
          }
        )
      }

      // Check for required role
      if (!user || !requiredRoles.includes(user.role)) {
        logger.warn('Insufficient role for admin API access', {
          path: request.nextUrl?.pathname,
          userId: user?.id,
          userRole: user?.role,
          requiredRoles
        })

        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: 'You do not have the required role to access this resource'
          },
          { status: 403 }
        )
      }

      // Add user to request for downstream use
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      // Call the actual handler
      return handler(authenticatedRequest, context)
    } catch (error) {
      logger.error('Admin role wrapper error:', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Extract user from authenticated request
 */
export function getUserFromRequest(request: AuthenticatedRequest): { id: string; email: string; role: string; } | undefined {
  return request.user || undefined
}