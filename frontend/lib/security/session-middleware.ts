/**
 * Session Management Middleware
 * Integrates session security with existing authentication system
 * 
 * Story 1.6 Task 4: Session Security Enhancement
 */

import { NextRequest, NextResponse } from 'next/server'
import { SessionManager, SessionActivityType } from './session-manager'
import { createAuditContext, quickAuditLog } from './audit-middleware'
import { AuditEventType, AuditSeverity } from './audit-logging'

export interface SessionMiddlewareOptions {
  requireActiveSession?: boolean
  trackActivity?: boolean
  checkTimeouts?: boolean
  sensitiveOperation?: boolean
  resourcePath?: string
}

/**
 * Session validation and activity tracking middleware
 */
export async function withSessionSecurity(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: SessionMiddlewareOptions = {}
) {
  return async (req: NextRequest, context?: any) => {
    const {
      requireActiveSession = true,
      trackActivity = true,
      checkTimeouts = true,
      sensitiveOperation = false,
      resourcePath
    } = options

    try {
      const sessionManager = new SessionManager()
      
      // Extract session ID from headers or cookies
      const sessionId = req.headers.get('x-session-id') || 
                       req.cookies.get('session_id')?.value

      // Get IP address
      const ipAddress = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown'

      const userAgent = req.headers.get('user-agent') || 'unknown'

      if (requireActiveSession && !sessionId) {
        return NextResponse.json(
          { success: false, error: 'Session required' },
          { status: 401 }
        )
      }

      if (sessionId) {
        // Check session validity and update activity if enabled
        if (checkTimeouts || trackActivity) {
          const activityType = sensitiveOperation 
            ? SessionActivityType.SENSITIVE_OPERATION 
            : SessionActivityType.API_CALL

          const result = await sessionManager.updateSessionActivity(
            sessionId,
            activityType,
            resourcePath || req.nextUrl.pathname,
            sensitiveOperation
          )

          if (!result.sessionValid) {
            // Session expired or invalid
            return NextResponse.json(
              { 
                success: false, 
                error: 'Session expired',
                reason: result.error,
                requiresReauth: true
              },
              { status: 401 }
            )
          }

          // Add session warning to response if needed
          const response = await handler(req, {
            ...context,
            sessionId,
            sessionWarning: result.warningRequired,
            ipAddress,
            userAgent
          })

          if (result.warningRequired) {
            response.headers.set('x-session-warning', 'Session will expire soon')
            response.headers.set('x-session-warning-type', 'inactivity')
          }

          return response
        }
      }

      // Continue without session validation
      return await handler(req, {
        ...context,
        sessionId,
        ipAddress,
        userAgent
      })
    } catch (error) {
      console.error('Session middleware error:', error)
      
      if (requireActiveSession) {
        return NextResponse.json(
          { success: false, error: 'Session validation failed' },
          { status: 500 }
        )
      }

      // Continue execution if session is not required
      return await handler(req, context)
    }
  }
}

/**
 * Session creation middleware for login endpoints
 */
export async function createSessionForUser(
  userId: string,
  ipAddress: string,
  userAgent: string,
  healthcareContext: boolean = false
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const sessionManager = new SessionManager()
    
    const result = await sessionManager.createSession(
      userId,
      ipAddress,
      userAgent,
      healthcareContext
    )

    if (result.success && result.session) {
      return {
        success: true,
        sessionId: result.session.id
      }
    }

    return {
      success: false,
      error: result.error || 'Session creation failed'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Session creation error'
    }
  }
}

/**
 * Session termination middleware for logout endpoints
 */
export async function terminateUserSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionManager = new SessionManager()
    return await sessionManager.terminateSession(sessionId)
  } catch (error) {
    return {
      success: false,
      error: 'Session termination error'
    }
  }
}

/**
 * Check if user has exceeded concurrent session limits
 */
export async function checkConcurrentSessionLimits(
  userId: string
): Promise<{ withinLimits: boolean; activeCount: number; maxAllowed: number }> {
  try {
    const sessionManager = new SessionManager()
    const activeSessions = await sessionManager.getActiveSessions(userId)
    
    // Get user's session policy to check limits
    // For now, use default limit of 3
    const maxAllowed = 3
    
    return {
      withinLimits: activeSessions.length < maxAllowed,
      activeCount: activeSessions.length,
      maxAllowed
    }
  } catch (error) {
    return {
      withinLimits: true,
      activeCount: 0,
      maxAllowed: 3
    }
  }
}

/**
 * Middleware to validate session for sensitive operations
 */
