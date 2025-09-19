/**
 * Authentication Protection System
 * Implements account lockout, IP-based rate limiting, and session security
 * OWASP Compliant - Prevents brute force attacks and credential stuffing
 */

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { logger } from '@/lib/logger'
import { Redis } from '@upstash/redis'

// Initialize Redis client for rate limiting and lockout tracking
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export interface AuthAttempt {
  email: string
  ip: string
  timestamp: number
  success: boolean
  userAgent?: string
  fingerprint?: string
}

export interface LockoutStatus {
  isLocked: boolean
  remainingTime?: number
  attempts: number
  nextAllowedAttempt?: Date
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number
}

export interface SessionValidation {
  isValid: boolean
  reason?: string
  riskScore: number
  flags: string[]
}

class AuthenticationProtection {
  // Configuration constants
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes
  private static readonly PROGRESSIVE_DELAYS = [0, 2000, 5000, 10000, 20000, 30000] // Progressive delays in ms
  
  // IP-based rate limiting
  private static readonly IP_RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
  private static readonly IP_MAX_ATTEMPTS = 20 // Max attempts per IP in window
  private static readonly IP_BLOCK_DURATION = 60 * 60 * 1000 // 1 hour for IP blocks
  
  // Session security
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes of inactivity
  private static readonly SESSION_ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours absolute
  private static readonly CONCURRENT_SESSION_LIMIT = 3 // Max concurrent sessions per user

  // In-memory fallback for development/testing
  private static memoryStore = new Map<string, any>()

  /**
   * Record a login attempt
   */
  static async recordLoginAttempt(
    email: string,
    ip: string,
    success: boolean,
    request?: NextRequest
  ): Promise<void> {
    const attempt: AuthAttempt = {
      email: email.toLowerCase(),
      ip,
      timestamp: Date.now(),
      success,
      userAgent: request?.headers.get('user-agent') || undefined,
      fingerprint: this.generateFingerprint(request)
    }

    try {
      // Store in Redis if available
      if (redis) {
        const key = `auth:attempts:${email.toLowerCase()}`
        const ipKey = `auth:ip:${ip}`
        
        // Store attempt
        await redis.lpush(key, JSON.stringify(attempt))
        await redis.expire(key, this.LOCKOUT_DURATION / 1000)
        
        // Track IP attempts
        await redis.incr(ipKey)
        await redis.expire(ipKey, this.IP_RATE_LIMIT_WINDOW / 1000)
        
        // If failed attempt, increment failure counter
        if (!success) {
          const failKey = `auth:failures:${email.toLowerCase()}`
          await redis.incr(failKey)
          await redis.expire(failKey, this.LOCKOUT_DURATION / 1000)
        } else {
          // Reset failures on successful login
          await redis.del(`auth:failures:${email.toLowerCase()}`)
        }
      } else {
        // Fallback to memory store
        const key = `attempts:${email.toLowerCase()}`
        const existing = this.memoryStore.get(key) || []
        existing.push(attempt)
        this.memoryStore.set(key, existing)
        
        // Clean old attempts
        this.cleanMemoryStore()
      }

      // Log security event
      if (!success) {
        logger.warn('Failed login attempt', {
          email: this.hashEmail(email),
          ip,
          fingerprint: attempt.fingerprint
        })
      }
    } catch (error) {
      logger.error('Error recording login attempt', { error })
    }
  }

