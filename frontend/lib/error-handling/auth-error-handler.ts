/**
 * Authentication & Authorization Error Handler for HMHCP Admin System
 * 
 * Provides comprehensive authentication error handling with:
 * - Session validation with automatic refresh
 * - Role-based access control error handling
 * - Account lockout and security event logging
 * - Multi-factor authentication error handling
 * - HIPAA-compliant audit trails
 * - Suspicious activity detection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AdminErrorHandler } from './error-handler'
import { createEnhancedRequestLogger, type EnhancedRequestLogger } from './request-logger'
import type { User } from '@supabase/supabase-js'

// Authentication error types
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'session_expired' 
  | 'session_invalid'
  | 'account_locked'
  | 'account_disabled'
  | 'insufficient_privileges'
  | 'role_not_found'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'suspicious_activity'
  | 'token_expired'
  | 'refresh_failed'

// Authentication context
export interface AuthContext {
  correlationId: string
  endpoint: string
  method: string
  ipAddress: string
  userAgent?: string
  sessionId?: string
  userId?: string
  logger: EnhancedRequestLogger
}

// Session validation result
export interface SessionValidationResult {
  isValid: boolean
  user?: User
  error?: AuthErrorType
  needsRefresh?: boolean
  securityFlags?: string[]
  accountStatus?: 'active' | 'locked' | 'disabled' | 'suspended'
}

// Role validation result
export interface RoleValidationResult {
  hasAccess: boolean
  userRole?: string
  requiredRoles?: string[]
  error?: AuthErrorType
  permissionLevel?: number
}

// Account security status
export interface AccountSecurityStatus {
  isLocked: boolean
  lockoutReason?: string
  lockoutUntil?: Date
  failedAttempts: number
  lastFailedAttempt?: Date
  suspiciousActivity: boolean
  securityFlags: string[]
}

export class AuthErrorHandler {
  
  /**
   * Validate user session with comprehensive error handling
   */
  static async validateSession(
    request: NextRequest,
    context: AuthContext
  ): Promise<SessionValidationResult> {
    
    const { logger } = context
    
    try {
      const supabase = await createServerSupabaseClient()
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        logger.logSecurityEvent('session_invalid', {
          error: sessionError.message,
          errorCode: sessionError.status
        })
        
        return {
          isValid: false,
          error: 'session_invalid',
          securityFlags: ['session_error']
        }
      }
      
      if (!session || !session.user) {
        logger.logSecurityEvent('session_expired', {
          hasSession: !!session,
          hasUser: !!session?.user
        })
        
        return {
          isValid: false,
          error: 'session_expired',
          needsRefresh: false
        }
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        logger.logSecurityEvent('token_expired', {
          expiresAt: session.expires_at,
          currentTime: now
        })
        
        // Try to refresh the session
        const refreshResult = await this.refreshSession(supabase, context)
        if (refreshResult.success) {
          return {
            isValid: true,
            user: refreshResult.user,
            needsRefresh: true
          }
        }
        
        return {
          isValid: false,
          error: 'token_expired',
          needsRefresh: true
        }
      }
      
      // Check account security status
      const securityStatus = await this.checkAccountSecurity(session.user.id, context)
      
      if (!securityStatus.isValid) {
        return {
          isValid: false,
          error: securityStatus.error,
          accountStatus: securityStatus.accountStatus,
          securityFlags: securityStatus.securityFlags
        }
      }
      
      // Detect suspicious activity
      const suspiciousActivity = await this.detectSuspiciousActivity(
        session.user.id,
        request,
        context
      )
      
      if (suspiciousActivity.isSuspicious) {
        logger.logSecurityEvent('suspicious_activity', {
          userId: session.user.id,
          flags: suspiciousActivity.flags,
          riskScore: suspiciousActivity.riskScore
        })
        
        // Don't block but flag for monitoring
        if (suspiciousActivity.riskScore > 80) {
          return {
            isValid: false,
            error: 'suspicious_activity',
            securityFlags: suspiciousActivity.flags
          }
        }
      }
      
      logger.logSecurityEvent('session_valid', {
        userId: session.user.id,
        sessionDuration: now - (session.user.created_at ? Math.floor(new Date(session.user.created_at).getTime() / 1000) : now)
      })
      
      return {
        isValid: true,
        user: session.user,
        securityFlags: suspiciousActivity.flags.length > 0 ? suspiciousActivity.flags : undefined
      }
      
    } catch (error) {
      logger.logError(error as Error, 500, { context: 'session_validation' })
      
      return {
        isValid: false,
        error: 'session_invalid',
        securityFlags: ['validation_error']
      }
    }
  }
  
  /**
   * Validate user roles and permissions
   */
  static async validateRole(
    userId: string,
    requiredRoles: string[],
    context: AuthContext
  ): Promise<RoleValidationResult> {
    
    const { logger } = context
    
    try {
      const supabase = await createServerSupabaseClient()
      
      // Get user role from admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, is_active, permissions, last_login_at')
        .eq('id', userId)
        .single()
      
      if (error) {
        logger.logSecurityEvent('access_denied', {
          reason: 'User not found in admin_users',
          userId,
          requiredRoles
        })
        
        return {
          hasAccess: false,
          error: 'role_not_found',
          requiredRoles
        }
      }
      
      if (!adminUser.is_active) {
        logger.logSecurityEvent('access_denied', {
          reason: 'Account disabled',
          userId,
          userRole: adminUser.role
        })
        
        return {
          hasAccess: false,
          error: 'account_disabled',
          userRole: adminUser.role,
          requiredRoles
        }
      }
      
      const userRole = adminUser.role
      const hasRequiredRole = requiredRoles.includes(userRole) || userRole === 'super_admin'
      
      if (!hasRequiredRole) {
        logger.logSecurityEvent('access_denied', {
          reason: 'Insufficient privileges',
          userId,
          userRole,
          requiredRoles
        })
        
        return {
          hasAccess: false,
          error: 'insufficient_privileges',
          userRole,
          requiredRoles,
          permissionLevel: this.getPermissionLevel(userRole)
        }
      }
      
      // Check specific permissions if available
      const hasPermissions = this.checkSpecificPermissions(
        adminUser.permissions,
        context.endpoint,
        context.method
      )
      
      if (!hasPermissions) {
        logger.logSecurityEvent('access_denied', {
          reason: 'Missing specific permissions',
          userId,
          userRole,
          endpoint: context.endpoint,
          method: context.method
        })
        
        return {
          hasAccess: false,
          error: 'insufficient_privileges',
          userRole,
          requiredRoles
        }
      }
      
      logger.logSecurityEvent('access_granted', {
        userId,
        userRole,
        endpoint: context.endpoint,
        lastLogin: adminUser.last_login_at
      })
      
      return {
        hasAccess: true,
        userRole,
        permissionLevel: this.getPermissionLevel(userRole)
      }
      
    } catch (error) {
      logger.logError(error as Error, 500, { context: 'role_validation' })
      
      return {
        hasAccess: false,
        error: 'role_not_found',
        requiredRoles
      }
    }
  }
  
  /**
   * Handle authentication errors with appropriate responses
   */
  static async handleAuthError(
    errorType: AuthErrorType,
    context: AuthContext,
    additionalData?: Record<string, any>
  ): Promise<NextResponse> {
    
    const { logger, correlationId } = context
    
    // Log security event
    logger.logSecurityEvent('login_failure', {
      errorType,
      endpoint: context.endpoint,
      ...additionalData
    })
    
    // Create appropriate error response based on error type
    switch (errorType) {
      case 'invalid_credentials':
        return NextResponse.json({
          error: 'Invalid email or password',
          correlationId,
          retryable: false
        }, { status: 401 })
        
      case 'session_expired':
        return NextResponse.json({
          error: 'Session has expired. Please log in again.',
          correlationId,
          needsLogin: true,
          retryable: false
        }, { status: 401 })
        
      case 'session_invalid':
        return NextResponse.json({
          error: 'Invalid session. Please log in again.',
          correlationId,
          needsLogin: true,
          retryable: false
        }, { status: 401 })
        
      case 'account_locked':
        const lockoutInfo = additionalData?.lockoutInfo
        return NextResponse.json({
          error: 'Account is temporarily locked due to multiple failed login attempts',
          correlationId,
          lockoutUntil: lockoutInfo?.lockoutUntil,
          retryable: true
        }, { status: 423 })
        
      case 'account_disabled':
        return NextResponse.json({
          error: 'Account has been disabled. Please contact your administrator.',
          correlationId,
          contactSupport: true,
          retryable: false
        }, { status: 403 })
        
      case 'insufficient_privileges':
        return NextResponse.json({
          error: 'You do not have permission to access this resource',
          correlationId,
          currentRole: additionalData?.userRole,
          requiredRoles: additionalData?.requiredRoles,
          retryable: false
        }, { status: 403 })
        
      case 'role_not_found':
        return NextResponse.json({
          error: 'User role not found. Please contact your administrator.',
          correlationId,
          contactSupport: true,
          retryable: false
        }, { status: 403 })
        
      case 'mfa_required':
        return NextResponse.json({
          error: 'Multi-factor authentication required',
          correlationId,
          mfaRequired: true,
          retryable: false
        }, { status: 401 })
        
      case 'mfa_invalid':
        return NextResponse.json({
          error: 'Invalid multi-factor authentication code',
          correlationId,
          retryable: true
        }, { status: 401 })
        
      case 'suspicious_activity':
        return NextResponse.json({
          error: 'Suspicious activity detected. Please verify your identity.',
          correlationId,
          securityChallenge: true,
          retryable: true
        }, { status: 403 })
        
      case 'token_expired':
        return NextResponse.json({
          error: 'Access token has expired',
          correlationId,
          needsRefresh: true,
          retryable: true
        }, { status: 401 })
        
      case 'refresh_failed':
        return NextResponse.json({
          error: 'Failed to refresh session. Please log in again.',
          correlationId,
          needsLogin: true,
          retryable: false
        }, { status: 401 })
        
      default:
        return NextResponse.json({
          error: 'Authentication failed',
          correlationId,
          retryable: false
        }, { status: 401 })
    }
  }
  
  /**
   * Record login attempt for security monitoring
   */
  static async recordLoginAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    context: AuthContext,
    additionalData?: Record<string, any>
  ): Promise<void> {
    
    const { logger } = context
    
    try {
      const supabase = await createServerSupabaseClient()
      
      const loginAttempt = {
        email: email.toLowerCase(),
        ip_address: ipAddress,
        user_agent: context.userAgent || null,
        success,
        attempted_at: new Date().toISOString(),
        correlation_id: context.correlationId,
        endpoint: context.endpoint,
        additional_data: additionalData || null
      }
      
      // Insert into login_attempts table
      const { error } = await supabase
        .from('login_attempts')
        .insert(loginAttempt)
      
      if (error) {
        logger.logError(
          new Error(`Failed to record login attempt: ${error.message}`),
          500,
          { loginAttempt }
        )
      }
      
      // Log security event
      logger.logSecurityEvent(
        success ? 'login_success' : 'login_failure',
        {
          email: email.substring(0, 3) + '***',
          success,
          ...additionalData
        }
      )
      
    } catch (error) {
      logger.logError(error as Error, 500, { context: 'record_login_attempt' })
    }
  }
  
  // Private helper methods
  
  private static async refreshSession(
    supabase: any,
    context: AuthContext
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error || !data.session) {
        context.logger.logSecurityEvent('refresh_failed', {
          error: error?.message
        })
        
        return { success: false, error: error?.message }
      }
      
      context.logger.logSecurityEvent('session_refreshed', {
        userId: data.user.id
      })
      
      return { success: true, user: data.user }
      
    } catch (error) {
      context.logger.logError(error as Error, 500, { context: 'refresh_session' })
      return { success: false, error: 'Refresh failed' }
    }
  }
  
  private static async checkAccountSecurity(
    userId: string,
    context: AuthContext
  ): Promise<{
    isValid: boolean
    error?: AuthErrorType
    accountStatus?: string
    securityFlags?: string[]
  }> {
    
    try {
      const supabase = await createServerSupabaseClient()
      
      // Check account lockout status
      const { data: lockoutData } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()
      
      if (lockoutData) {
        const lockoutUntil = new Date(lockoutData.locked_until)
        if (lockoutUntil > new Date()) {
          return {
            isValid: false,
            error: 'account_locked',
            accountStatus: 'locked',
            securityFlags: ['account_locked']
          }
        }
      }
      
      // Check if account is disabled
      const { data: userData } = await supabase
        .from('admin_users')
        .select('is_active')
        .eq('id', userId)
        .single()
      
      if (userData && !userData.is_active) {
        return {
          isValid: false,
          error: 'account_disabled',
          accountStatus: 'disabled',
          securityFlags: ['account_disabled']
        }
      }
      
      return { isValid: true }
      
    } catch (error) {
      context.logger.logError(error as Error, 500, { context: 'check_account_security' })
      return { isValid: true } // Default to allowing access if check fails
    }
  }
  
  private static async detectSuspiciousActivity(
    userId: string,
    request: NextRequest,
    context: AuthContext
  ): Promise<{ isSuspicious: boolean; flags: string[]; riskScore: number }> {
    
    const flags: string[] = []
    let riskScore = 0
    
    try {
      const supabase = await createServerSupabaseClient()
      
      // Check for multiple IPs in short time
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      const { data: recentLogins } = await supabase
        .from('login_attempts')
        .select('ip_address')
        .eq('user_id', userId)
        .gte('attempted_at', oneHourAgo)
        .eq('success', true)
      
      if (recentLogins && recentLogins.length > 0) {
        const uniqueIPs = new Set(recentLogins.map(login => login.ip_address))
        if (uniqueIPs.size > 3) {
          flags.push('multiple_ips')
          riskScore += 30
        }
      }
      
      // Check for unusual timing patterns
      const now = new Date()
      const hour = now.getHours()
      
      if (hour < 6 || hour > 22) {
        flags.push('unusual_hours')
        riskScore += 10
      }
      
      // Check user agent consistency
      const { data: recentUserAgents } = await supabase
        .from('login_attempts')
        .select('user_agent')
        .eq('user_id', userId)
        .gte('attempted_at', oneHourAgo)
        .limit(5)
      
      if (recentUserAgents && recentUserAgents.length > 1) {
        const currentUserAgent = request.headers.get('user-agent')
        const hasMatchingUserAgent = recentUserAgents.some(
          login => login.user_agent === currentUserAgent
        )
        
        if (!hasMatchingUserAgent) {
          flags.push('new_user_agent')
          riskScore += 20
        }
      }
      
      return {
        isSuspicious: riskScore > 25,
        flags,
        riskScore
      }
      
    } catch (error) {
      context.logger.logError(error as Error, 500, { context: 'suspicious_activity_detection' })
      return { isSuspicious: false, flags: [], riskScore: 0 }
    }
  }
  
  private static getPermissionLevel(role: string): number {
    const levelMap: Record<string, number> = {
      'reader': 1,
      'author': 2,
      'editor': 3,
      'admin': 4,
      'super_admin': 5
    }
    
    return levelMap[role] || 0
  }
  
  private static checkSpecificPermissions(
    permissions: any,
    endpoint: string,
    method: string
  ): boolean {
    
    // If no specific permissions are defined, allow access
    if (!permissions || typeof permissions !== 'object') {
      return true
    }
    
    // Check if endpoint-specific permissions exist
    const endpointPerms = permissions[endpoint]
    if (!endpointPerms) {
      return true // Allow if no specific restrictions
    }
    
    // Check method-specific permissions
    if (Array.isArray(endpointPerms)) {
      return endpointPerms.includes(method.toLowerCase())
    }
    
    if (typeof endpointPerms === 'object') {
      return endpointPerms[method.toLowerCase()] === true
    }
    
    return true
  }
}