export async function requireRecentAuthentication(
  sessionId: string,
  maxAgeMinutes: number = 5
): Promise<{ valid: boolean; requiresReauth: boolean; error?: string }> {
  try {
    const sessionManager = new SessionManager()
    const session = await sessionManager.getSession(sessionId)
    
    if (!session) {
      return { valid: false, requiresReauth: true, error: 'Session not found' }
    }

    // Check if recent authentication is required
    const now = new Date()
    const authAgeMinutes = (now.getTime() - session.created_at.getTime()) / (1000 * 60)
    
    if (authAgeMinutes > maxAgeMinutes) {
      return { valid: false, requiresReauth: true, error: 'Recent authentication required' }
    }

    return { valid: true, requiresReauth: false }
  } catch (error) {
    return { valid: false, requiresReauth: true, error: 'Validation error' }
  }
}

/**
 * Monitor for suspicious session activity
 */
export async function detectSuspiciousActivity(
  sessionId: string,
  currentIp: string,
  currentUserAgent: string
): Promise<{ suspicious: boolean; reasons: string[]; severity: 'low' | 'medium' | 'high' }> {
  try {
    const sessionManager = new SessionManager()
    const session = await sessionManager.getSession(sessionId)
    
    if (!session) {
      return { suspicious: false, reasons: [], severity: 'low' }
    }

    const reasons: string[] = []
    let severity: 'low' | 'medium' | 'high' = 'low'

    // Check for IP address changes
    if (session.ip_address !== currentIp) {
      reasons.push('IP address change detected')
      severity = 'medium'
    }

    // Check for user agent changes (simplified check)
    if (session.user_agent !== currentUserAgent) {
      reasons.push('User agent change detected')
      if (severity !== 'medium') severity = 'low'
    }

    // Check for rapid session creation pattern
    const recentSessions = await sessionManager.getActiveSessions(session.user_id)
    const recentCount = recentSessions.filter(s => 
      (Date.now() - s.created_at.getTime()) < 5 * 60 * 1000 // 5 minutes
    ).length

    if (recentCount > 3) {
      reasons.push('Rapid session creation detected')
      severity = 'high'
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
      severity
    }
  } catch (error) {
    return { suspicious: false, reasons: [], severity: 'low' }
  }
}

/**
 * Session cleanup job (should be called periodically)
 */
export async function runSessionCleanup(): Promise<{ success: boolean; cleanedCount: number }> {
  try {
    const sessionManager = new SessionManager()
    const result = await sessionManager.cleanupExpiredSessions()
    return result
  } catch (error) {
    return { success: false, cleanedCount: 0 }
  }
}

/**
 * Get session statistics for monitoring
 */
export async function getSessionStatistics(): Promise<{
  totalActiveSessions: number
  averageSessionDuration: number
  concurrentSessionDistribution: Record<string, number>
  healthcareContextSessions: number
}> {
  try {
    const sessionManager = new SessionManager()
    
    // This would typically query the database for statistics
    // Simplified implementation for now
    return {
      totalActiveSessions: 0,
      averageSessionDuration: 0,
      concurrentSessionDistribution: {},
      healthcareContextSessions: 0
    }
  } catch (error) {
    return {
      totalActiveSessions: 0,
      averageSessionDuration: 0,
      concurrentSessionDistribution: {},
      healthcareContextSessions: 0
    }
  }
}

/**
 * Enhanced authentication middleware that includes session management
 */
export function withEnhancedSessionAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    requireActiveSession?: boolean
    sensitiveOperation?: boolean
    recentAuthRequired?: boolean
    recentAuthMaxAge?: number
  } = {}
) {
  return withSessionSecurity(
    async (req: NextRequest, context: any) => {
      const { 
        requireActiveSession = true,
        sensitiveOperation = false,
        recentAuthRequired = false,
        recentAuthMaxAge = 5
      } = options

      // If sensitive operation requires recent authentication
      if (recentAuthRequired && context.sessionId) {
        const authCheck = await requireRecentAuthentication(
          context.sessionId,
          recentAuthMaxAge
        )

        if (!authCheck.valid) {
          return NextResponse.json(
            {
              success: false,
              error: authCheck.error,
              requiresReauth: authCheck.requiresReauth
            },
            { status: 401 }
          )
        }
      }

      // Check for suspicious activity
      if (context.sessionId) {
        const suspiciousActivity = await detectSuspiciousActivity(
          context.sessionId,
          context.ipAddress,
          context.userAgent
        )

        if (suspiciousActivity.suspicious && suspiciousActivity.severity === 'high') {
          // Log security incident
          await quickAuditLog(
            AuditEventType.SUSPICIOUS_ACTIVITY,
            createAuditContext(req, { id: 'unknown' }),
            {
              resource_type: 'session',
              action_performed: 'suspicious_activity_detected',
              metadata: {
                session_id: context.sessionId,
                suspicious_reasons: suspiciousActivity.reasons,
                severity: suspiciousActivity.severity
              }
            }
          )

          return NextResponse.json(
            {
              success: false,
              error: 'Suspicious activity detected',
              requiresSecurity: true
            },
            { status: 403 }
          )
        }
      }

      return await handler(req, context)
    },
    {
      requireActiveSession,
      trackActivity: true,
      checkTimeouts: true,
      sensitiveOperation,
      resourcePath: req.nextUrl.pathname
    }
  )
}