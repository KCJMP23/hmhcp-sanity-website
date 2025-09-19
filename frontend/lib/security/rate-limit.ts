/**
 * Rate Limiting Service
 * Healthcare platform rate limiting and throttling
 */

import { logger } from '@/lib/logging/client-safe-logger'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: any) => string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class RateLimitService {
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }

  private static readonly rateLimitStore = new Map<string, {
    count: number
    resetTime: number
  }>()

  /**
   * Check rate limit
   */
  static checkLimit(
    key: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    const now = Date.now()
    const windowStart = now - finalConfig.windowMs

    // Clean up expired entries
    this.cleanupExpiredEntries(windowStart)

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key)
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + finalConfig.windowMs
      }
      this.rateLimitStore.set(key, entry)
    }

    // Check if limit exceeded
    const allowed = entry.count < finalConfig.maxRequests
    const remaining = Math.max(0, finalConfig.maxRequests - entry.count)
    const resetTime = entry.resetTime

    if (allowed) {
      entry.count++
    }

    const result: RateLimitResult = {
      allowed,
      remaining,
      resetTime
    }

    if (!allowed) {
      result.retryAfter = Math.ceil((resetTime - now) / 1000)
    }

    logger.debug('Rate limit check', {
      key,
      allowed,
      remaining,
      resetTime: new Date(resetTime).toISOString(),
      retryAfter: result.retryAfter
    })

    return result
  }

  /**
   * Check rate limit for API endpoint
   */
  static checkAPILimit(
    endpoint: string,
    ip: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `api:${endpoint}:${ip}`
    return this.checkLimit(key, config)
  }

  /**
   * Check rate limit for admin operations
   */
  static checkAdminLimit(
    operation: string,
    userId: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `admin:${operation}:${userId}`
    return this.checkLimit(key, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 50,
      ...config
    })
  }

  /**
   * Check rate limit for authentication
   */
  static checkAuthLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `auth:${identifier}`
    return this.checkLimit(key, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      ...config
    })
  }

  /**
   * Check rate limit for password reset
   */
  static checkPasswordResetLimit(
    email: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `password-reset:${email}`
    return this.checkLimit(key, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      ...config
    })
  }

  /**
   * Check rate limit for email sending
   */
  static checkEmailLimit(
    email: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `email:${email}`
    return this.checkLimit(key, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      ...config
    })
  }

  /**
   * Check rate limit for file upload
   */
  static checkUploadLimit(
    userId: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `upload:${userId}`
    return this.checkLimit(key, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20,
      ...config
    })
  }

  /**
   * Check rate limit for search operations
   */
  static checkSearchLimit(
    userId: string,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitResult {
    const key = `search:${userId}`
    return this.checkLimit(key, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      ...config
    })
  }

  /**
   * Reset rate limit for a key
   */
  static resetLimit(key: string): void {
    this.rateLimitStore.delete(key)
    logger.info('Rate limit reset', { key })
  }

  /**
   * Get rate limit status
   */
  static getStatus(key: string): RateLimitResult | null {
    const entry = this.rateLimitStore.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    const allowed = entry.count < 100 // Default max requests
    const remaining = Math.max(0, 100 - entry.count)
    const resetTime = entry.resetTime

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000)
    }
  }

  /**
   * Clean up expired entries
   */
  private static cleanupExpiredEntries(windowStart: number): void {
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime < windowStart) {
        this.rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Get all active rate limits
   */
  static getAllActiveLimits(): Array<{ key: string; count: number; resetTime: number }> {
    const now = Date.now()
    const activeLimits: Array<{ key: string; count: number; resetTime: number }> = []

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime > now) {
        activeLimits.push({
          key,
          count: entry.count,
          resetTime: entry.resetTime
        })
      }
    }

    return activeLimits
  }

  /**
   * Clear all rate limits
   */
  static clearAllLimits(): void {
    this.rateLimitStore.clear()
    logger.info('All rate limits cleared')
  }
}

// Export a default instance for convenience
export const apiRateLimiter = {
  checkLimit: (key: string, config?: Partial<RateLimitConfig>) => 
    RateLimitService.checkAPILimit('default', key, config)
}

export default RateLimitService

// Export functions for backward compatibility
export const rateLimit = RateLimitService;
