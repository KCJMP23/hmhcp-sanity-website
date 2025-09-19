/**
 * Advanced Admin Rate Limiting Middleware
 * Comprehensive rate limiting implementation with monitoring, alerting, and security features
 * for healthcare platform admin operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminRateLimiter, OperationType, RiskLevel } from './admin-rate-limiter'
import { AdminRole } from '@/lib/dal/admin/types'
import { logger } from '@/lib/logging/client-safe-logger'

// Rate limiting response headers
interface RateLimitHeaders {
  'X-RateLimit-Limit': string
  'X-RateLimit-Remaining': string
  'X-RateLimit-Reset': string
  'X-RateLimit-Reset-After': string
  'X-RateLimit-Policy': string
  'Retry-After'?: string
}

// Alert thresholds for monitoring
const ALERT_THRESHOLDS = {
  ABUSE_PATTERN: 10, // Multiple rate limit violations
  HIGH_REQUEST_VOLUME: 100, // High request volume in short time
  SUSPICIOUS_IP: 5, // IP hitting multiple rate limits
  ACCOUNT_COMPROMISE_INDICATOR: 50 // Unusual activity patterns
}

// Security monitoring state
interface SecurityState {
  suspiciousIPs: Map<string, SuspiciousActivity>
  abusePatterns: Map<string, AbusePattern>
  alerts: SecurityAlert[]
}

interface SuspiciousActivity {
  violations: number
  firstViolation: number
  lastViolation: number
  endpoints: Set<string>
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface AbusePattern {
  userId: string
  violations: number
  operations: OperationType[]
  firstDetection: number
  lastDetection: number
  blocked: boolean
}

interface SecurityAlert {
  id: string
  type: 'RATE_LIMIT_ABUSE' | 'SUSPICIOUS_IP' | 'ACCOUNT_COMPROMISE' | 'DDOS_ATTEMPT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  details: Record<string, any>
  timestamp: number
  acknowledged: boolean
}

class AdminRateLimitMonitor {
  private securityState: SecurityState = {
    suspiciousIPs: new Map(),
    abusePatterns: new Map(),
    alerts: []
  }

  /**
   * Record rate limit violation and analyze patterns
   */
  recordViolation(
    userId: string, 
    role: AdminRole,
    ip: string, 
    path: string, 
    operation: OperationType
  ): void {
    // Track suspicious IP activity
    this.trackSuspiciousIP(ip, path, operation)
    
    // Track user abuse patterns
    this.trackAbusePattern(userId, role, operation)
    
    // Check for alerts
    this.checkSecurityAlerts(userId, role, ip, path, operation)
  }

  private trackSuspiciousIP(ip: string, path: string, operation: OperationType): void {
    const existing = this.securityState.suspiciousIPs.get(ip) || {
      violations: 0,
      firstViolation: Date.now(),
      lastViolation: Date.now(),
      endpoints: new Set(),
      severity: 'LOW' as const
    }

    existing.violations += 1
    existing.lastViolation = Date.now()
    existing.endpoints.add(path)

    // Determine severity based on violations and endpoint diversity
    if (existing.violations >= 50 || existing.endpoints.size >= 10) {
      existing.severity = 'CRITICAL'
    } else if (existing.violations >= 20 || existing.endpoints.size >= 5) {
      existing.severity = 'HIGH'
    } else if (existing.violations >= 10 || existing.endpoints.size >= 3) {
      existing.severity = 'MEDIUM'
    }

    this.securityState.suspiciousIPs.set(ip, existing)

    // Trigger alerts for high severity
    if (existing.severity === 'CRITICAL' && existing.violations === 50) {
      this.createAlert({
        type: 'SUSPICIOUS_IP',
        severity: 'CRITICAL',
        message: `IP ${ip} has exceeded critical rate limit violation threshold`,
        details: {
          ip,
          violations: existing.violations,
          endpoints: Array.from(existing.endpoints),
          timespan: Date.now() - existing.firstViolation
        }
      })
    }
  }

  private trackAbusePattern(userId: string, role: AdminRole, operation: OperationType): void {
    const existing = this.securityState.abusePatterns.get(userId) || {
      userId,
      violations: 0,
      operations: [],
      firstDetection: Date.now(),
      lastDetection: Date.now(),
      blocked: false
    }

    existing.violations += 1
    existing.lastDetection = Date.now()
    if (!existing.operations.includes(operation)) {
      existing.operations.push(operation)
    }

    this.securityState.abusePatterns.set(userId, existing)

    // Check if user should be blocked
    if (adminRateLimiter.shouldBlockUser(userId) && !existing.blocked) {
      existing.blocked = true
      adminRateLimiter.blockUser(userId, role, 3600000) // Block for 1 hour

      this.createAlert({
        type: 'ACCOUNT_COMPROMISE',
        severity: 'HIGH',
        message: `User ${userId} automatically blocked due to abuse patterns`,
        details: {
          userId,
          role,
          violations: existing.violations,
          operations: existing.operations,
          timespan: Date.now() - existing.firstDetection
        }
      })
    }
  }

  private checkSecurityAlerts(
    userId: string, 
    role: AdminRole, 
    ip: string, 
    path: string, 
    operation: OperationType
  ): void {
    // Check for potential DDoS from multiple IPs
    const recentViolations = Array.from(this.securityState.suspiciousIPs.values())
      .filter(activity => Date.now() - activity.lastViolation < 300000) // Last 5 minutes
      .length

    if (recentViolations >= 20) {
      this.createAlert({
        type: 'DDOS_ATTEMPT',
        severity: 'CRITICAL',
        message: 'Potential DDoS attack detected - multiple IPs exceeding rate limits',
        details: {
          affectedIPs: recentViolations,
          timeWindow: 300000,
          timestamp: Date.now()
        }
      })
    }
  }

  private createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: SecurityAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false
    }

    this.securityState.alerts.push(alert)

    // Keep only last 1000 alerts
    if (this.securityState.alerts.length > 1000) {
      this.securityState.alerts = this.securityState.alerts.slice(-1000)
    }

    // Log critical alerts
    if (alert.severity === 'CRITICAL') {
      logger.error('Critical security alert', {
        alertId: alert.id,
        type: alert.type,
        message: alert.message,
        details: alert.details
      })
    } else {
      logger.warn('Security alert generated', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message
      })
    }
  }

  /**
   * Get security state for monitoring dashboard
   */
  getSecurityState(): SecurityState {
    return {
      suspiciousIPs: new Map(this.securityState.suspiciousIPs),
      abusePatterns: new Map(this.securityState.abusePatterns),
      alerts: [...this.securityState.alerts]
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.securityState.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      logger.info('Security alert acknowledged', {
        alertId,
        acknowledgedBy,
        alertType: alert.type
      })
      return true
    }
    return false
  }

  /**
   * Clear old security data
   */
  cleanupOldData(): void {
    const now = Date.now()
    const twoHoursAgo = now - 7200000 // 2 hours

    // Clean up suspicious IPs
    for (const [ip, activity] of this.securityState.suspiciousIPs.entries()) {
      if (activity.lastViolation < twoHoursAgo) {
        this.securityState.suspiciousIPs.delete(ip)
      }
    }

    // Clean up abuse patterns
    for (const [userId, pattern] of this.securityState.abusePatterns.entries()) {
      if (pattern.lastDetection < twoHoursAgo && !pattern.blocked) {
        this.securityState.abusePatterns.delete(userId)
      }
    }

    // Clean up old alerts (keep for 24 hours)
    const oneDayAgo = now - 86400000
    this.securityState.alerts = this.securityState.alerts.filter(
      alert => alert.timestamp > oneDayAgo
    )
  }
}