  /**
   * Check if account is locked out
   */
  static async checkAccountLockout(email: string): Promise<LockoutStatus> {
    try {
      const emailLower = email.toLowerCase()
      
      if (redis) {
        const failKey = `auth:failures:${emailLower}`
        const lockKey = `auth:locked:${emailLower}`
        
        // Check if explicitly locked
        const lockTime = await redis.get<number>(lockKey)
        if (lockTime && Date.now() < lockTime) {
          return {
            isLocked: true,
            remainingTime: lockTime - Date.now(),
            attempts: this.MAX_LOGIN_ATTEMPTS,
            nextAllowedAttempt: new Date(lockTime)
          }
        }
        
        // Check failure count
        const failures = await redis.get<number>(failKey) || 0
        
        if (failures >= this.MAX_LOGIN_ATTEMPTS) {
          // Lock the account
          const lockUntil = Date.now() + this.LOCKOUT_DURATION
          await redis.set(lockKey, lockUntil, {
            px: this.LOCKOUT_DURATION
          })
          
          return {
            isLocked: true,
            remainingTime: this.LOCKOUT_DURATION,
            attempts: failures,
            nextAllowedAttempt: new Date(lockUntil)
          }
        }
        
        return {
          isLocked: false,
          attempts: failures
        }
      } else {
        // Memory store fallback
        const key = `attempts:${emailLower}`
        const attempts = (this.memoryStore.get(key) || [])
          .filter((a: AuthAttempt) => 
            Date.now() - a.timestamp < this.LOCKOUT_DURATION
          )
          .filter((a: AuthAttempt) => !a.success)
        
        const failureCount = attempts.length
        
        if (failureCount >= this.MAX_LOGIN_ATTEMPTS) {
          const lastAttempt = attempts[attempts.length - 1]
          const lockUntil = lastAttempt.timestamp + this.LOCKOUT_DURATION
          
          return {
            isLocked: true,
            remainingTime: lockUntil - Date.now(),
            attempts: failureCount,
            nextAllowedAttempt: new Date(lockUntil)
          }
        }
        
        return {
          isLocked: false,
          attempts: failureCount
        }
      }
    } catch (error) {
      logger.error('Error checking account lockout', { error })
      // Fail open for availability, but log the issue
      return {
        isLocked: false,
        attempts: 0
      }
    }
  }

  /**
   * Check IP-based rate limiting
   */
  static async checkIPRateLimit(ip: string): Promise<RateLimitStatus> {
    try {
      if (redis) {
        const ipKey = `auth:ip:${ip}`
        const blockKey = `auth:blocked:${ip}`
        
        // Check if IP is blocked
        const blockTime = await redis.get<number>(blockKey)
        if (blockTime && Date.now() < blockTime) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(blockTime),
            retryAfter: Math.ceil((blockTime - Date.now()) / 1000)
          }
        }
        
        // Check rate limit
        const attempts = await redis.get<number>(ipKey) || 0
        
        if (attempts >= this.IP_MAX_ATTEMPTS) {
          // Block the IP
          const blockUntil = Date.now() + this.IP_BLOCK_DURATION
          await redis.set(blockKey, blockUntil, {
            px: this.IP_BLOCK_DURATION
          })
          
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(blockUntil),
            retryAfter: Math.ceil(this.IP_BLOCK_DURATION / 1000)
          }
        }
        
