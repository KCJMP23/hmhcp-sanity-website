// Production admin auth service for CMS functionality
// This replaces mock implementations with real database operations

import { supabaseAdmin } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AdminUser as BaseAdminUser } from '@/lib/dal/supabase'

export interface AdminUser extends BaseAdminUser {
  name?: string
  permissions?: string[]
  avatar_url?: string
  two_factor_enabled?: boolean
}

export interface AdminSession {
  id: string
  user_id: string
  token: string
  expires_at: string
  ip_address: string
  user_agent: string
  created_at: string
  last_activity?: string
}

export interface AdminPermission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  created_at: string
}

export interface AdminRole {
  id: string
  name: string
  description: string
  permissions: string[]
  is_system: boolean
  created_at: string
  updated_at: string
}

export class ProductionAdminAuthService {
  private static instance: ProductionAdminAuthService

  static getInstance(): ProductionAdminAuthService {
    if (!ProductionAdminAuthService.instance) {
      ProductionAdminAuthService.instance = new ProductionAdminAuthService()
    }
    return ProductionAdminAuthService.instance
  }

  async getCurrentAdmin(token: string): Promise<AdminUser | null> {
    try {
      if (!token) {
        return null
      }

      // Validate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
      let decoded: any
      
      try {
        decoded = jwt.verify(token, jwtSecret)
      } catch (jwtError) {
        logger.warn('Invalid JWT token', { error: jwtError instanceof Error ? jwtError.message : 'Unknown error' })
        return null
      }

      // Fetch user from database
      const { data: adminUser, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Admin user not found', { userId: decoded.userId })
        } else {
          logger.error('Database error fetching admin user', { 
            userId: decoded.userId, 
            error: error.message 
          })
        }
        return null
      }

      // Check if account is locked
      if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
        logger.warn('Admin account is locked', { 
          userId: adminUser.id, 
          lockedUntil: adminUser.locked_until 
        })
        return null
      }

      // Update last login
      await supabaseAdmin
        .from('admin_users')
        .update({ 
          last_login: new Date().toISOString(),
          login_attempts: 0,
          locked_until: null
        })
        .eq('id', adminUser.id)

      logger.info('Admin authentication successful', { 
        userId: adminUser.id, 
        role: adminUser.role,
        email: adminUser.email
      })
      
