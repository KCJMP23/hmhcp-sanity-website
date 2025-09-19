/**
 * CSRF Rate Limiter
 * Specialized rate limiting for CSRF token operations and validation failures
 * Implements OWASP recommendations for preventing CSRF brute force attacks
 */

import { AdvancedRateLimiter, RateLimitConfig } from './rate-limiting'
import logger from '@/lib/logging/winston-logger'

interface CSRFAttempt {
  timestamp: number
  ip: string
  userAgent?: string
  tokenHash?: string
  success: boolean
}

interface CSRFRateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
  blocked: boolean
  suspiciousActivity: boolean
}

/**
 * CSRF Rate Limiter with enhanced security features
 * - Tracks failed CSRF validation attempts
 * - Implements progressive penalties
 * - Detects token enumeration attacks
 * - Automatic IP blocking for repeated violations
 */
export class CSRFRateLimiter extends AdvancedRateLimiter {
  private csrfAttempts = new Map<string, CSRFAttempt[]>()
  private blockedIPs = new Set<string>()
  private tokenHashes = new Map<string, Set<string>>() // Track token hashes per IP
  private suspiciousIPs = new Map<string, number>() // Suspicious activity scores

  constructor() {
    super({
      windowMs: 15 * 60 * 1000, // 15 minutes window
      maxRequests: 10, // Maximum 10 failed CSRF attempts per window
      skipSuccessfulRequests: true, // Only count failed attempts
      keyGenerator: (ip) => `csrf:${ip}`,
      onLimitReached: (identifier) => {
        this.handleCSRFLimitExceeded(identifier)
      }
    })
  }

