/**
 * Enterprise Session Management for Healthcare Admin
 * Implements HIPAA-compliant session security with timeout policies and activity monitoring
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Access control (45 CFR §164.312(a)) - User session management
 * - Automatic logoff (45 CFR §164.312(a)(2)(iii))
 * - Assigned security responsibility (45 CFR §164.308(a)(2))
 * 
 * Story 1.6 Task 4: Session Security Enhancement
 */

import { createClient } from '@supabase/supabase-js'
import { AuditEventType, AuditSeverity, HIPAAAuditLogger } from './audit-logging'
import { logger } from '@/lib/logger'

// Session configuration interfaces
export interface SessionConfig {
  timeout_minutes: number
  warning_minutes: number
  max_concurrent_sessions: number
  inactivity_timeout_minutes: number
  absolute_timeout_hours: number
  require_reauth_for_sensitive: boolean
  track_ip_changes: boolean
  healthcare_context: boolean
}

export interface SessionActivity {
  session_id: string
  user_id: string
  activity_type: string
  ip_address?: string
  user_agent?: string
  resource_accessed?: string
  sensitive_operation?: boolean
  timestamp: Date
  healthcare_context?: boolean
}

export interface ActiveSession {
  id: string
  user_id: string
  created_at: Date
  last_activity: Date
  ip_address: string
  user_agent: string
  is_active: boolean
  warning_sent: boolean
  healthcare_context: boolean
  device_fingerprint?: string
  location_data?: any
  session_data?: any
}

export interface SessionPolicy {
  id: string
  name: string
  description: string
  config: SessionConfig
  applies_to_roles: string[]
  healthcare_specific: boolean
  created_by: string
  created_at: Date
  is_active: boolean
}

// Session timeout reasons
export enum SessionTimeoutReason {
  INACTIVITY = 'inactivity',
  ABSOLUTE_TIMEOUT = 'absolute_timeout',
  MANUAL_LOGOUT = 'manual_logout',
  ADMIN_TERMINATED = 'admin_terminated',
  SECURITY_VIOLATION = 'security_violation',
  IP_CHANGE_DETECTED = 'ip_change_detected',
  CONCURRENT_LIMIT_EXCEEDED = 'concurrent_limit_exceeded'
}

// Activity types for monitoring
export enum SessionActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PAGE_ACCESS = 'page_access',
  API_CALL = 'api_call',
  SENSITIVE_OPERATION = 'sensitive_operation',
  IDLE_WARNING = 'idle_warning',
  SESSION_EXTENDED = 'session_extended',
  IP_CHANGE = 'ip_change',
  CONCURRENT_SESSION = 'concurrent_session'
}

/**
 * Enterprise Session Manager
 * Handles session lifecycle, timeout policies, and security monitoring
 */
