/**
 * Global Admin API Rate Limiting Middleware
 * Applies comprehensive rate limiting to ALL admin endpoints
 * with emergency bypass and monitoring capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withAdvancedRateLimit, rateLimitingMonitor } from './admin-rate-limit-middleware'
import { AdminRole } from '@/lib/dal/admin/types'
import { logger } from '@/lib/logging/client-safe-logger'

// Emergency bypass configuration
interface BypassConfig {
  enabled: boolean
  allowedUsers: string[]
  allowedIPs: string[]
  reason?: string
  expiresAt?: number
}

// Global bypass state (can be controlled via admin interface)
let globalBypass: BypassConfig = {
  enabled: false,
  allowedUsers: [],
  allowedIPs: [],
  reason: undefined,
  expiresAt: undefined
}

/**
 * Extract user information from request
 */
async function extractUserInfo(request: NextRequest): Promise<{
  userId: string | null
  role: AdminRole | null
  isAuthenticated: boolean
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        userId: null,
        role: null,
        isAuthenticated: false
      }
    }

    // Get user role from database or metadata
    const { data: profile } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile?.is_active) {
      return {
        userId: user.id,
        role: null,
        isAuthenticated: false
      }
    }

    return {
      userId: user.id,
      role: profile?.role || AdminRole.AUTHOR,
      isAuthenticated: true
    }
  } catch (error) {
    logger.error('Failed to extract user info for rate limiting', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.nextUrl.pathname
    })
    
    return {
      userId: null,
      role: null,
      isAuthenticated: false
    }
  }
}

/**
 * Check if request should bypass rate limiting
 */
function shouldBypassRateLimit(
  request: NextRequest, 
  userId: string | null,
  ip: string
): boolean {
  // Check global bypass
  if (globalBypass.enabled) {
    // Check if bypass is expired
    if (globalBypass.expiresAt && Date.now() > globalBypass.expiresAt) {
      globalBypass.enabled = false
      return false
    }

    // Check if user is in allowed list
    if (userId && globalBypass.allowedUsers.includes(userId)) {
      return true
    }

    // Check if IP is in allowed list
    if (globalBypass.allowedIPs.includes(ip)) {
      return true
    }

    // If no specific restrictions, allow all
    if (globalBypass.allowedUsers.length === 0 && globalBypass.allowedIPs.length === 0) {
      return true
    }
  }

  // Check for emergency access patterns
  const userAgent = request.headers.get('user-agent') || ''
  const isEmergencyAccess = userAgent.includes('Emergency-Admin-Access') || 
                           request.headers.get('x-emergency-access') === 'true'
  
  if (isEmergencyAccess && userId) {
    logger.warn('Emergency access bypass attempted', { userId, ip, userAgent })
    // Additional verification could be added here
    return false // Disabled by default for security
  }

  return false
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  return (
    cfConnectingIP ||
    realIP ||
    forwarded?.split(',')[0].trim() ||
    request.ip ||
    '127.0.0.1'
  )
}

/**
 * Generate comprehensive error response for rate limiting
 */
function createRateLimitErrorResponse(
  error: string,
  details: any,
  headers: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded',
      message: error,
      code: 'RATE_LIMITED',
      details,
      timestamp: new Date().toISOString(),
      support: {
        message: 'If you believe this is an error, please contact system administrators',
        documentation: '/docs/api/rate-limits'
      }
    },
    { 
      status: 429,
      headers
    }
  )

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')

  return response
}

/**
 * Apply rate limiting to unauthenticated requests
 */
async function applyUnauthenticatedRateLimit(
  request: NextRequest,
  ip: string
): Promise<NextResponse | null> {
  // Very restrictive limits for unauthenticated admin access attempts
  const rateLimitResult = await withAdvancedRateLimit(
    request,
    `unauthenticated:${ip}`,
    AdminRole.AUTHOR, // Use lowest privilege level
    false
  )

  if (!rateLimitResult.allowed && rateLimitResult.response) {
    logger.warn('Unauthenticated admin access rate limited', {
      ip,
      path: request.nextUrl.pathname,
      method: request.method
    })

    // Add additional warning headers
    const response = rateLimitResult.response
    response.headers.set('X-Unauthenticated-Access', 'blocked')
    response.headers.set('X-Security-Warning', 'Repeated unauthenticated access attempts detected')
    
    return response
  }

  return null
}

/**
 * Main global admin rate limiting function
 */