  /**
   * Track CSRF validation attempt
   */
  trackCSRFAttempt(
    ip: string, 
    success: boolean, 
    tokenHash?: string, 
    userAgent?: string
  ): CSRFRateLimitResult {
    const key = ip
    const now = Date.now()
    
    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      logger.warn('CSRF attempt from blocked IP', { ip, success })
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (60 * 60 * 1000), // 1 hour
        retryAfter: 60 * 60 * 1000,
        blocked: true,
        suspiciousActivity: true
      }
    }

    // Get or create attempt history
    let attempts = this.csrfAttempts.get(key) || []
    
    // Clean old attempts (older than 1 hour)
    const oneHourAgo = now - (60 * 60 * 1000)
    attempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo)

    // Add current attempt
    const attempt: CSRFAttempt = {
      timestamp: now,
      ip,
      userAgent,
      tokenHash,
      success
    }
    attempts.push(attempt)
    this.csrfAttempts.set(key, attempts)

    // Track token hashes for enumeration detection
    if (tokenHash) {
      if (!this.tokenHashes.has(ip)) {
        this.tokenHashes.set(ip, new Set())
      }
      this.tokenHashes.get(ip)!.add(tokenHash)
    }

    // Analyze attempts for suspicious patterns
    const analysisResult = this.analyzeCSRFAttempts(ip, attempts)
    
    // Update suspicious activity score
    if (!success) {
      const currentScore = this.suspiciousIPs.get(ip) || 0
      this.suspiciousIPs.set(ip, currentScore + analysisResult.suspiciousScore)
    }

    // Check rate limits using base limiter
    const rateLimitResult = this.checkLimit(ip, success)

    return {
      allowed: rateLimitResult.allowed && !analysisResult.shouldBlock,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
      retryAfter: rateLimitResult.retryAfter,
      blocked: analysisResult.shouldBlock,
      suspiciousActivity: analysisResult.suspicious
    }
  }

  /**
   * Analyze CSRF attempts for attack patterns
   */
  private analyzeCSRFAttempts(ip: string, attempts: CSRFAttempt[]): {
    suspicious: boolean
    shouldBlock: boolean
    suspiciousScore: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let suspiciousScore = 0
    let shouldBlock = false

    const recentAttempts = attempts.filter(a => Date.now() - a.timestamp < 5 * 60 * 1000) // Last 5 minutes
    const failedAttempts = attempts.filter(a => !a.success)
    const recentFailures = recentAttempts.filter(a => !a.success)

    // Pattern 1: Too many failures in short time (potential brute force)
    if (recentFailures.length >= 5) {
      reasons.push('Multiple CSRF failures in short time')
      suspiciousScore += 10
      shouldBlock = true
    }

    // Pattern 2: High failure rate overall
    const failureRate = failedAttempts.length / attempts.length
    if (attempts.length >= 10 && failureRate > 0.8) {
      reasons.push('High CSRF failure rate')
      suspiciousScore += 8
    }

    // Pattern 3: Token enumeration (many different token hashes)
    const uniqueTokens = this.tokenHashes.get(ip)?.size || 0
    if (uniqueTokens > 20) {
      reasons.push('Token enumeration detected')
      suspiciousScore += 15
      shouldBlock = true
    }

    // Pattern 4: Rapid-fire attempts (more than 1 per second)
    const rapidAttempts = this.detectRapidFireAttempts(recentAttempts)
    if (rapidAttempts > 10) {
      reasons.push('Rapid-fire CSRF attempts')
      suspiciousScore += 12
      shouldBlock = true
    }

    // Pattern 5: Consistent timing patterns (bot behavior)
    if (this.detectTimingPatterns(attempts)) {
      reasons.push('Consistent timing patterns detected')
      suspiciousScore += 6
    }

    // Pattern 6: No successful attempts despite many tries
    if (attempts.length > 15 && failedAttempts.length === attempts.length) {
      reasons.push('No successful CSRF validations')
      suspiciousScore += 10
      shouldBlock = true
    }

    const suspicious = suspiciousScore > 5 || reasons.length > 2

    if (suspicious || shouldBlock) {
      logger.warn('Suspicious CSRF activity detected', {
        ip,
        suspiciousScore,
        reasons,
        shouldBlock,
        attemptsCount: attempts.length,
        failuresCount: failedAttempts.length,
        uniqueTokens
      })
    }

    return {
      suspicious,
      shouldBlock,
      suspiciousScore,
      reasons
    }
  }

  /**
   * Detect rapid-fire attempts (bot behavior)
   */
  private detectRapidFireAttempts(attempts: CSRFAttempt[]): number {
    let rapidCount = 0
    
    for (let i = 1; i < attempts.length; i++) {
      const timeDiff = attempts[i].timestamp - attempts[i - 1].timestamp
      if (timeDiff < 1000) { // Less than 1 second apart
        rapidCount++
      }
    }
    
    return rapidCount
  }

  /**
   * Detect consistent timing patterns (automated behavior)
   */
  private detectTimingPatterns(attempts: CSRFAttempt[]): boolean {
    if (attempts.length < 5) return false

    const intervals: number[] = []
    for (let i = 1; i < attempts.length; i++) {
      intervals.push(attempts[i].timestamp - attempts[i - 1].timestamp)
    }

    // Calculate variance in intervals
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length
    const standardDeviation = Math.sqrt(variance)

    // If standard deviation is very low, timing is very consistent (suspicious)
    const coefficientOfVariation = standardDeviation / mean
    return coefficientOfVariation < 0.1 && mean > 1000 // Consistent timing with reasonable intervals
  }

  /**
   * Handle when CSRF limit is exceeded
   */
  private handleCSRFLimitExceeded(identifier: string): void {
    const ip = identifier.replace('csrf:', '')
    
    logger.error('CSRF rate limit exceeded', {
      ip,
      action: 'csrf_rate_limit_exceeded'
    })

    // Block IP temporarily
    this.blockIP(ip, 30 * 60 * 1000) // 30 minutes

    // Clear attempts for this IP to reset the counter
    this.csrfAttempts.delete(ip)
  }

  /**
   * Block IP address for CSRF violations
   */
  blockIP(ip: string, duration: number = 60 * 60 * 1000): void {
    this.blockedIPs.add(ip)
    
    logger.error('IP blocked for CSRF violations', {
      ip,
      duration: duration / 1000 / 60, // Duration in minutes
      action: 'ip_blocked_csrf'
    })

    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip)
      logger.info('IP unblocked after CSRF violation timeout', { ip })
    }, duration)

    // Clean up data for blocked IP
    this.csrfAttempts.delete(ip)
    this.tokenHashes.delete(ip)
    this.suspiciousIPs.delete(ip)
  }

  /**
   * Get CSRF security statistics
   */
  getCSRFStats(): {
    totalAttempts: number
    failedAttempts: number
    blockedIPs: number
    suspiciousIPs: number
    uniqueTokensTracked: number
    topSuspiciousIPs: Array<{ ip: string; score: number }>
  } {
    let totalAttempts = 0
    let failedAttempts = 0
    let uniqueTokensTracked = 0

    for (const attempts of this.csrfAttempts.values()) {
      totalAttempts += attempts.length
      failedAttempts += attempts.filter(a => !a.success).length
    }

    for (const tokens of this.tokenHashes.values()) {
      uniqueTokensTracked += tokens.size
    }

    const topSuspiciousIPs = Array.from(this.suspiciousIPs.entries())
      .map(([ip, score]) => ({ ip, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return {
      totalAttempts,
      failedAttempts,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      uniqueTokensTracked,
      topSuspiciousIPs
    }
  }

  /**
   * Check if IP is currently blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }

  /**
   * Get suspicious activity score for IP
   */
  getSuspiciousScore(ip: string): number {
    return this.suspiciousIPs.get(ip) || 0
  }

  /**
   * Manual IP unblock (for admins)
   */
  unblockIP(ip: string): boolean {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip)
      this.csrfAttempts.delete(ip)
      this.tokenHashes.delete(ip)
      this.suspiciousIPs.delete(ip)
      
      logger.info('IP manually unblocked', { ip, action: 'manual_unblock' })
      return true
    }
    return false
  }

  /**
   * Cleanup old data (call periodically)
   */
  cleanup(): void {
    super.cleanup()
    
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)

    // Clean old CSRF attempts
    for (const [ip, attempts] of this.csrfAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo)
      if (recentAttempts.length === 0) {
        this.csrfAttempts.delete(ip)
      } else {
        this.csrfAttempts.set(ip, recentAttempts)
      }
    }

    // Clean old token hashes for IPs with no recent activity
    for (const ip of this.tokenHashes.keys()) {
      if (!this.csrfAttempts.has(ip)) {
        this.tokenHashes.delete(ip)
      }
    }

    // Decay suspicious scores over time
    for (const [ip, score] of this.suspiciousIPs.entries()) {
      const newScore = Math.max(0, score - 1) // Decay by 1 point per cleanup cycle
      if (newScore === 0) {
        this.suspiciousIPs.delete(ip)
      } else {
        this.suspiciousIPs.set(ip, newScore)
      }
    }
  }
}

