/**
 * Enhanced Authentication Middleware
 * Advanced role-based access control with healthcare permissions
 * 
 * Story 1.6 Task 2: Enhanced Permission Checks
 * Integrates with healthcare role manager and permission system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import crypto from 'crypto'
import {
  HealthcareRole,
  Permission,
  RoleAssignmentService
} from './healthcare-role-manager'
import {
  PermissionManagementService,
  PermissionContext,
  AccessRequest,
  checkEnhancedPermission
} from './permission-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Enhanced user interface with healthcare context
export interface EnhancedAuthenticatedUser {
  id: string
  email: string
  role: HealthcareRole
  permissions: Permission[]
  healthcare_context?: {
    department?: string
    license_number?: string
    specialization?: string[]
    clearance_level?: string
  }
  session_expires_at?: string
  mfa_verified: boolean
  is_active: boolean
}

export interface EnhancedSecurityContext {
  user: EnhancedAuthenticatedUser | null
  requestId: string
  clientIp: string
  userAgent: string
  timestamp: string
  resource?: string
  action?: string
}

export interface EnhancedSecurityOptions {
  requiredPermission?: Permission
  requiredRole?: HealthcareRole
  resource?: string
  action?: string
  requireMFA?: boolean
  requireHealthcareContext?: boolean
  allowedClearanceLevels?: string[]
  timeRestrictions?: boolean
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
  auditLevel?: 'low' | 'medium' | 'high'
}

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Extract client IP from request with multiple fallbacks
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  return cfConnectingIp || forwarded?.split(',')[0] || realIp || 'unknown'
}

/**
 * Enhanced rate limiting with user context
 */
async function checkEnhancedRateLimit(
  request: NextRequest,
  context: EnhancedSecurityContext,
  config: { windowMs: number; maxRequests: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Create composite key with IP and user ID for authenticated requests
  const key = context.user ? `${context.clientIp}:${context.user.id}` : context.clientIp
  const now = Date.now()
  
  const limiter = rateLimitStore.get(key)
  
  if (!limiter || limiter.resetTime < now) {
    // Create new window
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime }
  }
  
  if (limiter.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: limiter.resetTime }
  }
  
  limiter.count++
  return { 
    allowed: true, 
    remaining: config.maxRequests - limiter.count, 
    resetTime: limiter.resetTime 
  }
}

/**
 * Enhanced authentication with healthcare role context
 */