      return adminUser
    } catch (error) {
      logger.error('Admin authentication failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }

  async validateAdminToken(token: string): Promise<boolean> {
    try {
      if (!token) {
        return false
      }

      const admin = await this.getCurrentAdmin(token)
      return admin !== null
    } catch (error) {
      logger.error('Admin token validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return false
    }
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      // Fetch user and their role
      const { data: adminUser, error } = await supabaseAdmin
        .from('admin_users')
        .select('role, is_active')
        .eq('id', userId)
        .single()

      if (error || !adminUser || !adminUser.is_active) {
        logger.warn('Permission check failed - user not found or inactive', { 
          userId, 
          error: error?.message 
        })
        return false
      }

      // Super admins have all permissions
      if (adminUser.role === 'super_admin') {
        return true
      }

      // Define role-based permissions
      const rolePermissions: Record<string, string[]> = {
        admin: ['content.*', 'users.read', 'users.update', 'media.*', 'settings.read'],
        editor: ['content.*', 'media.read', 'media.upload'],
        author: ['content.create', 'content.update', 'content.read', 'media.read']
      }

      const userPermissions = rolePermissions[adminUser.role] || []
      const requiredPermission = `${resource}.${action}`

      // Check exact permission or wildcard
      const hasPermission = userPermissions.some(permission => {
        if (permission === requiredPermission) return true
        if (permission.endsWith('.*')) {
          const baseResource = permission.slice(0, -2)
          return requiredPermission.startsWith(baseResource + '.')
        }
        return false
      })

      if (!hasPermission) {
        logger.warn('Permission denied', { 
          userId, 
          role: adminUser.role, 
          resource, 
          action,
          requiredPermission
        })
      }

      return hasPermission
    } catch (error) {
      logger.error('Permission check failed', { 
        userId, 
        resource, 
        action, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return false
    }
  }

  async createAdminSession(userId: string, ipAddress: string, userAgent: string): Promise<AdminSession | null> {
    try {
      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      const token = jwt.sign(
        { 
          userId, 
          type: 'admin_session',
          exp: Math.floor(expiresAt.getTime() / 1000)
        },
        jwtSecret
      )

      // Store session in database
      const sessionData = {
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      }

      const { data: session, error } = await supabaseAdmin
        .from('admin_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        logger.error('Failed to create admin session in database', { 
          userId, 
          error: error.message 
        })
        return null
      }

      // Clean up expired sessions
      await supabaseAdmin
        .from('admin_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())

      logger.info('Admin session created', { 
        userId, 
        sessionId: session.id,
        expiresAt: session.expires_at
      })
      
      return {
        ...session,
        last_activity: session.created_at
      }
    } catch (error) {
      logger.error('Admin session creation failed', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }

  async invalidateAdminSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('admin_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        logger.error('Failed to invalidate admin session', { 
          sessionId, 
          error: error.message 
        })
        return false
      }

      logger.info('Admin session invalidated', { sessionId })
      return true
    } catch (error) {
      logger.error('Admin session invalidation failed', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return false
    }
  }

  async getAdminUserById(userId: string): Promise<AdminUser | null> {
    try {
      const { data: adminUser, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.info('Admin user not found', { userId })
        } else {
          logger.error('Database error fetching admin user', { 
            userId, 
            error: error.message 
          })
        }
        return null
      }

      return adminUser
    } catch (error) {
      logger.error('Failed to fetch admin user', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }

  async authenticateAdmin(email: string, password: string): Promise<{ user: AdminUser; token: string } | null> {
    try {
      // Fetch user by email
      const { data: adminUser, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single()

      if (error || !adminUser) {
        logger.warn('Admin login attempt with invalid email', { email })
        return null
      }

      // Check if account is locked
      if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
        logger.warn('Admin login attempt on locked account', { 
          userId: adminUser.id, 
          email,
          lockedUntil: adminUser.locked_until 
        })
        return null
      }

      // Verify password
      if (!adminUser.password_hash) {
        logger.error('Admin user has no password hash', { userId: adminUser.id })
        return null
      }

      const isValidPassword = await bcrypt.compare(password, adminUser.password_hash)
      
      if (!isValidPassword) {
        // Increment login attempts
        const newAttempts = (adminUser.login_attempts || 0) + 1
        const shouldLock = newAttempts >= 5
        
        await supabaseAdmin
          .from('admin_users')
          .update({
            login_attempts: newAttempts,
            locked_until: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null // 30 minutes
          })
          .eq('id', adminUser.id)

        logger.warn('Admin login attempt with invalid password', { 
          userId: adminUser.id, 
          email,
          attempts: newAttempts,
          locked: shouldLock
        })
        return null
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
      const token = jwt.sign(
        { 
          userId: adminUser.id, 
          email: adminUser.email,
          role: adminUser.role,
          type: 'admin_auth'
        },
        jwtSecret,
        { expiresIn: '24h' }
      )

      // Update last login and reset attempts
      await supabaseAdmin
        .from('admin_users')
        .update({
          last_login: new Date().toISOString(),
          login_attempts: 0,
          locked_until: null
        })
        .eq('id', adminUser.id)

      logger.info('Admin authentication successful', { 
        userId: adminUser.id, 
        email: adminUser.email,
        role: adminUser.role
      })

      return {
        user: adminUser,
        token
      }
    } catch (error) {
      logger.error('Admin authentication failed', { 
        email,
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }

  async createAdminUser(userData: {
    email: string
    password: string
    role: AdminUser['role']
    name?: string
  }): Promise<AdminUser | null> {
    try {
      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(userData.password, saltRounds)

      // Create user
      const { data: newUser, error } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email: userData.email.toLowerCase(),
          password_hash: passwordHash,
          role: userData.role,
          is_active: true,
          login_attempts: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create admin user', { 
          email: userData.email,
          error: error.message 
        })
        return null
      }

      logger.info('Admin user created', { 
        userId: newUser.id, 
        email: newUser.email,
        role: newUser.role
      })

      // Remove password hash from return value
      const { password_hash, ...userWithoutPassword } = newUser
      return userWithoutPassword
    } catch (error) {
      logger.error('Admin user creation failed', { 
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }

  async updateAdminUser(userId: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
    try {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('admin_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update admin user', { 
          userId,
          error: error.message 
        })
        return null
      }

      logger.info('Admin user updated', { 
        userId, 
        updatedFields: Object.keys(updates)
      })

      return updatedUser
    } catch (error) {
      logger.error('Admin user update failed', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }
}

// Export singleton instance
export const adminAuthService = ProductionAdminAuthService.getInstance()

// Helper functions for easier usage
export async function getCurrentAdmin(token?: string): Promise<AdminUser | null> {
  if (!token) return null
  return adminAuthService.getCurrentAdmin(token)
}

export async function validateAdminToken(token: string): Promise<boolean> {
  return adminAuthService.validateAdminToken(token)
}

export async function checkAdminPermission(userId: string, resource: string, action: string): Promise<boolean> {
  return adminAuthService.checkPermission(userId, resource, action)
}

export async function authenticateAdmin(email: string, password: string): Promise<{ user: AdminUser; token: string } | null> {
  return adminAuthService.authenticateAdmin(email, password)
}

export async function createAdminUser(userData: {
  email: string
  password: string
  role: AdminUser['role']
  name?: string
}): Promise<AdminUser | null> {
  return adminAuthService.createAdminUser(userData)
}

export async function logAuditAction(
  userId: string, 
  action: string, 
  resourceType: string, 
  resourceId?: string, 
  details?: any
): Promise<void> {
  try {
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        created_at: new Date().toISOString()
      })
    
    logger.debug('Audit action logged', { 
      userId, 
      action, 
      resourceType, 
      resourceId 
    })
  } catch (error) {
    logger.error('Failed to log audit action', {
      userId,
      action,
      resourceType,
      resourceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function requireAdmin(token?: string): Promise<AdminUser> {
  const admin = await getCurrentAdmin(token)
  
  if (!admin) {
    throw new Error('Admin authentication required')
  }
  
  if (!admin.is_active) {
    throw new Error('Admin account is deactivated')
  }
  
  return admin
}

export default ProductionAdminAuthService