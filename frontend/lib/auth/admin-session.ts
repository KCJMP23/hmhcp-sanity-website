/**
 * Admin Session Management
 * Healthcare platform admin session handling
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logging/client-safe-logger'

export interface AdminSession {
  userId: string
  role: string
  permissions: string[]
  organizationId?: string
  expiresAt: Date
  isActive: boolean
}

export class AdminSessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Create admin session
   */
  static async createSession(
    userId: string,
    role: string,
    permissions: string[],
    organizationId?: string
  ): Promise<AdminSession> {
    const session: AdminSession = {
      userId,
      role,
      permissions,
      organizationId,
      expiresAt: new Date(Date.now() + this.SESSION_DURATION),
      isActive: true
    }

    logger.info('Admin session created', {
      userId,
      role,
      organizationId,
      expiresAt: session.expiresAt
    })

    return session
  }

  /**
   * Validate admin session
   */
  static async validateSession(request: NextRequest): Promise<AdminSession | null> {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return null
      }

      const token = authHeader.substring(7)
      
      // Verify JWT token with Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return null
      }

      // Get admin user info from database
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role, permissions, organization_id')
        .eq('id', user.id)
        .single()

      if (adminError || !adminUser) {
        return null
      }

      const session: AdminSession = {
        userId: user.id,
        role: adminUser.role,
        permissions: adminUser.permissions || [],
        organizationId: adminUser.organization_id,
        expiresAt: new Date(user.expires_at || Date.now() + this.SESSION_DURATION),
        isActive: true
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        logger.warn('Admin session expired', { userId: user.id })
        return null
      }

      return session
    } catch (error) {
      logger.error('Admin session validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Check if user has permission
   */
  static hasPermission(session: AdminSession, permission: string): boolean {
    return session.permissions.includes(permission) || 
           session.role === 'super_admin'
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(session: AdminSession, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(session, permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(session: AdminSession, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(session, permission))
  }

  /**
   * Check if user is admin
   */
  static isAdmin(session: AdminSession): boolean {
    return session.role === 'super_admin' || session.role === 'admin'
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin(session: AdminSession): boolean {
    return session.role === 'super_admin'
  }

  /**
   * Refresh session
   */
  static async refreshSession(session: AdminSession): Promise<AdminSession> {
    const refreshedSession: AdminSession = {
      ...session,
      expiresAt: new Date(Date.now() + this.SESSION_DURATION)
    }

    logger.info('Admin session refreshed', {
      userId: session.userId,
      newExpiresAt: refreshedSession.expiresAt
    })

    return refreshedSession
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(session: AdminSession): Promise<void> {
    logger.info('Admin session invalidated', {
      userId: session.userId,
      role: session.role
    })
  }

  /**
   * Get session from request
   */
  static async getSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
    return this.validateSession(request)
  }
}

export default AdminSessionService

// Export functions for backward compatibility
export const validateAdminSession = AdminSessionService.validateSession;
