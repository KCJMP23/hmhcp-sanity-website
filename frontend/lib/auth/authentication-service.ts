/**
 * Comprehensive Authentication Service
 * Implements secure authentication with Supabase, bcrypt password hashing,
 * session management, and role-based access control
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
// Dynamic crypto import for Edge Runtime compatibility
let crypto: any
if (typeof window === 'undefined') {
  try {
    crypto = require('crypto')
  } catch (e) {
    // Edge Runtime fallback
    crypto = null
  }
}
import { logger } from '@/lib/logging/client-safe-logger'
import { isUsingMockSupabase, mockSupabaseAdmin } from '@/lib/dal/mock-supabase'

// Security constants
const SESSION_COOKIE_NAME = 'sb-access-token'
const REFRESH_COOKIE_NAME = 'sb-refresh-token'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// Password validation rules
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>()

/**
 * Initialize Supabase admin client with service role key or fallback to mock
 */
function getSupabaseAdmin(): SupabaseClient | typeof mockSupabaseAdmin {
  // Check if we should use mock mode
  if (isUsingMockSupabase()) {
    logger.info('Using mock Supabase for authentication')
    return mockSupabaseAdmin as any
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    logger.warn('Supabase configuration missing, falling back to mock mode')
    return mockSupabaseAdmin as any
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as SupabaseClient
}

/**
 * Initialize Supabase client for server-side operations
 */
export async function getSupabaseServer(): Promise<SupabaseClient | typeof mockSupabaseAdmin> {
  // Check if we should use mock mode
  if (isUsingMockSupabase()) {
    return mockSupabaseAdmin as any
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    logger.warn('Supabase configuration missing, falling back to mock mode')
    return mockSupabaseAdmin as any
  }

  const cookieStore = await cookies()
  
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }) as SupabaseClient
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  }

  if (!PASSWORD_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check if an email is rate limited
 */
function isRateLimited(email: string): boolean {
  const attempt = loginAttempts.get(email)
  
  if (!attempt) return false
  
  if (attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
    return true
  }
  
  // Clean up expired lockouts
  if (attempt.lockedUntil && attempt.lockedUntil <= Date.now()) {
    loginAttempts.delete(email)
  }
  
  return false
}

/**
 * Record a login attempt
 */
function recordLoginAttempt(email: string, success: boolean) {
  if (success) {
    loginAttempts.delete(email)
    return
  }

  const attempt = loginAttempts.get(email) || { count: 0 }
  attempt.count++

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION
    logger.warn('Account locked due to too many failed login attempts', { email })
  }

  loginAttempts.set(email, attempt)
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: any; session: any; error?: string }> {
  try {
    // Check rate limiting
    if (isRateLimited(email)) {
      const attempt = loginAttempts.get(email)
      const remainingTime = Math.ceil(((attempt?.lockedUntil || 0) - Date.now()) / 1000 / 60)
      return {
        user: null,
        session: null,
        error: `Account temporarily locked. Please try again in ${remainingTime} minutes.`
      }
    }

    // Validate input
    if (!email || !password) {
      return {
        user: null,
        session: null,
        error: 'Email and password are required'
      }
    }

    const supabase = getSupabaseAdmin()

    // Special handling for mock mode with bcrypt password verification
    if (isUsingMockSupabase()) {
      // In mock mode, validate against environment-configured test accounts
      // NEVER store credentials in code - use environment variables
      const testEmail = process.env.MOCK_ADMIN_EMAIL
      const testPasswordHash = process.env.MOCK_ADMIN_PASSWORD_HASH
      
      if (!testEmail || !testPasswordHash) {
        logger.error('Mock mode credentials not configured in environment')
        return {
          user: null,
          session: null,
          error: 'Mock authentication not configured'
        }
      }

      // Verify email matches configured test account
      if (email !== testEmail) {
        recordLoginAttempt(email, false)
        logger.warn('Failed login attempt in mock mode', { email })
        return {
          user: null,
          session: null,
          error: 'Invalid email or password'
        }
      }

      // Verify password against bcrypt hash
      const isValidPassword = await bcrypt.compare(password, testPasswordHash)
      if (!isValidPassword) {
        recordLoginAttempt(email, false)
        logger.warn('Failed login attempt in mock mode', { email })
        return {
          user: null,
          session: null,
          error: 'Invalid email or password'
        }
      }

      // Mock successful authentication with secure token generation
      recordLoginAttempt(email, true)
      const mockUserId = 'mock-user-' + crypto.randomBytes(16).toString('hex')
      const mockAccessToken = crypto.randomBytes(32).toString('hex')
      const mockRefreshToken = crypto.randomBytes(32).toString('hex')
      
      return {
        user: {
          id: mockUserId,
          email: email,
          role: process.env.MOCK_ADMIN_ROLE || 'admin',
          first_name: process.env.MOCK_ADMIN_FIRST_NAME || 'Test',
          last_name: process.env.MOCK_ADMIN_LAST_NAME || 'Admin'
        },
        session: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          expires_at: new Date(Date.now() + SESSION_DURATION).toISOString()
        }
      }
    }

    // Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await (supabase as any).auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      recordLoginAttempt(email, false)
      logger.warn('Failed login attempt', { email, error: authError?.message })
      return {
        user: null,
        session: null,
        error: 'Invalid email or password'
      }
    }

    // Check if user has admin privileges
    const { data: adminUser, error: adminError } = await (supabase as any)
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      // Check user metadata for role
      const userRole = authData.user.user_metadata?.role
      
      if (!userRole || !['admin', 'super_admin', 'editor'].includes(userRole)) {
        await (supabase as any).auth.signOut()
        recordLoginAttempt(email, false)
        return {
          user: null,
          session: null,
          error: 'Admin privileges required'
        }
      }
    }

    // Record successful login
    recordLoginAttempt(email, true)

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      user_id: authData.user.id,
      action: 'login',
      resource_type: 'auth',
      details: {
        email,
        ip: 'server-side',
        timestamp: new Date().toISOString()
      }
    })

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: adminUser?.role || authData.user.user_metadata?.role,
        first_name: authData.user.user_metadata?.first_name,
        last_name: authData.user.user_metadata?.last_name
      },
      session: authData.session
    }
  } catch (error) {
    logger.error('Authentication error', { error })
    return {
      user: null,
      session: null,
      error: 'An error occurred during authentication'
    }
  }
}

