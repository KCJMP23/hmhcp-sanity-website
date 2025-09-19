/**
 * API Authentication utilities for AI Workflow Management
 * Provides Bearer token validation and user context extraction
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { logger } from '@/lib/logger'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  organizationId: string
  permissions: string[]
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
}

/**
 * Extract and validate Bearer token from request headers
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove "Bearer " prefix
}

/**
 * Validate JWT token and extract user information
 */
export async function validateToken(token: string): Promise<AuthResult> {
  try {
    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      logger.warn('Token validation failed', { error: authError?.message })
      return {
        success: false,
        error: authError?.message || 'Invalid token'
      }
    }

    // Get user organization and role
    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from('user_organizations')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      logger.warn('User organization not found', { userId: user.id, error: orgError?.message })
      return {
        success: false,
        error: 'User organization not found'
      }
    }

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'admin': ['read', 'write', 'delete', 'execute', 'manage_users'],
      'editor': ['read', 'write', 'execute'],
      'viewer': ['read']
    }

    const permissions = rolePermissions[userOrg.role] || ['read']

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: userOrg.role,
        organizationId: userOrg.organization_id,
        permissions
      }
    }
  } catch (error) {
    logger.error('Token validation error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Authenticate request and return user context
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = extractBearerToken(request)
  
  if (!token) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header'
    }
  }
  
  return validateToken(token)
}

/**
 * Check if user has required permission
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.permissions.includes(permission)
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.some(permission => user.permissions.includes(permission))
}

/**
 * Require specific permission - throws if not authorized
 */
export function requirePermission(user: AuthenticatedUser, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`)
  }
}

/**
 * Create standardized authentication error response
 */
export function createAuthErrorResponse(message: string, status: number = 401) {
  return {
    error: message,
    timestamp: new Date().toISOString(),
    code: 'AUTH_ERROR'
  }
}

/**
 * Middleware function to validate authentication for API routes
 */
export async function requireAuth(request: NextRequest): Promise<{
  success: boolean
  user?: AuthenticatedUser
  errorResponse?: any
}> {
  const authResult = await authenticateRequest(request)
  
  if (!authResult.success) {
    return {
      success: false,
      errorResponse: createAuthErrorResponse(authResult.error || 'Authentication failed')
    }
  }
  
  return {
    success: true,
    user: authResult.user
  }
}

/**
 * Log authentication events for audit trail
 */
export function logAuthEvent(
  type: 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'PERMISSION_CHECK',
  user: AuthenticatedUser | null,
  request: NextRequest,
  details?: any
): void {
  logger.info('Authentication event', {
    type,
    userId: user?.id,
    userRole: user?.role,
    organizationId: user?.organizationId,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    details,
    timestamp: new Date().toISOString()
  })
}

/**
 * Rate limiting by user ID
 */
export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
}

const userRateLimits = new Map<string, {
  count: number
  windowStart: number
}>()

export function checkRateLimit(
  userId: string,
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
): RateLimitResult {
  const now = Date.now()
  const userLimit = userRateLimits.get(userId)
  
  if (!userLimit || now - userLimit.windowStart > windowMs) {
    // Reset or initialize rate limit window
    userRateLimits.set(userId, {
      count: 1,
      windowStart: now
    })
    
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    }
  }
  
  userLimit.count++
  
  return {
    allowed: userLimit.count <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - userLimit.count),
    resetTime: userLimit.windowStart + windowMs
  }
}

// Export for type definitions
export type { AuthenticatedUser, AuthResult }