/**
 * Convenience wrapper for session validation
 */
export async function validateUserSession(
  request: NextRequest,
  options: {
    requiredRoles?: string[]
    requireAdminRole?: boolean
    correlationId?: string
  } = {}
): Promise<{
  isValid: boolean
  user?: User
  response?: NextResponse
  userRole?: string
}> {
  
  const correlationId = options.correlationId || crypto.randomUUID()
  const logger = createEnhancedRequestLogger(request, {
    correlationId,
    endpoint: request.nextUrl.pathname,
    method: request.method
  })
  
  const context: AuthContext = {
    correlationId,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    logger
  }
  
  // Validate session
  const sessionResult = await AuthErrorHandler.validateSession(request, context)
  
  if (!sessionResult.isValid) {
    const errorResponse = await AuthErrorHandler.handleAuthError(
      sessionResult.error || 'session_invalid',
      context
    )
    
    return {
      isValid: false,
      response: errorResponse
    }
  }
  
  const user = sessionResult.user!
  
  // Validate roles if required
  if (options.requiredRoles || options.requireAdminRole) {
    const requiredRoles = options.requiredRoles || (options.requireAdminRole ? ['admin', 'super_admin'] : [])
    
    const roleResult = await AuthErrorHandler.validateRole(user.id, requiredRoles, context)
    
    if (!roleResult.hasAccess) {
      const errorResponse = await AuthErrorHandler.handleAuthError(
        roleResult.error || 'insufficient_privileges',
        context,
        {
          userRole: roleResult.userRole,
          requiredRoles
        }
      )
      
      return {
        isValid: false,
        response: errorResponse
      }
    }
    
    return {
      isValid: true,
      user,
      userRole: roleResult.userRole
    }
  }
  
  return {
    isValid: true,
    user
  }
}

export default AuthErrorHandler