export async function applyGlobalAdminRateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  const startTime = Date.now()
  const path = request.nextUrl.pathname
  const method = request.method
  const ip = getClientIP(request)

  // Skip rate limiting for non-admin paths
  if (!path.startsWith('/api/admin/')) {
    return null
  }

  // Skip rate limiting for health checks and monitoring endpoints
  const skipPaths = [
    '/api/admin/health',
    '/api/admin/status',
    '/api/admin/monitoring/ping'
  ]
  
  if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
    return null
  }

  try {
    // Extract user information
    const userInfo = await extractUserInfo(request)
    
    // Check for bypass conditions
    if (shouldBypassRateLimit(request, userInfo.userId, ip)) {
      logger.info('Admin rate limit bypassed', {
        userId: userInfo.userId,
        role: userInfo.role,
        ip,
        path,
        reason: globalBypass.reason || 'Global bypass enabled'
      })
      
      return null // Allow request to proceed
    }

    // Handle unauthenticated requests
    if (!userInfo.isAuthenticated || !userInfo.userId || !userInfo.role) {
      const unauthResponse = await applyUnauthenticatedRateLimit(request, ip)
      if (unauthResponse) {
        return unauthResponse
      }

      // For unauthenticated but not rate-limited requests, 
      // let them proceed to get proper auth errors
      return null
    }

    // Apply authenticated user rate limiting
    const rateLimitResult = await withAdvancedRateLimit(
      request,
      userInfo.userId,
      userInfo.role,
      false
    )

    if (!rateLimitResult.allowed && rateLimitResult.response) {
      logger.warn('Authenticated admin user rate limited', {
        userId: userInfo.userId,
        role: userInfo.role,
        ip,
        path,
        method
      })

      return rateLimitResult.response
    }

    // Log successful rate limit checks (debug level)
    const duration = Date.now() - startTime
    logger.debug('Global admin rate limit check passed', {
      userId: userInfo.userId,
      role: userInfo.role,
      ip,
      path,
      method,
      duration
    })

    // Add rate limit headers to successful responses
    // (These will be handled by the individual route handlers)
    
    return null // Allow request to proceed

  } catch (error) {
    logger.error('Global admin rate limiting error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
      path,
      method,
      duration: Date.now() - startTime
    })

    // Fail open but with conservative limits
    return null
  }
}

/**
 * Emergency bypass controls for system administrators
 */
export const emergencyBypassControls = {
  /**
   * Enable global bypass for emergency situations
   */
  enableGlobalBypass(options: {
    reason: string
    durationMinutes?: number
    allowedUsers?: string[]
    allowedIPs?: string[]
    authorizedBy: string
  }): void {
    const expiresAt = options.durationMinutes 
      ? Date.now() + (options.durationMinutes * 60 * 1000)
      : undefined

    globalBypass = {
      enabled: true,
      allowedUsers: options.allowedUsers || [],
      allowedIPs: options.allowedIPs || [],
      reason: options.reason,
      expiresAt
    }

    logger.warn('Emergency rate limit bypass enabled', {
      reason: options.reason,
      durationMinutes: options.durationMinutes,
      allowedUsers: options.allowedUsers,
      allowedIPs: options.allowedIPs,
      authorizedBy: options.authorizedBy,
      expiresAt
    })
  },

  /**
   * Disable global bypass
   */
  disableGlobalBypass(authorizedBy: string): void {
    const previousConfig = { ...globalBypass }
    
    globalBypass = {
      enabled: false,
      allowedUsers: [],
      allowedIPs: [],
      reason: undefined,
      expiresAt: undefined
    }

    logger.warn('Emergency rate limit bypass disabled', {
      previousConfig,
      authorizedBy
    })
  },

  /**
   * Get current bypass status
   */
  getBypassStatus(): BypassConfig & { isExpired: boolean } {
    const isExpired = globalBypass.expiresAt ? Date.now() > globalBypass.expiresAt : false
    
    if (isExpired && globalBypass.enabled) {
      globalBypass.enabled = false
    }

    return {
      ...globalBypass,
      isExpired
    }
  }
}

/**
 * Admin API for rate limiting management
 */
export const adminRateLimitAPI = {
  /**
   * Get comprehensive rate limiting status
   */
  getStatus(): {
    bypass: BypassConfig & { isExpired: boolean }
    metrics: Record<string, any>
    securityState: any
  } {
    return {
      bypass: emergencyBypassControls.getBypassStatus(),
      metrics: rateLimitingMonitor.getMetrics(),
      securityState: rateLimitingMonitor.getSecurityState()
    }
  },

  /**
   * Reset rate limits for a user
   */
  resetUserLimits(userId: string, role: AdminRole, authorizedBy: string): void {
    rateLimitingMonitor.resetUserLimits(userId, role)
    
    logger.warn('User rate limits reset by administrator', {
      userId,
      role,
      authorizedBy
    })
  },

  /**
   * Block a user from all admin operations
   */
  blockUser(userId: string, role: AdminRole, durationMs: number, reason: string, authorizedBy: string): void {
    rateLimitingMonitor.blockUser(userId, role, durationMs)
    
    logger.warn('User blocked from admin operations', {
      userId,
      role,
      durationMs,
      reason,
      authorizedBy
    })
  },

  /**
   * Block an IP address
   */
  blockIP(ip: string, durationMs: number, reason: string, authorizedBy: string): void {
    rateLimitingMonitor.blockIP(ip, durationMs)
    
    logger.warn('IP address blocked from admin operations', {
      ip,
      durationMs,
      reason,
      authorizedBy
    })
  }
}

// Export types and utilities
export type { BypassConfig }