export async function authenticateEnhancedRequest(request: NextRequest): Promise<{
  user: EnhancedAuthenticatedUser | null
  error: string | null
}> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization token provided' }
    }
    
    const token = authHeader.substring(7)
    
    // Verify token with Supabase
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }
    
    // Get user's role and permissions from role assignment service
    const userRole = await RoleAssignmentService.getUserRole(user.id)
    
    if (!userRole.role) {
      return { user: null, error: 'User has no assigned role' }
    }
    
    // Get user profile and session info
    const { data: profile } = await supabase
      .from('enterprise_users')
      .select('name, is_active, last_login')
      .eq('supabase_user_id', user.id)
      .single()
    
    // Check if user is active
    if (profile && !profile.is_active) {
      return { user: null, error: 'User account is deactivated' }
    }
    
    // Get MFA status
    const { data: mfaData } = await supabase
      .from('user_mfa_settings')
      .select('is_enabled, verified_at')
      .eq('user_id', user.id)
      .single()
    
    const mfaVerified = mfaData?.is_enabled ? 
      (mfaData.verified_at && new Date(mfaData.verified_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) :
      true // If MFA not enabled, consider verified
    
    const authenticatedUser: EnhancedAuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      role: userRole.role,
      permissions: userRole.permissions,
      healthcare_context: userRole.assignment?.healthcare_context,
      session_expires_at: userRole.assignment?.expires_at,
      mfa_verified: Boolean(mfaVerified),
      is_active: profile?.is_active !== false
    }
    
    return { user: authenticatedUser, error: null }
    
  } catch (error) {
    logger.error('Enhanced authentication error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * Check if user has required healthcare clearance
 */
function checkHealthcareClearance(
  user: EnhancedAuthenticatedUser,
  allowedLevels?: string[]
): boolean {
  if (!allowedLevels) return true
  
  const userLevel = user.healthcare_context?.clearance_level
  if (!userLevel) return false
  
  const levelHierarchy = ['basic', 'standard', 'elevated', 'critical']
  const userLevelIndex = levelHierarchy.indexOf(userLevel)
  
  return allowedLevels.some(level => {
    const requiredIndex = levelHierarchy.indexOf(level)
    return userLevelIndex >= requiredIndex
  })
}

/**
 * Check time-based restrictions
 */
function checkTimeRestrictions(user: EnhancedAuthenticatedUser): boolean {
  // Critical clearance users can access anytime
  if (user.healthcare_context?.clearance_level === 'critical') {
    return true
  }
  
  // System admins and medical officers can access anytime
  const alwaysAllowedRoles = [
    HealthcareRole.SYSTEM_ADMIN,
    HealthcareRole.CHIEF_MEDICAL_OFFICER,
    HealthcareRole.MEDICAL_DIRECTOR
  ]
  
  if (alwaysAllowedRoles.includes(user.role)) {
    return true
  }
  
  // Regular users: business hours only (6 AM - 10 PM)
  const now = new Date()
  const hour = now.getHours()
  return hour >= 6 && hour <= 22
}

/**
 * Create enhanced security context
 */
export function createEnhancedSecurityContext(
  request: NextRequest,
  user: EnhancedAuthenticatedUser | null,
  resource?: string,
  action?: string
): EnhancedSecurityContext {
  return {
    user,
    requestId: crypto.randomUUID(),
    clientIp: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    resource,
    action
  }
}

/**
 * Enhanced audit logging
 */
export async function auditEnhancedLog(
  context: EnhancedSecurityContext,
  action: string,
  result: 'success' | 'failure' | 'unauthorized' | 'forbidden' | 'mfa_required',
  details?: Record<string, any>
): Promise<void> {
  const logEntry = {
    timestamp: context.timestamp,
    requestId: context.requestId,
    userId: context.user?.id || 'anonymous',
    userEmail: context.user?.email,
    userRole: context.user?.role,
    action,
    result,
    resource: context.resource,
    actionType: context.action,
    clientIp: context.clientIp,
    userAgent: context.userAgent,
    healthcare_context: context.user?.healthcare_context,
    mfa_verified: context.user?.mfa_verified,
    details
  }
  
  // Log to winston
  const logLevel = result === 'success' ? 'info' : 'warn'
  logger[logLevel]('Enhanced audit log', logEntry)
  
  // Log to database for compliance
  try {
    const supabase = createClient()
    await supabase.from('audit_logs').insert({
      user_id: context.user?.id || null,
      action: `enhanced_${action}`,
      resource_type: context.resource || 'unknown',
      details: {
        ...logEntry,
        compliance_level: 'hipaa',
        audit_type: 'enhanced_rbac'
      },
      ip_address: context.clientIp,
      user_agent: context.userAgent,
      created_at: context.timestamp
    })
  } catch (error) {
    logger.error('Failed to write enhanced audit log to database', { error, logEntry })
  }
}

/**
 * Enhanced security middleware wrapper for API routes
 */
export function withEnhancedSecurity(
  handler: (request: NextRequest, context: EnhancedSecurityContext) => Promise<NextResponse>,
  options: EnhancedSecurityOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    
    // Create initial context
    const context = createEnhancedSecurityContext(
      request, 
      null, 
      options.resource, 
      options.action
    )
    
    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResult = await checkEnhancedRateLimit(request, context, options.rateLimit)
        if (!rateLimitResult.allowed) {
          await auditEnhancedLog(context, request.method, 'failure', {
            reason: 'rate_limit_exceeded',
            limit: options.rateLimit.maxRequests,
            window: options.rateLimit.windowMs
          })
          
          return NextResponse.json(
            { error: 'Too many requests' },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': options.rateLimit.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
              }
            }
          )
        }
      }
      
      // Authenticate user
      const { user: authenticatedUser, error } = await authenticateEnhancedRequest(request)
      if (error || !authenticatedUser) {
        await auditEnhancedLog(context, request.method, 'unauthorized', { 
          error,
          attempted_resource: options.resource,
          attempted_action: options.action
        })
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // Update context with authenticated user
      context.user = authenticatedUser
      
      // Check if user account is active
      if (!authenticatedUser.is_active) {
        await auditEnhancedLog(context, request.method, 'forbidden', { 
          reason: 'account_deactivated' 
        })
        return NextResponse.json(
          { error: 'Account is deactivated' },
          { status: 403 }
        )
      }
      
      // Check session expiration
      if (authenticatedUser.session_expires_at && 
          new Date(authenticatedUser.session_expires_at) < new Date()) {
        await auditEnhancedLog(context, request.method, 'forbidden', { 
          reason: 'session_expired',
          expires_at: authenticatedUser.session_expires_at
        })
        return NextResponse.json(
          { error: 'Session has expired' },
          { status: 403 }
        )
      }
      
      // Check MFA requirement
      if (options.requireMFA && !authenticatedUser.mfa_verified) {
        await auditEnhancedLog(context, request.method, 'mfa_required')
        return NextResponse.json(
          { error: 'Multi-factor authentication required' },
          { status: 403 }
        )
      }
      
      // Check healthcare clearance levels
      if (options.allowedClearanceLevels && 
          !checkHealthcareClearance(authenticatedUser, options.allowedClearanceLevels)) {
        await auditEnhancedLog(context, request.method, 'forbidden', {
          reason: 'insufficient_clearance',
          required_levels: options.allowedClearanceLevels,
          user_level: authenticatedUser.healthcare_context?.clearance_level
        })
        return NextResponse.json(
          { error: 'Insufficient healthcare clearance level' },
          { status: 403 }
        )
      }
      
      // Check time restrictions
      if (options.timeRestrictions && !checkTimeRestrictions(authenticatedUser)) {
        await auditEnhancedLog(context, request.method, 'forbidden', {
          reason: 'time_restriction',
          current_time: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Access denied due to time restrictions' },
          { status: 403 }
        )
      }
      
      // Enhanced permission checking
      if (options.resource && options.action) {
        const permissionCheck = await PermissionManagementService.validatePermission(
          authenticatedUser.id,
          options.resource,
          options.action
        )
        
        if (!permissionCheck.granted) {
          await auditEnhancedLog(context, request.method, 'forbidden', {
            reason: 'insufficient_permissions',
            required_permissions: permissionCheck.required_permissions,
            missing_permissions: permissionCheck.missing_permissions,
            elevated_access_required: permissionCheck.elevated_access_required
          })
          return NextResponse.json(
            { 
              error: permissionCheck.reason || 'Insufficient permissions',
              required_permissions: permissionCheck.required_permissions,
              missing_permissions: permissionCheck.missing_permissions
            },
            { status: 403 }
          )
        }
      }
      
      // Fallback permission check
      if (options.requiredPermission && 
          !authenticatedUser.permissions.includes(options.requiredPermission)) {
        await auditEnhancedLog(context, request.method, 'forbidden', {
          reason: 'missing_permission',
          required_permission: options.requiredPermission,
          user_permissions: authenticatedUser.permissions
        })
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      
      // Role-based access check
      if (options.requiredRole && authenticatedUser.role !== options.requiredRole) {
        await auditEnhancedLog(context, request.method, 'forbidden', {
          reason: 'insufficient_role',
          required_role: options.requiredRole,
          user_role: authenticatedUser.role
        })
        return NextResponse.json(
          { error: 'Insufficient role privileges' },
          { status: 403 }
        )
      }
      
      // Execute the handler
      const response = await handler(request, context)
      
      // Add enhanced security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('X-Request-ID', context.requestId)
      response.headers.set('X-User-Role', authenticatedUser.role)
      response.headers.set('X-MFA-Verified', authenticatedUser.mfa_verified.toString())
      
      if (authenticatedUser.healthcare_context?.clearance_level) {
        response.headers.set('X-Clearance-Level', authenticatedUser.healthcare_context.clearance_level)
      }
      
      // Log successful request
      await auditEnhancedLog(context, request.method, 'success', {
        duration: Date.now() - startTime,
        status: response.status,
        audit_level: options.auditLevel || 'medium'
      })
      
      return response
      
    } catch (error) {
      // Log error
      await auditEnhancedLog(context, request.method, 'failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Return generic error to prevent information disclosure
      return NextResponse.json(
        { 
          error: 'An error occurred processing your request',
          requestId: context.requestId
        },
        { status: 500 }
      )
    }
  }
}

export default {
  authenticateEnhancedRequest,
  createEnhancedSecurityContext,
  auditEnhancedLog,
  withEnhancedSecurity,
  checkEnhancedPermission
}

// Export functions for backward compatibility
export const withEnhancedAuth = withEnhancedSecurity;
export const withEnhancedSessionAuth = withEnhancedSecurity;