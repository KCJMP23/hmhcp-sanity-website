/**
 * Session Manager
 * Handles session creation, validation, and management
 * Now uses Redis for production-ready persistent session storage
 */

import { cookies } from 'next/headers'
import { logger } from '@/lib/logging/client-safe-logger'
import { sessionStore, SessionData } from './redis-session-store'

// Session configuration
const SESSION_COOKIE_NAME = 'admin-session'
const SESSION_ID_COOKIE = 'session-id'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 1000 // 1 hour


/**
 * Create a new session with enhanced security
 */
export async function createSession(
  userId: string,
  email: string,
  role: string,
  data?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  try {
    // Create session in persistent store
    const sessionId = await sessionStore.create({
      userId,
      email,
      role,
      ipAddress,
      userAgent,
      data
    })

    const expiresAt = Date.now() + SESSION_DURATION

    // Set secure session cookie
    const cookieStore = await cookies()
    
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed to strict for better CSRF protection
      path: '/',
      expires: new Date(expiresAt)
    })

    // Set CSRF token cookie (non-httpOnly for client access)
    const csrfToken = sessionId.substring(0, 16) // Use partial session ID as CSRF token
    cookieStore.set({
      name: SESSION_ID_COOKIE,
      value: csrfToken,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(expiresAt)
    })

    logger.info('Session created', {
      sessionId: sessionId.substring(0, 8),
      userId,
      email,
      role,
      ipAddress: ipAddress?.substring(0, 15)
    })

    return sessionId
  } catch (error) {
    logger.error('Failed to create session', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    })
    throw new Error('Failed to create session')
  }
}

/**
 * Get session from cookies with enhanced validation
 */
export async function getSession(): Promise<{
  valid: boolean
  session?: {
    sessionId: string
    userId: string
    email: string
    role: string
    data?: Record<string, any>
  }
  error?: string
}> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
    const csrfCookie = cookieStore.get(SESSION_ID_COOKIE)

    if (!sessionCookie?.value) {
      return { valid: false, error: 'No session cookie' }
    }

    const sessionId = sessionCookie.value
    
    // Validate CSRF token matches
    if (csrfCookie?.value && !sessionId.startsWith(csrfCookie.value)) {
      logger.warn('CSRF token mismatch', {
        sessionId: sessionId.substring(0, 8)
      })
      return { valid: false, error: 'Invalid session' }
    }

    // Get session from persistent store
    const sessionData = await sessionStore.get(sessionId)

    if (!sessionData) {
      return { valid: false, error: 'Session not found' }
    }

    const now = Date.now()

    // Check if session expired
    if (sessionData.expiresAt < now) {
      await sessionStore.destroy(sessionId)
      return { valid: false, error: 'Session expired' }
    }

    // Refresh session if needed
    if (sessionData.expiresAt - now < SESSION_REFRESH_THRESHOLD) {
      await sessionStore.refresh(sessionId)
      
      // Update cookie expiration
      const newExpiresAt = now + SESSION_DURATION
      cookieStore.set({
        name: SESSION_COOKIE_NAME,
        value: sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(newExpiresAt)
      })

      logger.info('Session refreshed', {
        sessionId: sessionId.substring(0, 8),
        userId: sessionData.userId
      })
    }

    return {
      valid: true,
      session: {
        sessionId,
        userId: sessionData.userId,
        email: sessionData.email,
        role: sessionData.role,
        data: sessionData.data
      }
    }
  } catch (error) {
    logger.error('Session validation error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return { valid: false, error: 'Session validation failed' }
  }
}

/**
 * Verify session has required role
 */
export async function verifySessionRole(allowedRoles: string[]): Promise<{
  authorized: boolean
  session?: {
    sessionId: string
    userId: string
    email: string
    role: string
  }
  error?: string
}> {
  const { valid, session, error } = await getSession()

  if (!valid || !session) {
    return { authorized: false, error: error || 'No valid session' }
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`
    }
  }

  return { authorized: true, session }
}

/**
 * Destroy session with proper cleanup
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (sessionCookie?.value) {
      // Remove from persistent store
      await sessionStore.destroy(sessionCookie.value)
      
      logger.info('Session destroyed', {
        sessionId: sessionCookie.value.substring(0, 8)
      })
    }

    // Clear cookies with secure options
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })

    cookieStore.set({
      name: SESSION_ID_COOKIE,
      value: '',
      maxAge: 0,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
  } catch (error) {
    logger.error('Failed to destroy session', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

/**
 * Destroy all sessions for a user (useful for security events)
 */
export async function destroyUserSessions(userId: string): Promise<number> {
  try {
    const count = await sessionStore.destroyUserSessions(userId)
    logger.info('User sessions destroyed', { userId, count })
    return count
  } catch (error) {
    logger.error('Failed to destroy user sessions', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    })
    return 0
  }
}

/**
 * Get all sessions for a user (for security monitoring)
 */
export async function getUserSessions(userId: string): Promise<string[]> {
  try {
    return await sessionStore.getUserSessions(userId)
  } catch (error) {
    logger.error('Failed to get user sessions', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    })
    return []
  }
}

/**
 * Validate session with IP address check for additional security
 */
export async function validateSessionWithIP(
  sessionId: string,
  currentIP: string
): Promise<boolean> {
  try {
    const sessionData = await sessionStore.get(sessionId)
    
    if (!sessionData) {
      return false
    }

    // Check if IP address matches (optional strict mode)
    if (process.env.ENFORCE_SESSION_IP === 'true' && 
        sessionData.ipAddress && 
        sessionData.ipAddress !== currentIP) {
      logger.warn('Session IP mismatch', {
        sessionId: sessionId.substring(0, 8),
        originalIP: sessionData.ipAddress,
        currentIP
      })
      return false
    }

    return true
  } catch (error) {
    logger.error('Session IP validation error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return false
  }
}