export class SessionManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  private auditLogger = new HIPAAAuditLogger()

  /**
   * Create new session with policy enforcement
   */
  async createSession(
    userId: string, 
    ipAddress: string, 
    userAgent: string, 
    healthcareContext: boolean = false
  ): Promise<{ success: boolean; session?: ActiveSession; error?: string }> {
    try {
      // Get applicable session policy
      const policy = await this.getSessionPolicyForUser(userId)
      
      // Check concurrent session limits
      const activeSessions = await this.getActiveSessions(userId)
      if (activeSessions.length >= policy.config.max_concurrent_sessions) {
        // Terminate oldest session if limit exceeded
        await this.terminateOldestSession(userId)
        
        await this.auditLogger.logEvent({
          event_type: AuditEventType.SESSION_LIMIT_EXCEEDED,
          user_id: userId,
          severity: AuditSeverity.WARNING,
          resource_type: 'session',
          metadata: {
            active_sessions: activeSessions.length,
            max_allowed: policy.config.max_concurrent_sessions,
            action_taken: 'terminated_oldest_session'
          },
          ip_address: ipAddress,
          healthcare_data_involved: healthcareContext
        })
      }

      // Create new session
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newSession: ActiveSession = {
        id: sessionId,
        user_id: userId,
        created_at: new Date(),
        last_activity: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
        warning_sent: false,
        healthcare_context: healthcareContext,
        device_fingerprint: this.generateDeviceFingerprint(userAgent, ipAddress)
      }

      // Store session in database
      const { error: dbError } = await this.supabase
        .from('active_sessions')
        .insert([{
          id: newSession.id,
          user_id: newSession.user_id,
          created_at: newSession.created_at,
          last_activity: newSession.last_activity,
          ip_address: newSession.ip_address,
          user_agent: newSession.user_agent,
          is_active: newSession.is_active,
          warning_sent: newSession.warning_sent,
          healthcare_context: newSession.healthcare_context,
          device_fingerprint: newSession.device_fingerprint
        }])

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Log session creation
      await this.logActivity(sessionId, userId, SessionActivityType.LOGIN, {
        ip_address: ipAddress,
        user_agent: userAgent,
        healthcare_context: healthcareContext
      })

      await this.auditLogger.logEvent({
        event_type: AuditEventType.LOGIN,
        user_id: userId,
        severity: AuditSeverity.INFO,
        resource_type: 'session',
        metadata: {
          session_id: sessionId,
          device_fingerprint: newSession.device_fingerprint,
          session_policy: policy.name
        },
        ip_address: ipAddress,
        healthcare_data_involved: healthcareContext
      })

      return { success: true, session: newSession }
    } catch (error) {
      logger.error('Failed to create session:', error)
      return { success: false, error: 'Session creation failed' }
    }
  }

  /**
   * Update session activity and check timeout policies
   */
  async updateSessionActivity(
    sessionId: string, 
    activityType: SessionActivityType = SessionActivityType.PAGE_ACCESS,
    resourceAccessed?: string,
    sensitiveOperation?: boolean
  ): Promise<{ success: boolean; sessionValid: boolean; warningRequired?: boolean; error?: string }> {
    try {
      // Get current session
      const session = await this.getSession(sessionId)
      if (!session) {
        return { success: false, sessionValid: false, error: 'Session not found' }
      }

      // Get session policy
      const policy = await this.getSessionPolicyForUser(session.user_id)
      
      // Check if session has timed out
      const now = new Date()
      const inactivityLimit = new Date(session.last_activity.getTime() + (policy.config.inactivity_timeout_minutes * 60 * 1000))
      const absoluteLimit = new Date(session.created_at.getTime() + (policy.config.absolute_timeout_hours * 60 * 60 * 1000))
      
      if (now > inactivityLimit) {
        await this.terminateSession(sessionId, SessionTimeoutReason.INACTIVITY)
        return { success: true, sessionValid: false, error: 'Session expired due to inactivity' }
      }
      
      if (now > absoluteLimit) {
        await this.terminateSession(sessionId, SessionTimeoutReason.ABSOLUTE_TIMEOUT)
        return { success: true, sessionValid: false, error: 'Session expired due to absolute timeout' }
      }

      // Update last activity
      await this.supabase
        .from('active_sessions')
        .update({ last_activity: now })
        .eq('id', sessionId)

      // Log activity
      await this.logActivity(sessionId, session.user_id, activityType, {
        resource_accessed: resourceAccessed,
        sensitive_operation: sensitiveOperation,
        healthcare_context: session.healthcare_context
      })

      // Check if warning should be sent
      const warningTime = new Date(now.getTime() + (policy.config.warning_minutes * 60 * 1000))
      const warningRequired = warningTime > inactivityLimit && !session.warning_sent

      if (warningRequired) {
        await this.supabase
          .from('active_sessions')
          .update({ warning_sent: true })
          .eq('id', sessionId)

        await this.logActivity(sessionId, session.user_id, SessionActivityType.IDLE_WARNING)
      }

      return { 
        success: true, 
        sessionValid: true, 
        warningRequired 
      }
    } catch (error) {
      logger.error('Failed to update session activity:', error)
      return { success: false, sessionValid: false, error: 'Failed to update session' }
    }
  }

  /**
   * Terminate session with reason
   */
  async terminateSession(
    sessionId: string, 
    reason: SessionTimeoutReason = SessionTimeoutReason.MANUAL_LOGOUT
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return { success: false, error: 'Session not found' }
      }

      // Mark session as inactive
      await this.supabase
        .from('active_sessions')
        .update({ 
          is_active: false,
          terminated_at: new Date(),
          termination_reason: reason
        })
        .eq('id', sessionId)

      // Log termination
      await this.logActivity(sessionId, session.user_id, SessionActivityType.LOGOUT, {
        termination_reason: reason,
        healthcare_context: session.healthcare_context
      })

      await this.auditLogger.logEvent({
        event_type: AuditEventType.LOGOUT,
        user_id: session.user_id,
        severity: AuditSeverity.INFO,
        resource_type: 'session',
        metadata: {
          session_id: sessionId,
          termination_reason: reason,
          session_duration: Date.now() - session.created_at.getTime()
        },
        ip_address: session.ip_address,
        healthcare_data_involved: session.healthcare_context
      })

      return { success: true }
    } catch (error) {
      logger.error('Failed to terminate session:', error)
      return { success: false, error: 'Session termination failed' }
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<ActiveSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Failed to get active sessions:', error)
      return []
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ActiveSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('active_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(
    userId: string, 
    reason: SessionTimeoutReason = SessionTimeoutReason.ADMIN_TERMINATED
  ): Promise<{ success: boolean; terminatedCount: number; error?: string }> {
    try {
      const activeSessions = await this.getActiveSessions(userId)
      let terminatedCount = 0

      for (const session of activeSessions) {
        const result = await this.terminateSession(session.id, reason)
        if (result.success) terminatedCount++
      }

      await this.auditLogger.logEvent({
        event_type: AuditEventType.SECURITY_CONFIG,
        user_id: userId,
        severity: AuditSeverity.WARNING,
        resource_type: 'session',
        action_performed: 'terminate_all_sessions',
        metadata: {
          termination_reason: reason,
          terminated_count: terminatedCount
        }
      })

      return { success: true, terminatedCount }
    } catch (error) {
      logger.error('Failed to terminate all user sessions:', error)
      return { success: false, terminatedCount: 0, error: 'Failed to terminate sessions' }
    }
  }

  /**
   * Get session policy for user based on their roles
   */
  private async getSessionPolicyForUser(userId: string): Promise<SessionPolicy> {
    try {
      // Get user roles from enterprise_users table
      const { data: userData } = await this.supabase
        .from('enterprise_users')
        .select('healthcare_roles')
        .eq('supabase_user_id', userId)
        .single()

      const userRoles = userData?.healthcare_roles || []

      // Get applicable session policy
      const { data: policies } = await this.supabase
        .from('session_policies')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      // Find the first policy that applies to user's roles
      const applicablePolicy = policies?.find(policy => 
        policy.applies_to_roles.some((role: string) => userRoles.includes(role))
      )

      if (applicablePolicy) {
        return applicablePolicy
      }

      // Return default policy if no specific policy found
      return this.getDefaultSessionPolicy()
    } catch (error) {
      logger.error('Failed to get session policy for user:', error)
      return this.getDefaultSessionPolicy()
    }
  }

  /**
   * Get default session policy for healthcare admin
   */
  private getDefaultSessionPolicy(): SessionPolicy {
    return {
      id: 'default_healthcare_policy',
      name: 'Default Healthcare Session Policy',
      description: 'Default HIPAA-compliant session policy for healthcare admin users',
      config: {
        timeout_minutes: 30,
        warning_minutes: 5,
        max_concurrent_sessions: 3,
        inactivity_timeout_minutes: 15,
        absolute_timeout_hours: 8,
        require_reauth_for_sensitive: true,
        track_ip_changes: true,
        healthcare_context: true
      },
      applies_to_roles: ['*'],
      healthcare_specific: true,
      created_by: 'system',
      created_at: new Date(),
      is_active: true
    }
  }

  /**
   * Terminate oldest session when concurrent limit exceeded
   */
  private async terminateOldestSession(userId: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId)
    if (sessions.length === 0) return

    const oldestSession = sessions[sessions.length - 1]
    await this.terminateSession(oldestSession.id, SessionTimeoutReason.CONCURRENT_LIMIT_EXCEEDED)
  }

  /**
   * Generate device fingerprint for session tracking
   */
  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const crypto = require('crypto')
    const fingerprint = `${userAgent}|${ipAddress}|${Date.now()}`
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16)
  }

  /**
   * Log session activity
   */
  private async logActivity(
    sessionId: string, 
    userId: string, 
    activityType: SessionActivityType, 
    metadata?: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('session_activities')
        .insert([{
          session_id: sessionId,
          user_id: userId,
          activity_type: activityType,
          metadata: metadata || {},
          timestamp: new Date()
        }])
    } catch (error) {
      logger.error('Failed to log session activity:', error)
    }
  }

  /**
   * Get session activity history
   */
  async getSessionActivity(
    sessionId?: string, 
    userId?: string, 
    limit: number = 100
  ): Promise<SessionActivity[]> {
    try {
      let query = this.supabase
        .from('session_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }
      
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
      if (error) throw error
      
      return data || []
    } catch (error) {
      logger.error('Failed to get session activity:', error)
      return []
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<{ success: boolean; cleanedCount: number; error?: string }> {
    try {
      const now = new Date()
      const { data: expiredSessions } = await this.supabase
        .from('active_sessions')
        .select('*')
        .eq('is_active', true)
        .lt('last_activity', new Date(now.getTime() - 24 * 60 * 60 * 1000)) // 24 hours ago

      let cleanedCount = 0
      if (expiredSessions) {
        for (const session of expiredSessions) {
          await this.terminateSession(session.id, SessionTimeoutReason.INACTIVITY)
          cleanedCount++
        }
      }

      return { success: true, cleanedCount }
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error)
      return { success: false, cleanedCount: 0, error: 'Cleanup failed' }
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()