// Export singleton instance
export const csrfRateLimiter = new CSRFRateLimiter()

// Run cleanup every 10 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    csrfRateLimiter.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * Enhanced CSRF verification with rate limiting
 */
export async function verifyCSRFWithRateLimit(
  request: Request,
  ip?: string
): Promise<{
  valid: boolean
  rateLimited: boolean
  blocked: boolean
  error?: string
}> {
  try {
    const clientIP = ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Import the base CSRF verification
    const { verifyCSRFToken } = await import('./csrf')
    
    // Attempt CSRF verification
    const csrfValid = await verifyCSRFToken(request)
    const userAgent = request.headers.get('user-agent')
    
    // Create a hash of the CSRF token for tracking (don't store actual token)
    let tokenHash: string | undefined
    try {
      const csrfToken = request.headers.get('x-csrf-token') || 
        (await request.clone().json()).csrfToken
      if (csrfToken && typeof csrfToken === 'string') {
        const encoder = new TextEncoder()
        const data = encoder.encode(csrfToken)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        tokenHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 16) // First 16 chars of hash
      }
    } catch {
      // Ignore token hash creation errors
    }

    // Track the attempt
    const result = csrfRateLimiter.trackCSRFAttempt(
      clientIP,
      csrfValid,
      tokenHash,
      userAgent?.substring(0, 200)
    )

    if (result.blocked) {
      return {
        valid: false,
        rateLimited: false,
        blocked: true,
        error: 'IP blocked due to suspicious CSRF activity'
      }
    }

    if (!result.allowed) {
      return {
        valid: false,
        rateLimited: true,
        blocked: false,
        error: 'CSRF validation rate limit exceeded'
      }
    }

    return {
      valid: csrfValid,
      rateLimited: false,
      blocked: false
    }

  } catch (error) {
    logger.error('CSRF rate limit verification error', { error })
    return {
      valid: false,
      rateLimited: false,
      blocked: false,
      error: 'CSRF verification failed'
    }
  }
}

export default csrfRateLimiter