        return {
          allowed: true,
          remaining: this.IP_MAX_ATTEMPTS - attempts,
          resetTime: new Date(Date.now() + this.IP_RATE_LIMIT_WINDOW)
        }
      } else {
        // Memory store fallback
        const key = `ip:${ip}`
        const attempts = (this.memoryStore.get(key) || [])
          .filter((timestamp: number) => 
            Date.now() - timestamp < this.IP_RATE_LIMIT_WINDOW
          )
        
        this.memoryStore.set(key, attempts)
        
        if (attempts.length >= this.IP_MAX_ATTEMPTS) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(Date.now() + this.IP_RATE_LIMIT_WINDOW),
            retryAfter: Math.ceil(this.IP_RATE_LIMIT_WINDOW / 1000)
          }
        }
        
        return {
          allowed: true,
          remaining: this.IP_MAX_ATTEMPTS - attempts.length,
          resetTime: new Date(Date.now() + this.IP_RATE_LIMIT_WINDOW)
        }
      }
    } catch (error) {
      logger.error('Error checking IP rate limit', { error })
      // Fail open for availability
      return {
        allowed: true,
        remaining: this.IP_MAX_ATTEMPTS,
        resetTime: new Date(Date.now() + this.IP_RATE_LIMIT_WINDOW)
      }
    }
  }

  /**
   * Get progressive delay for failed attempts
   */
  static getProgressiveDelay(attempts: number): number {
    if (attempts < 0) return 0
    if (attempts >= this.PROGRESSIVE_DELAYS.length) {
      return this.PROGRESSIVE_DELAYS[this.PROGRESSIVE_DELAYS.length - 1]
    }
    return this.PROGRESSIVE_DELAYS[attempts]
  }

  /**
   * Validate session security
   */
  static async validateSession(
    sessionId: string,
    userId: string,
    request: NextRequest
  ): Promise<SessionValidation> {
    const validation: SessionValidation = {
      isValid: true,
      riskScore: 0,
      flags: []
    }

    try {
      if (redis) {
        const sessionKey = `session:${sessionId}`
        const sessionData = await redis.get<any>(sessionKey)
        
        if (!sessionData) {
          validation.isValid = false
          validation.reason = 'Session not found'
          validation.riskScore = 100
          return validation
        }
        
        // Check session timeout
        const lastActivity = sessionData.lastActivity || sessionData.createdAt
        const sessionAge = Date.now() - sessionData.createdAt
        const inactiveTime = Date.now() - lastActivity
        
        if (sessionAge > this.SESSION_ABSOLUTE_TIMEOUT) {
          validation.isValid = false
          validation.reason = 'Session expired (absolute timeout)'
          validation.riskScore = 80
          return validation
        }
        
        if (inactiveTime > this.SESSION_TIMEOUT) {
          validation.isValid = false
          validation.reason = 'Session expired (inactivity)'
          validation.riskScore = 60
          return validation
        }
        
        // Check concurrent sessions
        const userSessionsKey = `sessions:user:${userId}`
        const userSessions = await redis.smembers(userSessionsKey)
        
        if (userSessions.length > this.CONCURRENT_SESSION_LIMIT) {
          validation.flags.push('excessive_sessions')
          validation.riskScore += 30
        }
        
        // Validate session fingerprint
        const currentFingerprint = this.generateFingerprint(request)
        if (sessionData.fingerprint && sessionData.fingerprint !== currentFingerprint) {
          validation.flags.push('fingerprint_mismatch')
          validation.riskScore += 40
          
          // Check if it's a major change
          if (this.isMajorFingerprintChange(sessionData.fingerprint, currentFingerprint)) {
            validation.isValid = false
            validation.reason = 'Session hijacking detected'
            validation.riskScore = 100
          }
        }
        
        // Update last activity
        await redis.set(sessionKey, {
          ...sessionData,
          lastActivity: Date.now()
        }, {
          px: this.SESSION_ABSOLUTE_TIMEOUT
        })
      }
      
      return validation
    } catch (error) {
      logger.error('Error validating session', { error })
      validation.flags.push('validation_error')
      validation.riskScore += 20
      return validation
    }
  }

  /**
   * Create secure session
   */
  static async createSecureSession(
    userId: string,
    request: NextRequest
  ): Promise<string> {
    const sessionId = this.generateSessionId()
    const fingerprint = this.generateFingerprint(request)
    
    const sessionData = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      fingerprint,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent')
    }
    
    try {
      if (redis) {
        const sessionKey = `session:${sessionId}`
        const userSessionsKey = `sessions:user:${userId}`
        
        // Store session
        await redis.set(sessionKey, sessionData, {
          px: this.SESSION_ABSOLUTE_TIMEOUT
        })
        
        // Track user sessions
        await redis.sadd(userSessionsKey, sessionId)
        await redis.expire(userSessionsKey, this.SESSION_ABSOLUTE_TIMEOUT / 1000)
        
        // Clean old sessions
        await this.cleanUserSessions(userId)
      } else {
        // Memory store fallback
        this.memoryStore.set(`session:${sessionId}`, sessionData)
      }
      
      logger.info('Secure session created', {
        userId,
        sessionId: sessionId.substring(0, 8) + '...',
        ip: sessionData.ip
      })
      
      return sessionId
    } catch (error) {
      logger.error('Error creating secure session', { error })
      throw new Error('Failed to create session')
    }
  }

  /**
   * Destroy session
   */
  static async destroySession(sessionId: string): Promise<void> {
    try {
      if (redis) {
        const sessionKey = `session:${sessionId}`
        const sessionData = await redis.get<any>(sessionKey)
        
        if (sessionData) {
          const userSessionsKey = `sessions:user:${sessionData.userId}`
          await redis.srem(userSessionsKey, sessionId)
        }
        
        await redis.del(sessionKey)
      } else {
        this.memoryStore.delete(`session:${sessionId}`)
      }
      
      logger.info('Session destroyed', {
        sessionId: sessionId.substring(0, 8) + '...'
      })
    } catch (error) {
      logger.error('Error destroying session', { error })
    }
  }

  /**
   * Clean old sessions for user
   */
  private static async cleanUserSessions(userId: string): Promise<void> {
    try {
      if (redis) {
        const userSessionsKey = `sessions:user:${userId}`
        const sessions = await redis.smembers(userSessionsKey)
        
        if (sessions.length > this.CONCURRENT_SESSION_LIMIT) {
          // Get session details and sort by last activity
          const sessionDetails = await Promise.all(
            sessions.map(async (sid) => {
              const data = await redis.get<any>(`session:${sid}`)
              return { id: sid, lastActivity: data?.lastActivity || 0 }
            })
          )
          
          // Sort by last activity (oldest first)
          sessionDetails.sort((a, b) => a.lastActivity - b.lastActivity)
          
          // Remove oldest sessions
          const toRemove = sessionDetails.slice(0, sessions.length - this.CONCURRENT_SESSION_LIMIT)
          for (const session of toRemove) {
            await this.destroySession(session.id)
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning user sessions', { error })
    }
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    const random = Math.random().toString(36).substring(2, 15)
    const timestamp = Date.now().toString(36)
    const hash = createHash('sha256')
      .update(`${random}${timestamp}${Math.random()}`)
      .digest('hex')
    return hash
  }

  /**
   * Generate device fingerprint
   */
  private static generateFingerprint(request?: NextRequest): string {
    if (!request) return 'unknown'
    
    const components = [
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || '',
      request.headers.get('accept') || ''
    ]
    
    return createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Check if fingerprint change is major
   */
  private static isMajorFingerprintChange(old: string, current: string): boolean {
    // Simple comparison for now
    // Could be enhanced with more sophisticated comparison
    return old !== current
  }

  /**
   * Get client IP with proxy support
   */
  private static getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    
    return request.ip || '127.0.0.1'
  }

  /**
   * Hash email for logging
   */
  private static hashEmail(email: string): string {
    return createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex')
      .substring(0, 8)
  }

  /**
   * Clean memory store periodically
   */
  private static cleanMemoryStore(): void {
    const now = Date.now()
    
    for (const [key, value] of this.memoryStore.entries()) {
      if (key.startsWith('attempts:')) {
        const filtered = (value as AuthAttempt[])
          .filter(a => now - a.timestamp < this.LOCKOUT_DURATION)
        
        if (filtered.length === 0) {
          this.memoryStore.delete(key)
        } else {
          this.memoryStore.set(key, filtered)
        }
      }
      
      if (key.startsWith('ip:')) {
        const filtered = (value as number[])
          .filter(t => now - t < this.IP_RATE_LIMIT_WINDOW)
        
        if (filtered.length === 0) {
          this.memoryStore.delete(key)
        } else {
          this.memoryStore.set(key, filtered)
        }
      }
    }
  }

  /**
   * Reset account lockout (admin function)
   */
  static async resetAccountLockout(email: string): Promise<void> {
    try {
      const emailLower = email.toLowerCase()
      
      if (redis) {
        await redis.del(
          `auth:failures:${emailLower}`,
          `auth:locked:${emailLower}`,
          `auth:attempts:${emailLower}`
        )
      } else {
        this.memoryStore.delete(`attempts:${emailLower}`)
      }
      
      logger.info('Account lockout reset', {
        email: this.hashEmail(email)
      })
    } catch (error) {
      logger.error('Error resetting account lockout', { error })
    }
  }

  /**
   * Get authentication metrics
   */
  static async getAuthMetrics(): Promise<{
    lockedAccounts: number
    blockedIPs: number
    activeSessions: number
    failedAttempts24h: number
  }> {
    // Implementation would query Redis for metrics
    return {
      lockedAccounts: 0,
      blockedIPs: 0,
      activeSessions: 0,
      failedAttempts24h: 0
    }
  }
}

export { AuthenticationProtection }
export default AuthenticationProtection