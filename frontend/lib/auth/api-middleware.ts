/**
 * API Route Authentication Middleware
 * Provides authentication and authorization for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession, requireRole } from '@/lib/auth/authentication-service'
import { logger } from '@/lib/logging/client-safe-logger'

/**
 * Authentication middleware wrapper for API routes
 * Ensures user is authenticated before proceeding
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Check if req is valid
      if (!req || !req.nextUrl) {
        logger.error('Invalid request object in withAuth middleware', { req })
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }

      const { user, error } = await verifySession()

      if (error || !user) {
        logger.warn('Unauthorized API access attempt', {
          path: req.nextUrl?.pathname || 'unknown',
          error
        })

        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Add user to request headers for downstream handlers
      const headers = new Headers(req.headers)
      headers.set('x-user-id', user.id)
      headers.set('x-user-email', user.email)
      headers.set('x-user-role', user.role)

      // Create new request with user headers
      const authenticatedReq = new NextRequest(req, { headers })

      // Call the actual handler
      return handler(authenticatedReq, context)
    } catch (error) {
      logger.error('Auth middleware error', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Role-based authorization middleware
 * Ensures user has required role(s) before proceeding
 */
export function withRole(
  allowedRoles: string[],
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Check if req is valid
      if (!req || !req.nextUrl) {
        logger.error('Invalid request object in withRole middleware', { req })
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }

      const { authorized, user, error } = await requireRole(allowedRoles)

      if (!authorized || error) {
        logger.warn('Insufficient privileges for API access', {
          path: req.nextUrl?.pathname || 'unknown',
          error,
          requiredRoles: allowedRoles
        })

        const status = error?.includes('Authentication') ? 401 : 403

        return NextResponse.json(
          { error: error || 'Insufficient privileges' },
          { status }
        )
      }

      // Add user to request headers
      const headers = new Headers(req.headers)
      headers.set('x-user-id', user.id)
      headers.set('x-user-email', user.email)
      headers.set('x-user-role', user.role)

      // Create new request with user headers
      const authenticatedReq = new NextRequest(req, { headers })

      // Call the actual handler
      return handler(authenticatedReq, context)
    } catch (error) {
      logger.error('Role middleware error', { error })
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
export function getUserFromRequest(req: NextRequest) {
  return {
    id: req.headers.get('x-user-id'),
    email: req.headers.get('x-user-email'),
    role: req.headers.get('x-user-role')
  }
}

/**
 * Rate limiting middleware for API routes
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  limit: number = 100,
  windowMs: number = 60000, // 1 minute
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    // Check if req is valid
    if (!req || !req.headers || !req.nextUrl) {
      logger.error('Invalid request object in withRateLimit middleware', { req })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Get client identifier (IP or user ID)
    const identifier = req.headers.get('x-user-id') || 
                      req.headers.get('x-forwarded-for') || 
                      req.ip || 
                      'anonymous'

    const now = Date.now()
    const key = `${identifier}:${req.nextUrl.pathname}`
    
    // Get or create rate limit entry
    let rateLimit = rateLimitMap.get(key)
    
    if (!rateLimit || rateLimit.resetTime < now) {
      rateLimit = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    rateLimit.count++
    rateLimitMap.set(key, rateLimit)

    // Check if rate limit exceeded
    if (rateLimit.count > limit) {
      const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000)
      
      logger.warn('Rate limit exceeded', {
        path: req.nextUrl.pathname,
        identifier,
        count: rateLimit.count,
        limit
      })

      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      )
    }

    // Add rate limit headers to response
    const response = await handler(req, context)
    
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', (limit - rateLimit.count).toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())

    return response
  }
}

/**
 * Combine multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc)
    }, handler)
  }
}

/**
 * CORS middleware for API routes
 */
export function withCORS(
  allowedOrigins: string[] = ['*'],
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const origin = req.headers.get('origin') || ''
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes('*') || 
                      allowedOrigins.includes(origin)

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : '',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      })
    }

    // Process request
    const response = await handler(req, context)

    // Add CORS headers
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
  }
}

/**
 * Input validation middleware
 */
export function withValidation(
  schema: any, // Use a validation library like Zod or Yup
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      let body
      
      // Parse request body if present
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        try {
          body = await req.json()
        } catch {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }
      }

      // Validate against schema if provided
      if (schema && body) {
        try {
          // This is a placeholder - integrate with your validation library
          // For example, with Zod: schema.parse(body)
          // For now, just pass through
        } catch (validationError: any) {
          return NextResponse.json(
            { 
              error: 'Validation failed',
              details: validationError.errors || validationError.message
            },
            { status: 400 }
          )
        }
      }

      return handler(req, context)
    } catch (error) {
      logger.error('Validation middleware error', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Export functions for backward compatibility
export const validateSession = async (req: NextRequest) => {
  // Placeholder for session validation
  return { user: null, error: null };
};