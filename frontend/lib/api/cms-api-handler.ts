import { NextRequest, NextResponse } from 'next/server'
import { requireCSRFToken } from '@/lib/csrf-server'
import { getCurrentAdmin, requireAdmin } from '@/lib/dal/admin-auth'
import { logger } from '@/lib/logger';

interface CMSApiHandlerOptions {
  requireAuth?: boolean
  requireRoles?: string[]
  skipCSRF?: boolean
}

type CMSApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse

/**
 * Higher-order function that wraps CMS API handlers with common middleware
 */
export function withCMSApiHandler(
  handler: CMSApiHandler,
  options: CMSApiHandlerOptions = {}
): CMSApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // Authentication check
      if (options.requireAuth !== false) {
        const admin = await getCurrentAdmin()
        
        if (!admin) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        // Role check
        if (options.requireRoles && options.requireRoles.length > 0) {
          const hasRequiredRole = options.requireRoles.some(role => 
            role === admin.role
          )
          
          if (!hasRequiredRole) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }
      }

      // CSRF protection for non-GET requests
      if (!options.skipCSRF && request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          await requireCSRFToken(request)
        } catch (error) {
          return NextResponse.json(
            { 
              error: 'Invalid CSRF token',
              message: 'Please refresh the page and try again.'
            },
            { status: 403 }
          )
        }
      }

      // Call the actual handler
      return await handler(request, context)
    } catch (error) {
      logger.error('CMS API error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('CSRF')) {
          return NextResponse.json(
            { error: 'Security validation failed' },
            { status: 403 }
          )
        }
        
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Create CMS API route handlers with built-in protection
 */
export const cmsApi = {
  // GET handler (no CSRF needed)
  get: (
    handler: CMSApiHandler,
    options?: Omit<CMSApiHandlerOptions, 'skipCSRF'>
  ) => withCMSApiHandler(handler, { ...options, skipCSRF: true }),
  
  // POST handler (CSRF required)
  post: (
    handler: CMSApiHandler,
    options?: CMSApiHandlerOptions
  ) => withCMSApiHandler(handler, options),
  
  // PUT handler (CSRF required)
  put: (
    handler: CMSApiHandler,
    options?: CMSApiHandlerOptions
  ) => withCMSApiHandler(handler, options),
  
  // PATCH handler (CSRF required)
  patch: (
    handler: CMSApiHandler,
    options?: CMSApiHandlerOptions
  ) => withCMSApiHandler(handler, options),
  
  // DELETE handler (CSRF required)
  delete: (
    handler: CMSApiHandler,
    options?: CMSApiHandlerOptions
  ) => withCMSApiHandler(handler, options),
}