/**
 * Verify current session from cookies
 */
export async function verifySession(): Promise<{ user: any; error?: string }> {
  try {
    const supabase = await getSupabaseServer()
    
    const { data: { user }, error } = await (supabase as any).auth.getUser()
    
    if (error || !user) {
      return { user: null, error: 'No valid session' }
    }

    // Check admin privileges
    const { data: adminUser } = await (supabase as any)
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    const userRole = adminUser?.role || user.user_metadata?.role

    if (!userRole || !['admin', 'super_admin', 'editor', 'author'].includes(userRole)) {
      return { user: null, error: 'Insufficient privileges' }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name
      }
    }
  } catch (error) {
    logger.error('Session verification error', { error })
    return { user: null, error: 'Session verification failed' }
  }
}

/**
 * Check if user has required role
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  const { user, error } = await verifySession()

  if (error || !user) {
    return { authorized: false, error: error || 'Authentication required' }
  }

  if (!allowedRoles.includes(user.role)) {
    return { 
      authorized: false, 
      error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`
    }
  }

  return { authorized: true, user }
}

/**
 * Sign out user and clear session
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer()
    
    const { data: { user } } = await (supabase as any).auth.getUser()
    
    if (user) {
      // Log audit event
      await (supabase as any).from('audit_logs').insert({
        user_id: user.id,
        action: 'logout',
        resource_type: 'auth',
        details: {
          timestamp: new Date().toISOString()
        }
      })
    }

    const { error } = await (supabase as any).auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    logger.error('Sign out error', { error })
    return { success: false, error: 'Failed to sign out' }
  }
}

/**
 * Change user password with old password verification
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('. ') }
    }

    const supabase = getSupabaseAdmin()

    // Get user to verify old password
    const { data: { user }, error: userError } = await (supabase as any).auth.admin.getUserById(userId)
    
    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Verify old password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: oldPassword
    })

    if (signInError) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update password
    const { error: updateError } = await (supabase as any).auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      return { success: false, error: 'Failed to update password' }
    }

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      user_id: userId,
      action: 'password_change',
      resource_type: 'auth',
      details: {
        timestamp: new Date().toISOString()
      }
    })

    return { success: true }
  } catch (error) {
    logger.error('Password change error', { error })
    return { success: false, error: 'Failed to change password' }
  }
}

/**
 * Reset user password (admin function)
 */
export async function resetUserPassword(
  adminUserId: string,
  targetUserEmail: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin has permission
    const { authorized, user: adminUser, error: authError } = await requireRole(['super_admin'])
    
    if (!authorized || authError) {
      return { success: false, error: authError || 'Insufficient permissions' }
    }

    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('. ') }
    }

    const supabase = getSupabaseAdmin()

    // Find target user
    const { data: users, error: listError } = await (supabase as any).auth.admin.listUsers()
    
    if (listError) {
      return { success: false, error: 'Failed to find user' }
    }

    const targetUser = users.users.find((u: any) => u.email === targetUserEmail)
    
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Update password
    const { error: updateError } = await (supabase as any).auth.admin.updateUserById(targetUser.id, {
      password: newPassword
    })

    if (updateError) {
      return { success: false, error: 'Failed to reset password' }
    }

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      user_id: adminUserId,
      action: 'password_reset',
      resource_type: 'auth',
      resource_id: targetUser.id,
      details: {
        target_email: targetUserEmail,
        timestamp: new Date().toISOString()
      }
    })

    return { success: true }
  } catch (error) {
    logger.error('Password reset error', { error })
    return { success: false, error: 'Failed to reset password' }
  }
}

/**
 * Create secure cookie options
 */
export function getSecureCookieOptions(maxAge?: number) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAge || SESSION_DURATION
  }
}