// Global monitor instance
const rateLimitMonitor = new AdminRateLimitMonitor()

// Clean up old data every 30 minutes
setInterval(() => {
  rateLimitMonitor.cleanupOldData()
}, 1800000) // 30 minutes

/**
 * Extract client IP from request
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
 * Generate rate limiting response headers
 */
function generateRateLimitHeaders(
  userResult: { limit: number; remaining: number; resetTime: number },
  ipResult: { limit: number; remaining: number; resetTime: number },
  operation: OperationType,
  role: AdminRole
): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': Math.min(userResult.limit, ipResult.limit).toString(),
    'X-RateLimit-Remaining': Math.min(userResult.remaining, ipResult.remaining).toString(),
    'X-RateLimit-Reset': Math.max(userResult.resetTime, ipResult.resetTime).toString(),
    'X-RateLimit-Reset-After': Math.ceil((Math.max(userResult.resetTime, ipResult.resetTime) - Date.now()) / 1000).toString(),
    'X-RateLimit-Policy': `${operation}:${role}`
  }

  return headers
}

/**
 * Advanced rate limiting middleware for admin endpoints
 */
export async function withAdvancedRateLimit(
  request: NextRequest,
  userId: string,
  role: AdminRole,
  bypass?: boolean
): Promise<{ allowed: boolean; response?: NextResponse; headers: RateLimitHeaders }> {
  // Allow bypass for system operations or emergency access
  if (bypass) {
    logger.info('Rate limit bypassed', { userId, role, path: request.nextUrl.pathname })
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': '∞',
        'X-RateLimit-Remaining': '∞',
        'X-RateLimit-Reset': (Date.now() + 60000).toString(),
        'X-RateLimit-Reset-After': '60',
        'X-RateLimit-Policy': 'bypass'
      }
    }
  }

  const ip = getClientIP(request)
  const path = request.nextUrl.pathname
  const method = request.method

  try {
    // Check both user and IP rate limits
    const [userResult, ipResult] = await Promise.all([
      adminRateLimiter.checkUserRateLimit(userId, role, path, method),
      adminRateLimiter.checkIPRateLimit(ip, path)
    ])

    const headers = generateRateLimitHeaders(userResult, ipResult, 
      adminRateLimiter['determineOperationType'](path, method), role)

    // If either limit is exceeded, deny the request
    if (!userResult.success || !ipResult.success) {
      const blockedBy = !userResult.success ? 'user' : 'ip'
      const result = !userResult.success ? userResult : ipResult

      // Record the violation for monitoring
      rateLimitMonitor.recordViolation(
        userId, 
        role, 
        ip, 
        path, 
        adminRateLimiter['determineOperationType'](path, method)
      )

      logger.warn('Admin rate limit exceeded', {
        userId,
        role,
        ip,
        path,
        method,
        blockedBy,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime
      })

      const retryAfter = result.retryAfter || Math.ceil((result.resetTime - Date.now()) / 1000)

      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. You have exceeded the rate limit for ${blockedBy === 'user' ? 'your account' : 'this IP address'}.`,
          code: 'RATE_LIMITED',
          details: {
            blockedBy,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString(),
            retryAfter
          }
        },
        { 
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString()
          }
        }
      )

      return {
        allowed: false,
        response,
        headers: { ...headers, 'Retry-After': retryAfter.toString() }
      }
    }

    // Request is allowed
    logger.debug('Rate limit check passed', {
      userId,
      role,
      ip,
      path,
      method,
      userRemaining: userResult.remaining,
      ipRemaining: ipResult.remaining
    })

    return {
      allowed: true,
      headers
    }

  } catch (error) {
    logger.error('Rate limit check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      role,
      ip,
      path,
      method
    })

    // Fail open with conservative limits in case of error
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': (Date.now() + 60000).toString(),
        'X-RateLimit-Reset-After': '60',
        'X-RateLimit-Policy': 'fallback'
      }
    }
  }
}

/**
 * Middleware wrapper for easy integration with existing API routes
 */
export function createRateLimitMiddleware(options: {
  bypass?: (request: NextRequest) => boolean
  onViolation?: (violation: RateLimitViolation) => void
}) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    userId: string,
    role: AdminRole
  ): Promise<NextResponse | null> {
    const shouldBypass = options.bypass?.(request) || false
    
    const result = await withAdvancedRateLimit(request, userId, role, shouldBypass)
    
    if (!result.allowed && result.response) {
      // Call violation callback if provided
      options.onViolation?.({
        userId,
        role,
        ip: getClientIP(request),
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: Date.now()
      })
      
      return result.response
    }

    return null // Continue processing
  }
}

// Rate limiting violation interface
interface RateLimitViolation {
  userId: string
  role: AdminRole
  ip: string
  path: string
  method: string
  timestamp: number
}

// Export monitoring functions
export const rateLimitingMonitor = {
  getSecurityState: () => rateLimitMonitor.getSecurityState(),
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) => 
    rateLimitMonitor.acknowledgeAlert(alertId, acknowledgedBy),
  getMetrics: () => adminRateLimiter.getMetrics(),
  resetUserLimits: (userId: string, role: AdminRole) => 
    adminRateLimiter.resetUserLimits(userId, role),
  blockUser: (userId: string, role: AdminRole, durationMs?: number) => 
    adminRateLimiter.blockUser(userId, role, durationMs),
  blockIP: (ip: string, durationMs?: number) => 
    adminRateLimiter.blockIP(ip, durationMs)
}

// Export types
export type { 
  SecurityAlert, 
  SuspiciousActivity, 
  AbusePattern, 
  RateLimitViolation, 
  RateLimitHeaders 
}